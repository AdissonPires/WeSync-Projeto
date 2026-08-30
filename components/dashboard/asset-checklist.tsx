"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2, AlertOctagon, Laptop, Monitor, Mouse, IdCard, Plus } from "lucide-react";
import type { Asset, AssetStatus, AssetType } from "@prisma/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { assetTypeLabel, assetStatusLabel, computeAssetProgress } from "@/lib/offboarding-helpers";
import { updateAssetStatus, addAsset } from "@/app/actions/offboarding";
import { cn } from "@/lib/utils";

const assetIcon: Record<AssetType, typeof Laptop> = {
  NOTEBOOK: Laptop,
  MONITOR: Monitor,
  PERIPHERAL: Mouse,
  BADGE: IdCard,
};

const statusBadgeVariant: Record<AssetStatus, "warning" | "success" | "danger"> = {
  PENDING_RETURN: "warning",
  RETURNED: "success",
  DAMAGED: "danger",
};

export function AssetChecklist({
  offboardingSessionId,
  assets,
}: {
  offboardingSessionId: string;
  assets: Asset[];
}) {
  const [isPending, startTransition] = useTransition();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSerial, setNewSerial] = useState("");
  const [newType, setNewType] = useState<AssetType>("PERIPHERAL");

  const progress = computeAssetProgress(assets);

  function handleStatusChange(assetId: string, status: AssetStatus) {
    startTransition(async () => {
      const result = await updateAssetStatus(assetId, status);
      if (!result.success) {
        toast.error(result.error ?? "Não foi possível atualizar o ativo.");
      } else {
        toast.success("Status do ativo atualizado.");
      }
    });
  }

  function handleAddAsset() {
    if (!newSerial.trim()) {
      toast.error("Informe um número de série ou identificador.");
      return;
    }
    startTransition(async () => {
      const result = await addAsset({
        offboardingSessionId,
        type: newType,
        serialNumber: newSerial,
      });
      if (result.success) {
        setNewSerial("");
        setShowAddForm(false);
        toast.success("Ativo adicionado.");
      } else {
        toast.error(result.error ?? "Não foi possível adicionar o ativo.");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-brand-text text-base font-semibold">
          Ativos & Equipamentos
        </CardTitle>
        <Badge variant={progress === 100 ? "success" : "warning"}>{progress}% conferido</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-0">
        {assets.length === 0 && (
          <p className="text-sm text-brand-muted">Nenhum ativo vinculado a esta sessão.</p>
        )}
        {assets.map((asset) => {
          const Icon = assetIcon[asset.type];
          return (
            <div
              key={asset.id}
              className="flex flex-col gap-3 rounded-lg border border-brand-border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-secondary/20">
                  <Icon className="h-4 w-4 text-brand-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-brand-text">
                    {assetTypeLabel[asset.type]}
                  </p>
                  <p className="text-xs text-brand-muted">{asset.serialNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={statusBadgeVariant[asset.status]}>
                  {assetStatusLabel[asset.status]}
                </Badge>
                <Button
                  size="sm"
                  variant={asset.status === "RETURNED" ? "outline" : "primary"}
                  disabled={isPending}
                  onClick={() => handleStatusChange(asset.id, "RETURNED")}
                  className={cn(asset.status === "RETURNED" && "pointer-events-none opacity-60")}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Recebido
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => handleStatusChange(asset.id, "DAMAGED")}
                >
                  <AlertOctagon className="h-3.5 w-3.5" />
                  Avaria
                </Button>
              </div>
            </div>
          );
        })}

        {showAddForm ? (
          <div className="flex flex-col gap-2 rounded-lg border border-dashed border-brand-border p-3 sm:flex-row sm:items-center">
            <Select value={newType} onValueChange={(v) => setNewType(v as AssetType)}>
              <SelectTrigger className="sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(assetTypeLabel) as AssetType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {assetTypeLabel[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Número de série / identificador"
              value={newSerial}
              onChange={(e) => setNewSerial(e.target.value)}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddAsset} disabled={isPending}>
                Adicionar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="w-fit" onClick={() => setShowAddForm(true)}>
            <Plus className="h-3.5 w-3.5" />
            Adicionar ativo
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
