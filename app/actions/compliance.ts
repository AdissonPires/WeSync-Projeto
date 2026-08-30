"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { getClientIp } from "@/lib/request-info";

function anonymizedHash(sessionId: string) {
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    hash = (hash * 31 + sessionId.charCodeAt(i)) >>> 0;
  }
  return `ANONYMIZED_USER_${hash.toString(16).toUpperCase().padStart(8, "0")}`;
}

export async function anonymizeSession(sessionId: string): Promise<ActionResult> {
  try {
    const session = await prisma.offboardingSession.findUnique({ where: { id: sessionId } });
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
          offboardingSessionId: sessionId,
          actor: "RH",
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
