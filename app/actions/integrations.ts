"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { integrationConfigSchema } from "@/lib/validations";
import type { IntegrationProvider } from "@prisma/client";

export async function saveIntegrationConfig(input: unknown): Promise<ActionResult> {
  const parsed = integrationConfigSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }
  try {
    await prisma.integration.upsert({
      where: { provider: parsed.data.provider },
      update: { config: parsed.data.config, status: "PENDING" },
      create: {
        provider: parsed.data.provider,
        config: parsed.data.config,
        status: "PENDING",
      },
    });
    revalidatePath("/integrations");
    return ok();
  } catch (error) {
    console.error(error);
    return fail("Não foi possível salvar a configuração.");
  }
}

export async function testIntegrationConnection(
  provider: IntegrationProvider
): Promise<ActionResult<{ connected: boolean }>> {
  try {
    const integration = await prisma.integration.findUnique({ where: { provider } });
    if (!integration || !integration.config) {
      return fail("Configure as credenciais antes de testar a conexão.");
    }

    // Simulates a ping to the provider's API — swap for a real API call per provider.
    await new Promise((resolve) => setTimeout(resolve, 700));
    const success = Math.random() > 0.12;

    await prisma.$transaction([
      prisma.integration.update({
        where: { provider },
        data: {
          status: success ? "CONNECTED" : "ERROR",
          lastTestedAt: new Date(),
        },
      }),
      prisma.integrationLog.create({
        data: {
          integrationId: integration.id,
          action: "test_connection",
          targetUser: "system",
          status: success ? "SUCCESS" : "ERROR",
          statusCode: success ? 200 : 401,
          message: success
            ? "Conexão validada com sucesso."
            : "Falha na autenticação — verifique as credenciais.",
        },
      }),
    ]);

    revalidatePath("/integrations");
    return ok({ connected: success });
  } catch (error) {
    console.error(error);
    return fail("Não foi possível testar a conexão.");
  }
}

export async function revokeAllAccess(offboardingSessionId: string): Promise<ActionResult> {
  try {
    const revocations = await prisma.accessRevocation.findMany({
      where: { offboardingSessionId, revoked: false },
    });

    for (const revocation of revocations) {
      const integration = await prisma.integration.findUnique({
        where: { provider: revocation.provider },
      });

      await prisma.accessRevocation.update({
        where: { id: revocation.id },
        data: { revoked: true, revokedAt: new Date() },
      });

      if (integration) {
        await prisma.integrationLog.create({
          data: {
            integrationId: integration.id,
            action: "revoke_access",
            targetUser: offboardingSessionId,
            status: "SUCCESS",
            statusCode: 200,
            message: `Acesso revogado (${revocation.provider}).`,
          },
        });
      }
    }

    const session = await prisma.offboardingSession.update({
      where: { id: offboardingSessionId },
      data: { status: "COMPLETED" },
    });

    revalidatePath(`/offboardings/${session.id}`);
    revalidatePath("/offboardings");
    revalidatePath("/integrations");
    revalidatePath("/");

    return ok();
  } catch (error) {
    console.error(error);
    return fail("Não foi possível revogar os acessos.");
  }
}
