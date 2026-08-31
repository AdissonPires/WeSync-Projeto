"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { createOffboardingSchema, addAssetSchema } from "@/lib/validations";
import { getSessionUser } from "@/lib/auth/session";

function defaultAssets(orgId: string) {
  return [
    { orgId, type: "NOTEBOOK" as const, serialNumber: "A definir" },
    { orgId, type: "BADGE" as const, serialNumber: "Crachá de acesso" },
  ];
}

const CAN_MANAGE_OFFBOARDINGS = ["ADMIN", "IT_ADMIN", "HR_MANAGER"];

export async function createOffboarding(
  input: unknown
): Promise<ActionResult<{ sessionId: string; interviewToken: string }>> {
  const user = await getSessionUser();
  if (!user) return fail("Não autenticado.");
  if (!CAN_MANAGE_OFFBOARDINGS.includes(user.role)) return fail("Sem permissão para esta ação.");

  const parsed = createOffboardingSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }

  try {
    const { employeeName, email, role, department, exitDate, accessToRevoke } = parsed.data;

    const session = await prisma.offboardingSession.create({
      data: {
        orgId: user.orgId,
        employeeName,
        email,
        role,
        department,
        exitDate: new Date(exitDate),
        assets: { create: defaultAssets(user.orgId) },
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
  const user = await getSessionUser();
  if (!user) return fail("Não autenticado.");
  if (!CAN_MANAGE_OFFBOARDINGS.includes(user.role)) return fail("Sem permissão para esta ação.");

  try {
    const result = await prisma.offboardingSession.updateMany({
      where: { id: sessionId, orgId: user.orgId },
      data: { status: "CANCELLED" },
    });
    if (result.count === 0) return fail("Sessão não encontrada.");

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
  const user = await getSessionUser();
  if (!user) return fail("Não autenticado.");

  try {
    const result = await prisma.asset.updateMany({
      where: { id: assetId, offboardingSession: { orgId: user.orgId } },
      data: { status },
    });
    if (result.count === 0) return fail("Ativo não encontrado.");

    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (asset) {
      revalidatePath(`/offboardings/${asset.offboardingSessionId}`);
      revalidatePath("/offboardings");
    }
    return ok();
  } catch (error) {
    console.error(error);
    return fail("Não foi possível atualizar o status do ativo.");
  }
}

export async function addAsset(input: unknown): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return fail("Não autenticado.");

  const parsed = addAssetSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }
  try {
    const session = await prisma.offboardingSession.findFirst({
      where: { id: parsed.data.offboardingSessionId, orgId: user.orgId },
      select: { id: true },
    });
    if (!session) return fail("Sessão não encontrada.");

    await prisma.asset.create({ data: { ...parsed.data, orgId: user.orgId } });
    revalidatePath(`/offboardings/${parsed.data.offboardingSessionId}`);
    return ok();
  } catch (error) {
    console.error(error);
    return fail("Não foi possível adicionar o ativo.");
  }
}

export async function toggleTask(taskId: string, done: boolean): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return fail("Não autenticado.");

  try {
    const result = await prisma.pendingTask.updateMany({
      where: {
        id: taskId,
        OR: [{ offboardingSession: { orgId: user.orgId } }, { offboardingSessionId: null }],
      },
      data: { done },
    });
    if (result.count === 0) return fail("Tarefa não encontrada.");

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
