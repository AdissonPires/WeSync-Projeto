"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { updateKnowledgeDocumentSchema } from "@/lib/validations";
import { getSessionUser } from "@/lib/auth/session";

export async function updateKnowledgeDocument(input: unknown): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return fail("Não autenticado.");

  const parsed = updateKnowledgeDocumentSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }
  try {
    const result = await prisma.knowledgeDocument.updateMany({
      where: { id: parsed.data.id, offboardingSession: { orgId: user.orgId } },
      data: { markdownContent: parsed.data.markdownContent },
    });
    if (result.count === 0) return fail("Documento não encontrado.");

    const doc = await prisma.knowledgeDocument.findUnique({ where: { id: parsed.data.id } });
    if (doc) {
      revalidatePath(`/knowledge/${doc.offboardingSessionId}`);
      revalidatePath("/knowledge");
    }
    return ok();
  } catch (error) {
    console.error(error);
    return fail("Não foi possível salvar as alterações.");
  }
}

export async function approveKnowledgeDocument(id: string): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return fail("Não autenticado.");
  if (!["ADMIN", "IT_ADMIN", "HR_MANAGER"].includes(user.role)) {
    return fail("Sem permissão para aprovar documentos.");
  }

  try {
    const result = await prisma.knowledgeDocument.updateMany({
      where: { id, offboardingSession: { orgId: user.orgId } },
      data: { status: "APPROVED", approvedAt: new Date() },
    });
    if (result.count === 0) return fail("Documento não encontrado.");

    const doc = await prisma.knowledgeDocument.findUnique({ where: { id } });
    if (doc) {
      revalidatePath(`/knowledge/${doc.offboardingSessionId}`);
      revalidatePath("/knowledge");
    }
    return ok();
  } catch (error) {
    console.error(error);
    return fail("Não foi possível aprovar o documento.");
  }
}
