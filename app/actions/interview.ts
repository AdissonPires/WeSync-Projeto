"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { exitInterviewSchema } from "@/lib/validations";
import { generateExitReport } from "@/lib/ai/generate-exit-report";
import { getTemplateForDepartment } from "@/app/actions/templates";
import type { TemplateStep } from "@/lib/interview-template";

export interface InterviewTokenInfo {
  employeeName: string;
  role: string;
  department: string;
  companyName: string;
  valid: boolean;
  reason?: "not_found" | "expired" | "used";
  templateTitle?: string;
  steps?: TemplateStep[];
}

export async function getInterviewByToken(token: string): Promise<InterviewTokenInfo | null> {
  const interviewToken = await prisma.interviewToken.findUnique({
    where: { token },
    include: { offboardingSession: true },
  });

  if (!interviewToken) return null;

  const base = {
    employeeName: interviewToken.offboardingSession.employeeName,
    role: interviewToken.offboardingSession.role,
    department: interviewToken.offboardingSession.department,
    companyName: "wedpp",
  };

  if (interviewToken.used) {
    return { ...base, valid: false, reason: "used" };
  }
  if (interviewToken.expiresAt < new Date()) {
    return { ...base, valid: false, reason: "expired" };
  }

  const template = await getTemplateForDepartment(
    interviewToken.offboardingSession.orgId,
    interviewToken.offboardingSession.department
  );

  return { ...base, valid: true, templateTitle: template.title, steps: template.steps };
}

export async function submitEmployeeExitInterview(input: unknown): Promise<ActionResult> {
  const parsed = exitInterviewSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }

  try {
    const { token, answers, voiceTranscript } = parsed.data;

    const interviewToken = await prisma.interviewToken.findUnique({
      where: { token },
      include: { offboardingSession: true },
    });

    if (!interviewToken) return fail("Link de entrevista inválido.");
    if (interviewToken.used) return fail("Esta entrevista já foi enviada anteriormente.");
    if (interviewToken.expiresAt < new Date()) return fail("Este link de entrevista expirou.");

    const session = interviewToken.offboardingSession;
    const template = await getTemplateForDepartment(session.orgId, session.department);

    const missing = template.steps
      .flatMap((step) => step.questions)
      .find((q) => !answers[q.id] || answers[q.id].trim().length === 0);
    if (missing) return fail(`Responda a pergunta "${missing.label}" antes de enviar.`);

    await prisma.$transaction([
      prisma.exitInterviewResponse.create({
        data: {
          offboardingSessionId: session.id,
          templateSnapshot: template.steps as unknown as Prisma.InputJsonValue,
          answers: answers as unknown as Prisma.InputJsonValue,
          voiceTranscript: voiceTranscript || null,
        },
      }),
      prisma.interviewToken.update({
        where: { id: interviewToken.id },
        data: { used: true },
      }),
      prisma.knowledgeDocument.create({
        data: {
          offboardingSessionId: session.id,
          title: `Manual de Processos — ${session.role}`,
          department: session.department,
          markdownContent: "",
          status: "PROCESSING",
        },
      }),
      prisma.offboardingSession.update({
        where: { id: session.id },
        data: { status: "IT_ACTION" },
      }),
    ]);

    // Fire-and-forget: process the AI report in the background so the
    // employee gets an instant confirmation without waiting on the LLM call.
    processExitReport(session.id, {
      employeeName: session.employeeName,
      role: session.role,
      department: session.department,
      steps: template.steps,
      answers,
      voiceTranscript,
    }).catch((error) => console.error("Falha ao gerar relatório de IA:", error));

    revalidatePath("/");
    revalidatePath("/knowledge");
    revalidatePath("/analytics");

    return ok();
  } catch (error) {
    console.error(error);
    return fail("Não foi possível enviar a entrevista. Tente novamente.");
  }
}

async function processExitReport(
  sessionId: string,
  responses: Parameters<typeof generateExitReport>[0]
) {
  try {
    const markdown = await generateExitReport(responses);
    await prisma.knowledgeDocument.update({
      where: { offboardingSessionId: sessionId },
      data: { markdownContent: markdown, status: "READY" },
    });
  } catch (error) {
    await prisma.knowledgeDocument.update({
      where: { offboardingSessionId: sessionId },
      data: {
        markdownContent:
          "# Falha ao gerar relatório\n\nHouve um erro ao processar a entrevista com a IA. Edite este documento manualmente ou tente reprocessar.",
        status: "READY",
      },
    });
    throw error;
  }
}
