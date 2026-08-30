"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { saveTemplateSchema } from "@/lib/validations";
import { DEFAULT_TEMPLATE_STEPS, DEFAULT_TEMPLATE_TITLE, type TemplateStep } from "@/lib/interview-template";
import { getSessionUser } from "@/lib/auth/session";

export async function getTemplateForDepartment(
  orgId: string,
  department: string
): Promise<{
  title: string;
  steps: TemplateStep[];
  isCustom: boolean;
}> {
  const template = await prisma.interviewTemplate.findUnique({
    where: { orgId_department: { orgId, department } },
  });
  if (!template) {
    return { title: DEFAULT_TEMPLATE_TITLE, steps: DEFAULT_TEMPLATE_STEPS, isCustom: false };
  }
  return {
    title: template.title,
    steps: template.steps as unknown as TemplateStep[],
    isCustom: true,
  };
}

export async function saveTemplate(input: unknown): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return fail("Não autenticado.");
  if (!["ADMIN", "IT_ADMIN", "HR_MANAGER"].includes(user.role)) {
    return fail("Sem permissão para editar questionários.");
  }

  const parsed = saveTemplateSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }
  try {
    const steps = parsed.data.steps as unknown as Prisma.InputJsonValue;
    await prisma.interviewTemplate.upsert({
      where: { orgId_department: { orgId: user.orgId, department: parsed.data.department } },
      update: { title: parsed.data.title, steps },
      create: {
        orgId: user.orgId,
        department: parsed.data.department,
        title: parsed.data.title,
        steps,
      },
    });
    revalidatePath("/templates");
    return ok();
  } catch (error) {
    console.error(error);
    return fail("Não foi possível salvar o questionário.");
  }
}

export async function resetTemplateToDefault(department: string): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return fail("Não autenticado.");
  if (!["ADMIN", "IT_ADMIN", "HR_MANAGER"].includes(user.role)) {
    return fail("Sem permissão para editar questionários.");
  }

  try {
    await prisma.interviewTemplate.deleteMany({ where: { orgId: user.orgId, department } });
    revalidatePath("/templates");
    return ok();
  } catch (error) {
    console.error(error);
    return fail("Não foi possível restaurar o questionário padrão.");
  }
}
