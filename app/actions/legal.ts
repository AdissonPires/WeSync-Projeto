"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ok, fail, type ActionResult } from "@/lib/action-result";

export async function resendSignatureRequest(legalTermId: string): Promise<ActionResult> {
  try {
    const term = await prisma.legalTerm.findUnique({
      where: { id: legalTermId },
      include: { offboardingSession: true },
    });
    if (!term) return fail("Termo não encontrado.");

    // Simula o disparo do e-mail com o link do portal para o e-mail pessoal do ex-colaborador.
    await prisma.auditLog.create({
      data: {
        offboardingSessionId: term.offboardingSessionId,
        actor: "RH",
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
  try {
    await prisma.hRRequest.update({
      where: { id },
      data: { status: "RESOLVED", resolvedAt: new Date() },
    });
    revalidatePath("/legal");
    return ok();
  } catch (error) {
    console.error(error);
    return fail("Não foi possível atualizar a solicitação.");
  }
}
