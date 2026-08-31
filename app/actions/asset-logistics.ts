"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { getSessionUser, canManageIntegrations } from "@/lib/auth/session";
import { getClientIp } from "@/lib/request-info";
import { assetTypeLabel } from "@/lib/offboarding-helpers";

const CAN_MANAGE_LOGISTICS = ["ADMIN", "IT_ADMIN", "HR_MANAGER"];

function generateTrackingCode() {
  const letters = () =>
    Array.from({ length: 2 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join("");
  const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join("");
  return `${letters()}${digits}${letters()}`;
}

async function loadOwnedAsset(assetId: string, orgId: string) {
  return prisma.asset.findFirst({
    where: { id: assetId, offboardingSession: { orgId } },
    include: { offboardingSession: true, photos: true, protocol: true },
  });
}

export async function generateShippingLabel(assetId: string): Promise<ActionResult<{ trackingCode: string }>> {
  const user = await getSessionUser();
  if (!user) return fail("Não autenticado.");
  if (!CAN_MANAGE_LOGISTICS.includes(user.role)) return fail("Sem permissão para esta ação.");

  try {
    const asset = await loadOwnedAsset(assetId, user.orgId);
    if (!asset) return fail("Ativo não encontrado.");

    const trackingCode = generateTrackingCode();

    await prisma.$transaction([
      prisma.asset.update({
        where: { id: asset.id },
        data: {
          logisticsMethod: "SHIPPING_LABEL",
          trackingCode,
          carrier: "Correios",
          pickupAddress: null,
          pickupScheduledAt: null,
        },
      }),
      prisma.auditLog.create({
        data: {
          orgId: user.orgId,
          offboardingSessionId: asset.offboardingSessionId,
          actor: user.name ?? user.email,
          action: "generate_shipping_label",
          targetLabel: `${assetTypeLabel[asset.type]} (${asset.serialNumber})`,
          details: `Código de postagem gerado: ${trackingCode}.`,
        },
      }),
    ]);

    revalidatePath(`/offboardings/${asset.offboardingSessionId}`);
    return ok({ trackingCode });
  } catch (error) {
    console.error(error);
    return fail("Não foi possível gerar o código de postagem.");
  }
}

export async function schedulePickup(input: {
  assetId: string;
  address: string;
  scheduledAt: string;
}): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return fail("Não autenticado.");
  if (!CAN_MANAGE_LOGISTICS.includes(user.role)) return fail("Sem permissão para esta ação.");

  if (!input.address.trim()) return fail("Informe o endereço de coleta.");
  if (!input.scheduledAt) return fail("Informe a data e horário da coleta.");

  try {
    const asset = await loadOwnedAsset(input.assetId, user.orgId);
    if (!asset) return fail("Ativo não encontrado.");

    const scheduledAt = new Date(input.scheduledAt);

    await prisma.$transaction([
      prisma.asset.update({
        where: { id: asset.id },
        data: {
          logisticsMethod: "PICKUP_SCHEDULE",
          pickupAddress: input.address,
          pickupScheduledAt: scheduledAt,
          trackingCode: null,
          carrier: null,
        },
      }),
      prisma.auditLog.create({
        data: {
          orgId: user.orgId,
          offboardingSessionId: asset.offboardingSessionId,
          actor: user.name ?? user.email,
          action: "schedule_pickup",
          targetLabel: `${assetTypeLabel[asset.type]} (${asset.serialNumber})`,
          details: `Coleta agendada para ${scheduledAt.toLocaleString("pt-BR")} em ${input.address}.`,
        },
      }),
    ]);

    revalidatePath(`/offboardings/${asset.offboardingSessionId}`);
    return ok();
  } catch (error) {
    console.error(error);
    return fail("Não foi possível agendar a coleta.");
  }
}

export async function uploadAssetPhoto(formData: FormData): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return fail("Não autenticado.");
  if (!CAN_MANAGE_LOGISTICS.includes(user.role)) return fail("Sem permissão para esta ação.");

  try {
    const assetId = formData.get("assetId");
    const caption = formData.get("caption");
    const file = formData.get("file");

    if (typeof assetId !== "string" || !assetId) return fail("Ativo inválido.");
    if (!(file instanceof File) || file.size === 0) return fail("Selecione uma foto.");
    if (!file.type.startsWith("image/")) return fail("Selecione um arquivo de imagem.");
    if (file.size > 8 * 1024 * 1024) return fail("Imagem muito grande (máximo 8MB).");

    const asset = await loadOwnedAsset(assetId, user.orgId);
    if (!asset) return fail("Ativo não encontrado.");

    const buffer = Buffer.from(await file.arrayBuffer());

    await prisma.assetPhoto.create({
      data: {
        assetId: asset.id,
        imageData: buffer,
        mimeType: file.type,
        fileName: file.name,
        caption: typeof caption === "string" && caption.trim() ? caption : null,
      },
    });

    revalidatePath(`/offboardings/${asset.offboardingSessionId}`);
    return ok();
  } catch (error) {
    console.error(error);
    return fail("Não foi possível enviar a foto.");
  }
}

export async function deleteAssetPhoto(photoId: string): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return fail("Não autenticado.");
  if (!CAN_MANAGE_LOGISTICS.includes(user.role)) return fail("Sem permissão para esta ação.");

  try {
    const photo = await prisma.assetPhoto.findFirst({
      where: { id: photoId, asset: { offboardingSession: { orgId: user.orgId } } },
      include: { asset: true },
    });
    if (!photo) return fail("Foto não encontrada.");

    await prisma.assetPhoto.delete({ where: { id: photoId } });
    revalidatePath(`/offboardings/${photo.asset.offboardingSessionId}`);
    return ok();
  } catch (error) {
    console.error(error);
    return fail("Não foi possível remover a foto.");
  }
}

export async function generateReturnProtocol(input: {
  assetId: string;
  hasDamage: boolean;
  damageNotes: string;
  amortizationAmount?: number;
}): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return fail("Não autenticado.");
  if (!CAN_MANAGE_LOGISTICS.includes(user.role)) return fail("Sem permissão para esta ação.");

  try {
    const asset = await loadOwnedAsset(input.assetId, user.orgId);
    if (!asset) return fail("Ativo não encontrado.");
    if (asset.photos.length === 0) {
      return fail("Anexe ao menos uma foto do equipamento antes de gerar o protocolo.");
    }

    const content = buildProtocolMarkdown({
      employeeName: asset.offboardingSession.employeeName,
      assetLabel: `${assetTypeLabel[asset.type]} — ${asset.serialNumber}`,
      hasDamage: input.hasDamage,
      damageNotes: input.damageNotes,
      amortizationAmount: input.amortizationAmount,
      photoCount: asset.photos.length,
    });

    await prisma.assetReturnProtocol.upsert({
      where: { assetId: asset.id },
      update: {
        content,
        hasDamage: input.hasDamage,
        amortizationAmount: input.amortizationAmount ?? null,
        status: "DRAFT",
        signerName: null,
        signerIp: null,
        signedAt: null,
      },
      create: {
        assetId: asset.id,
        content,
        hasDamage: input.hasDamage,
        amortizationAmount: input.amortizationAmount ?? null,
      },
    });

    revalidatePath(`/offboardings/${asset.offboardingSessionId}`);
    return ok();
  } catch (error) {
    console.error(error);
    return fail("Não foi possível gerar o protocolo.");
  }
}

export async function signReturnProtocol(protocolId: string): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return fail("Não autenticado.");
  if (!CAN_MANAGE_LOGISTICS.includes(user.role)) return fail("Sem permissão para esta ação.");

  try {
    const protocol = await prisma.assetReturnProtocol.findFirst({
      where: { id: protocolId, asset: { offboardingSession: { orgId: user.orgId } } },
      include: { asset: true },
    });
    if (!protocol) return fail("Protocolo não encontrado.");
    if (protocol.status === "SIGNED") return fail("Este protocolo já foi assinado.");

    const ip = await getClientIp();
    const signerName = user.name ?? user.email;

    await prisma.$transaction([
      prisma.assetReturnProtocol.update({
        where: { id: protocol.id },
        data: { status: "SIGNED", signerName, signerIp: ip, signedAt: new Date() },
      }),
      prisma.asset.update({
        where: { id: protocol.assetId },
        data: { status: protocol.hasDamage ? "DAMAGED" : "RETURNED" },
      }),
      prisma.auditLog.create({
        data: {
          orgId: user.orgId,
          offboardingSessionId: protocol.asset.offboardingSessionId,
          actor: signerName,
          action: "sign_return_protocol",
          targetLabel: `${assetTypeLabel[protocol.asset.type]} (${protocol.asset.serialNumber})`,
          ipAddress: ip,
          details: protocol.hasDamage
            ? `Protocolo assinado com avaria registrada${
                protocol.amortizationAmount ? ` — amortização de R$ ${protocol.amortizationAmount.toFixed(2)}` : ""
              }.`
            : "Protocolo assinado — equipamento recebido em condições normais.",
        },
      }),
    ]);

    revalidatePath(`/offboardings/${protocol.asset.offboardingSessionId}`);
    return ok();
  } catch (error) {
    console.error(error);
    return fail("Não foi possível assinar o protocolo.");
  }
}

function buildProtocolMarkdown(input: {
  employeeName: string;
  assetLabel: string;
  hasDamage: boolean;
  damageNotes: string;
  amortizationAmount?: number;
  photoCount: number;
}) {
  return `# Protocolo de Conferência Patrimonial

**Colaborador:** ${input.employeeName}
**Equipamento:** ${input.assetLabel}
**Registro fotográfico:** ${input.photoCount} foto(s) anexada(s)

## Resultado da conferência

${
  input.hasDamage
    ? `Foi identificada avaria no equipamento devolvido.\n\n**Observações:** ${input.damageNotes || "Não informado."}` +
      (input.amortizationAmount
        ? `\n\n**Valor de amortização/quitação:** R$ ${input.amortizationAmount.toFixed(2)}`
        : "")
    : "O equipamento foi conferido e recebido em condições normais de uso, sem avarias identificadas."
}

---

*Este protocolo é gerado a partir da conferência do time de TI e, uma vez assinado, serve como base para eventual amortização ou quitação patrimonial.*
`;
}
