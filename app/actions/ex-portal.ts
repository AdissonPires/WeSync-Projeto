"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { hrRequestSchema, signLegalTermSchema, rejectLegalTermSchema } from "@/lib/validations";
import { getClientIp } from "@/lib/request-info";

export async function getExPortalData(accessToken: string) {
  const access = await prisma.exPortalAccess.findUnique({
    where: { accessToken },
    include: {
      offboardingSession: {
        include: {
          fiscalDocuments: { orderBy: [{ year: "desc" }, { uploadedAt: "desc" }] },
          legalTerms: { orderBy: { createdAt: "asc" } },
          hrRequests: { orderBy: { createdAt: "desc" } },
        },
      },
    },
  });
  if (!access) return null;

  return {
    active: access.active,
    employeeName: access.offboardingSession.employeeName,
    role: access.offboardingSession.role,
    department: access.offboardingSession.department,
    fiscalDocuments: access.offboardingSession.fiscalDocuments,
    legalTerms: access.offboardingSession.legalTerms,
    hrRequests: access.offboardingSession.hrRequests,
  };
}

export type ExPortalData = NonNullable<Awaited<ReturnType<typeof getExPortalData>>>;

async function resolveSession(accessToken: string) {
  const access = await prisma.exPortalAccess.findUnique({
    where: { accessToken },
    include: { offboardingSession: { select: { id: true, orgId: true } } },
  });
  if (!access || !access.active) return null;
  return access.offboardingSession;
}

export async function submitHRRequest(input: unknown): Promise<ActionResult> {
  const parsed = hrRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }
  try {
    const session = await resolveSession(parsed.data.accessToken);
    if (!session) return fail("Acesso inválido ou expirado.");

    await prisma.hRRequest.create({
      data: {
        offboardingSessionId: session.id,
        type: parsed.data.type,
        message: parsed.data.message,
      },
    });

    revalidatePath("/legal");
    return ok();
  } catch (error) {
    console.error(error);
    return fail("Não foi possível enviar sua solicitação. Tente novamente.");
  }
}

export async function signLegalTerm(input: unknown): Promise<ActionResult> {
  const parsed = signLegalTermSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }
  try {
    const session = await resolveSession(parsed.data.accessToken);
    if (!session) return fail("Acesso inválido ou expirado.");

    const term = await prisma.legalTerm.findFirst({
      where: { id: parsed.data.legalTermId, offboardingSessionId: session.id },
    });
    if (!term) return fail("Termo não encontrado.");
    if (term.status !== "PENDING") return fail("Este termo já foi processado anteriormente.");

    const ip = await getClientIp();

    await prisma.$transaction([
      prisma.legalTerm.update({
        where: { id: term.id },
        data: {
          status: "SIGNED",
          signerName: parsed.data.signerName,
          signerIp: ip,
          signedAt: new Date(),
        },
      }),
      prisma.auditLog.create({
        data: {
          orgId: session.orgId,
          offboardingSessionId: session.id,
          actor: parsed.data.signerName,
          action: "sign_legal_term",
          targetLabel: term.title,
          ipAddress: ip,
          details: `Termo "${term.title}" assinado digitalmente.`,
        },
      }),
    ]);

    revalidatePath("/legal");
    return ok();
  } catch (error) {
    console.error(error);
    return fail("Não foi possível registrar a assinatura. Tente novamente.");
  }
}

export async function rejectLegalTerm(input: unknown): Promise<ActionResult> {
  const parsed = rejectLegalTermSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }
  try {
    const session = await resolveSession(parsed.data.accessToken);
    if (!session) return fail("Acesso inválido ou expirado.");

    const term = await prisma.legalTerm.findFirst({
      where: { id: parsed.data.legalTermId, offboardingSessionId: session.id },
    });
    if (!term) return fail("Termo não encontrado.");
    if (term.status !== "PENDING") return fail("Este termo já foi processado anteriormente.");

    const ip = await getClientIp();

    await prisma.$transaction([
      prisma.legalTerm.update({
        where: { id: term.id },
        data: { status: "REJECTED", rejectedAt: new Date(), rejectionReason: parsed.data.reason },
      }),
      prisma.auditLog.create({
        data: {
          orgId: session.orgId,
          offboardingSessionId: session.id,
          actor: "ex-colaborador",
          action: "reject_legal_term",
          targetLabel: term.title,
          ipAddress: ip,
          details: `Termo "${term.title}" rejeitado: ${parsed.data.reason}`,
        },
      }),
    ]);

    revalidatePath("/legal");
    return ok();
  } catch (error) {
    console.error(error);
    return fail("Não foi possível registrar a rejeição. Tente novamente.");
  }
}
