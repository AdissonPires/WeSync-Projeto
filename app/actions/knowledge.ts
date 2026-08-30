"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { updateKnowledgeDocumentSchema } from "@/lib/validations";

export async function updateKnowledgeDocument(input: unknown): Promise<ActionResult> {
  const parsed = updateKnowledgeDocumentSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }
  try {
    const doc = await prisma.knowledgeDocument.update({
      where: { id: parsed.data.id },
      data: { markdownContent: parsed.data.markdownContent },
    });
    revalidatePath(`/knowledge/${doc.offboardingSessionId}`);
    revalidatePath("/knowledge");
    return ok();
  } catch (error) {
    console.error(error);
    return fail("Não foi possível salvar as alterações.");
  }
}

export async function approveKnowledgeDocument(id: string): Promise<ActionResult> {
  try {
    const doc = await prisma.knowledgeDocument.update({
      where: { id },
      data: { status: "APPROVED", approvedAt: new Date() },
    });
    revalidatePath(`/knowledge/${doc.offboardingSessionId}`);
    revalidatePath("/knowledge");
    return ok();
  } catch (error) {
    console.error(error);
    return fail("Não foi possível aprovar o documento.");
  }
}
