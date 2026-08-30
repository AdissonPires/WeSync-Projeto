"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { createOffboardingSchema } from "@/lib/validations";
import { addAssetSchema } from "@/lib/validations";

const DEFAULT_ASSETS: { type: "NOTEBOOK" | "MONITOR" | "PERIPHERAL" | "BADGE"; serialNumber: string }[] = [
  { type: "NOTEBOOK", serialNumber: "A definir" },
  { type: "BADGE", serialNumber: "Crachá de acesso" },
];

export async function createOffboarding(
  input: unknown
): Promise<ActionResult<{ sessionId: string; interviewToken: string }>> {
  const parsed = createOffboardingSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }

  try {
    const { employeeName, email, role, department, exitDate, accessToRevoke } = parsed.data;

    const session = await prisma.offboardingSession.create({
      data: {
        employeeName,
        email,
        role,
        department,
        exitDate: new Date(exitDate),
        assets: { create: DEFAULT_ASSETS },
        accessRevocations: {
          create: accessToRevoke.map((provider) => ({
            provider: mapAccessLabelToProvider(provider),
          })),
        },
        tasks: {
          create: [
            {
              title: `Aprovar relatório de saída — ${employeeName}`,
              description: "Relatório de transferência de conhecimento pronto para revisão.",
            },
          ],
        },
      },
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    const interviewToken = await prisma.interviewToken.create({
      data: {
        offboardingSessionId: session.id,
        expiresAt,
      },
    });

    revalidatePath("/offboardings");
    revalidatePath("/");

    return ok({ sessionId: session.id, interviewToken: interviewToken.token });
  } catch (error) {
    console.error(error);
    return fail("Não foi possível criar o desligamento. Tente novamente.");
  }
}

export async function cancelOffboarding(sessionId: string): Promise<ActionResult> {
  try {
    await prisma.offboardingSession.update({
      where: { id: sessionId },
      data: { status: "CANCELLED" },
    });
    revalidatePath("/offboardings");
    revalidatePath(`/offboardings/${sessionId}`);
    revalidatePath("/");
    return ok();
  } catch (error) {
    console.error(error);
    return fail("Não foi possível cancelar o processo.");
  }
}

export async function updateAssetStatus(
  assetId: string,
  status: "RETURNED" | "DAMAGED" | "PENDING_RETURN"
): Promise<ActionResult> {
  try {
    const asset = await prisma.asset.update({
      where: { id: assetId },
      data: { status },
    });
    revalidatePath(`/offboardings/${asset.offboardingSessionId}`);
    revalidatePath("/offboardings");
    return ok();
  } catch (error) {
    console.error(error);
    return fail("Não foi possível atualizar o status do ativo.");
  }
}

export async function addAsset(input: unknown): Promise<ActionResult> {
  const parsed = addAssetSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }
  try {
    await prisma.asset.create({ data: parsed.data });
    revalidatePath(`/offboardings/${parsed.data.offboardingSessionId}`);
    return ok();
  } catch (error) {
    console.error(error);
    return fail("Não foi possível adicionar o ativo.");
  }
}

export async function toggleTask(taskId: string, done: boolean): Promise<ActionResult> {
  try {
    await prisma.pendingTask.update({ where: { id: taskId }, data: { done } });
    revalidatePath("/");
    return ok();
  } catch (error) {
    console.error(error);
    return fail("Não foi possível atualizar a tarefa.");
  }
}

function mapAccessLabelToProvider(label: string) {
  const map: Record<
    string,
    "GOOGLE_WORKSPACE" | "MICROSOFT_ENTRA" | "SLACK" | "GITHUB" | "OKTA" | "NOTION" | "FIGMA"
  > = {
    "Google Workspace": "GOOGLE_WORKSPACE",
    "Microsoft Entra ID": "MICROSOFT_ENTRA",
    Slack: "SLACK",
    GitHub: "GITHUB",
    Okta: "OKTA",
    Notion: "NOTION",
    Figma: "FIGMA",
  };
  return map[label] ?? "GITHUB";
}
