import type { Asset, KnowledgeDocument, OffboardingStatus } from "@prisma/client";

export const offboardingStatusLabel: Record<OffboardingStatus, string> = {
  AI_CAPTURE: "Captura de IA",
  IT_ACTION: "Ação de TI Necessária",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

export const offboardingStatusVariant: Record<
  OffboardingStatus,
  "primary" | "warning" | "success" | "muted"
> = {
  AI_CAPTURE: "primary",
  IT_ACTION: "warning",
  COMPLETED: "success",
  CANCELLED: "muted",
};

/** Rough heuristic progress indicator for the "AI knowledge capture" KPI. */
export function computeAiProgress(knowledgeDocument: KnowledgeDocument | null): number {
  if (!knowledgeDocument) return 0;
  switch (knowledgeDocument.status) {
    case "APPROVED":
      return 100;
    case "READY":
      return 90;
    case "PROCESSING":
      return 55;
    case "DRAFT":
    default:
      return 20;
  }
}

export function computeAssetProgress(assets: Asset[]): number {
  if (assets.length === 0) return 100;
  const resolved = assets.filter((a) => a.status !== "PENDING_RETURN").length;
  return Math.round((resolved / assets.length) * 100);
}

export const assetTypeLabel: Record<Asset["type"], string> = {
  NOTEBOOK: "Notebook",
  MONITOR: "Monitor",
  PERIPHERAL: "Periférico",
  BADGE: "Crachá",
};

export const assetStatusLabel: Record<Asset["status"], string> = {
  PENDING_RETURN: "Pendente",
  RETURNED: "Recebido",
  DAMAGED: "Avariado",
};
