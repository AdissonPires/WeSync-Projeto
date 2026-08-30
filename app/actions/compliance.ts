"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { getClientIp } from "@/lib/request-info";
import { getSessionUser } from "@/lib/auth/session";

function anonymizedHash(sessionId: string) {
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    hash = (hash * 31 + sessionId.charCodeAt(i)) >>> 0;
  }
  return `ANONYMIZED_USER_${hash.toString(16).toUpperCase().padStart(8, "0")}`;
}

export async function anonymizeSession(sessionId: string): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return fail("Não autenticado.");
  if (!["ADMIN", "IT_ADMIN", "HR_MANAGER"].includes(user.role)) {
    return fail("Sem permissão para anonimizar dados.");
  }

  try {
    const session = await prisma.offboardingSession.findFirst({
      where: { id: sessionId, orgId: user.orgId },
    });
    if (!session) return fail("Sessão não encontrada.");
    if (session.anonymizedAt) return fail("Esta sessão já foi anonimizada.");

    const tag = anonymizedHash(sessionId);
    const ip = await getClientIp();

    await prisma.$transaction([
      prisma.offboardingSession.update({
        where: { id: sessionId },
        data: {
          employeeName: tag,
          email: `${tag.toLowerCase()}@anonimizado.local`,
          cpf: null,
          anonymizedAt: new Date(),
        },
      }),
      prisma.auditLog.create({
        data: {
          orgId: user.orgId,
          offboardingSessionId: sessionId,
          actor: user.name ?? user.email,
          action: "anonymize_session",
          targetLabel: tag,
          ipAddress: ip,
          details:
            "Dados pessoais (nome, e-mail, CPF) substituídos por identificador anônimo, conforme LGPD (direito ao esquecimento). Dados estatísticos do desligamento foram preservados.",
        },
      }),
    ]);

    revalidatePath("/compliance");
    revalidatePath("/offboardings");
    revalidatePath(`/offboardings/${sessionId}`);
    revalidatePath("/");

    return ok();
  } catch (error) {
    console.error(error);
    return fail("Não foi possível anonimizar os dados desta sessão.");
  }
}
