"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { getSessionUser } from "@/lib/auth/session";

const CAN_MANAGE_LEGAL = ["ADMIN", "IT_ADMIN", "HR_MANAGER"];

export async function resendSignatureRequest(legalTermId: string): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return fail("Não autenticado.");
  if (!CAN_MANAGE_LEGAL.includes(user.role)) return fail("Sem permissão para esta ação.");

  try {
    const term = await prisma.legalTerm.findFirst({
      where: { id: legalTermId, offboardingSession: { orgId: user.orgId } },
      include: { offboardingSession: true },
    });
    if (!term) return fail("Termo não encontrado.");

    // Simula o disparo do e-mail com o link do portal para o e-mail pessoal do ex-colaborador.
    await prisma.auditLog.create({
      data: {
        orgId: user.orgId,
        offboardingSessionId: term.offboardingSessionId,
        actor: user.name ?? user.email,
        action: "resend_signature_request",
        targetLabel: term.title,
        details: `Link de assinatura reenviado para ${term.offboardingSession.email}.`,
      },
    });

    revalidatePath("/legal");
    revalidatePath("/compliance");
    return ok();
  } catch (error) {
    console.error(error);
    return fail("Não foi possível reenviar a solicitação.");
  }
}

export async function uploadFiscalDocument(formData: FormData): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return fail("Não autenticado.");
  if (!CAN_MANAGE_LEGAL.includes(user.role)) return fail("Sem permissão para esta ação.");

  try {
    const offboardingSessionId = formData.get("offboardingSessionId");
    const type = formData.get("type");
    const title = formData.get("title");
    const yearRaw = formData.get("year");
    const file = formData.get("file");

    if (typeof offboardingSessionId !== "string" || !offboardingSessionId) {
      return fail("Selecione o colaborador.");
    }
    if (type !== "INCOME_REPORT" && type !== "PAYSLIP") {
      return fail("Selecione o tipo de documento.");
    }
    if (typeof title !== "string" || !title.trim()) {
      return fail("Informe um título para o documento.");
    }
    if (!(file instanceof File) || file.size === 0) {
      return fail("Selecione um arquivo PDF.");
    }

    const session = await prisma.offboardingSession.findFirst({
      where: { id: offboardingSessionId, orgId: user.orgId },
      select: { id: true },
    });
    if (!session) return fail("Colaborador não encontrado.");

    const buffer = Buffer.from(await file.arrayBuffer());
    const year = typeof yearRaw === "string" && yearRaw ? Number(yearRaw) : null;

    await prisma.fiscalDocument.create({
      data: {
        offboardingSessionId,
        type,
        title,
        year,
        fileName: file.name,
        mimeType: file.type || "application/pdf",
        content: buffer,
      },
    });

    revalidatePath("/legal");
    return ok();
  } catch (error) {
    console.error(error);
    return fail("Não foi possível enviar o documento.");
  }
}

export async function resolveHRRequest(id: string): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return fail("Não autenticado.");
  if (!CAN_MANAGE_LEGAL.includes(user.role)) return fail("Sem permissão para esta ação.");

  try {
    const result = await prisma.hRRequest.updateMany({
      where: { id, offboardingSession: { orgId: user.orgId } },
      data: { status: "RESOLVED", resolvedAt: new Date() },
    });
    if (result.count === 0) return fail("Solicitação não encontrada.");

    revalidatePath("/legal");
    return ok();
  } catch (error) {
    console.error(error);
    return fail("Não foi possível atualizar a solicitação.");
  }
}
