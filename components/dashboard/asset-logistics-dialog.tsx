"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Truck,
  PackageCheck,
  Camera,
  Copy,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import type { Asset, AssetPhoto, AssetReturnProtocol } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  generateShippingLabel,
  schedulePickup,
  uploadAssetPhoto,
  deleteAssetPhoto,
  generateReturnProtocol,
  signReturnProtocol,
} from "@/app/actions/asset-logistics";

type AssetWithLogistics = Asset & {
  photos: AssetPhoto[];
  protocol: AssetReturnProtocol | null;
};

function formatDateTime(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

export function AssetLogisticsDialog({
  asset,
  assetLabel,
  trigger,
}: {
  asset: AssetWithLogistics;
  assetLabel: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Logística & Conferência — {assetLabel}</DialogTitle>
          <DialogDescription>
            Organize a devolução do equipamento e registre a conferência de danos do time
            de TI.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="logistics">
          <TabsList>
            <TabsTrigger value="logistics">Logística Reversa</TabsTrigger>
            <TabsTrigger value="checklist">Checklist Fotográfico</TabsTrigger>
          </TabsList>

          <TabsContent value="logistics">
            <LogisticsTab asset={asset} />
          </TabsContent>

          <TabsContent value="checklist">
            <ChecklistTab asset={asset} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function LogisticsTab({ asset }: { asset: AssetWithLogistics }) {
  const [isPending, startTransition] = useTransition();
  const [showPickupForm, setShowPickupForm] = useState(false);
  const [address, setAddress] = useState(asset.pickupAddress ?? "");
  const [scheduledAt, setScheduledAt] = useState("");

  function handleGenerateLabel() {
    startTransition(async () => {
      const result = await generateShippingLabel(asset.id);
      if (result.success) {
        toast.success(`Código de postagem gerado: ${result.data?.trackingCode}`);
      } else {
        toast.error(result.error ?? "Não foi possível gerar o código.");
      }
    });
  }

  function handleSchedulePickup() {
    startTransition(async () => {
      const result = await schedulePickup({ assetId: asset.id, address, scheduledAt });
      if (result.success) {
        toast.success("Coleta agendada com sucesso.");
        setShowPickupForm(false);
      } else {
        toast.error(result.error ?? "Não foi possível agendar a coleta.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4 py-2">
      {asset.logisticsMethod === "SHIPPING_LABEL" && (
        <div className="flex items-center justify-between rounded-lg border border-brand-border bg-brand-bg p-3">
          <div>
            <p className="text-xs text-brand-muted">Código de postagem ({asset.carrier})</p>
            <p className="font-mono text-sm text-brand-primary">{asset.trackingCode}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(asset.trackingCode ?? "");
              toast.success("Código copiado.");
            }}
          >
            <Copy className="h-3.5 w-3.5" />
            Copiar
          </Button>
        </div>
      )}

      {asset.logisticsMethod === "PICKUP_SCHEDULE" && (
        <div className="rounded-lg border border-brand-border bg-brand-bg p-3">
          <p className="text-xs text-brand-muted">Coleta agendada</p>
          <p className="text-sm text-brand-text">{formatDateTime(asset.pickupScheduledAt)}</p>
          <p className="mt-1 text-xs text-brand-muted">{asset.pickupAddress}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={handleGenerateLabel} disabled={isPending}>
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Truck className="h-3.5 w-3.5" />}
          Gerar Código de Postagem
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowPickupForm((v) => !v)}>
          <PackageCheck className="h-3.5 w-3.5" />
          Agendar Coleta
        </Button>
      </div>

      {showPickupForm && (
        <div className="flex flex-col gap-3 rounded-lg border border-dashed border-brand-border p-3">
          <div className="flex flex-col gap-1.5">
            <Label>Endereço de coleta</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, número, bairro, cidade — CEP"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Data e horário</Label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
          <Button size="sm" onClick={handleSchedulePickup} disabled={isPending} className="w-fit">
            {isPending ? "Agendando…" : "Confirmar agendamento"}
          </Button>
        </div>
      )}
    </div>
  );
}

function ChecklistTab({ asset }: { asset: AssetWithLogistics }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [caption, setCaption] = useState("");
  const [isPending, startTransition] = useTransition();
  const [hasDamage, setHasDamage] = useState(asset.protocol?.hasDamage ?? false);
  const [damageNotes, setDamageNotes] = useState("");
  const [amortization, setAmortization] = useState("");

  function handleUpload(formData: FormData) {
    formData.set("assetId", asset.id);
    formData.set("caption", caption);
    startTransition(async () => {
      const result = await uploadAssetPhoto(formData);
      if (result.success) {
        toast.success("Foto anexada.");
        formRef.current?.reset();
        setCaption("");
      } else {
        toast.error(result.error ?? "Não foi possível enviar a foto.");
      }
    });
  }

  function handleDeletePhoto(photoId: string) {
    startTransition(async () => {
      const result = await deleteAssetPhoto(photoId);
      if (result.success) toast.success("Foto removida.");
      else toast.error(result.error ?? "Não foi possível remover a foto.");
    });
  }

  function handleGenerateProtocol() {
    startTransition(async () => {
      const result = await generateReturnProtocol({
        assetId: asset.id,
        hasDamage,
        damageNotes,
        amortizationAmount: amortization ? Number(amortization) : undefined,
      });
      if (result.success) toast.success("Protocolo gerado.");
      else toast.error(result.error ?? "Não foi possível gerar o protocolo.");
    });
  }

  function handleSignProtocol() {
    if (!asset.protocol) return;
    startTransition(async () => {
      const result = await signReturnProtocol(asset.protocol!.id);
      if (result.success) toast.success("Protocolo assinado.");
      else toast.error(result.error ?? "Não foi possível assinar o protocolo.");
    });
  }

  return (
    <div className="flex flex-col gap-5 py-2">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-brand-muted">
          Fotos anexadas ({asset.photos.length})
        </p>
        {asset.photos.length === 0 ? (
          <p className="text-sm text-brand-muted">Nenhuma foto anexada ainda.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {asset.photos.map((photo) => (
              <div key={photo.id} className="group relative overflow-hidden rounded-lg border border-brand-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/assets/photos/${photo.id}`}
                  alt={photo.caption ?? photo.fileName}
                  className="h-24 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(photo.id)}
                  disabled={isPending}
                  className="absolute right-1 top-1 hidden rounded-full bg-black/60 p-1 text-white group-hover:block"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
                {photo.caption && (
                  <p className="truncate bg-brand-bg px-1.5 py-1 text-[10px] text-brand-muted">
                    {photo.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <form
          ref={formRef}
          action={handleUpload}
          className="flex flex-col gap-2 rounded-lg border border-dashed border-brand-border p-3"
        >
          <Input name="file" type="file" accept="image/*" required />
          <Input
            placeholder="Legenda (opcional) — Ex: risco na tampa"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          <Button type="submit" size="sm" disabled={isPending} className="w-fit">
            <Camera className="h-3.5 w-3.5" />
            Anexar foto
          </Button>
        </form>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-brand-border p-3">
        <p className="text-xs font-medium text-brand-muted">Resultado da conferência</p>
        <label className="flex items-center gap-2 text-sm text-brand-text">
          <Checkbox checked={hasDamage} onCheckedChange={(c) => setHasDamage(c === true)} />
          Avaria identificada no equipamento
        </label>

        {hasDamage && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Observações da avaria</Label>
              <textarea
                value={damageNotes}
                onChange={(e) => setDamageNotes(e.target.value)}
                rows={3}
                placeholder="Ex: Tela trincada no canto superior direito…"
                className="w-full resize-none rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Valor de amortização/quitação (opcional)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={amortization}
                onChange={(e) => setAmortization(e.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>
        )}

        <Button size="sm" onClick={handleGenerateProtocol} disabled={isPending} className="w-fit">
          <ShieldCheck className="h-3.5 w-3.5" />
          Gerar Protocolo
        </Button>
      </div>

      {asset.protocol && (
        <div className="flex flex-col gap-3 rounded-lg border border-brand-border p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-brand-muted">Protocolo de Conferência</p>
            <Badge variant={asset.protocol.status === "SIGNED" ? "success" : "warning"}>
              {asset.protocol.status === "SIGNED" ? "Assinado" : "Rascunho"}
            </Badge>
          </div>
          <div className="max-h-56 overflow-y-auto rounded-lg bg-brand-bg p-3 text-xs leading-relaxed text-brand-muted [&_h1]:text-sm [&_h1]:font-semibold [&_h1]:text-brand-text [&_h2]:mt-2 [&_h2]:text-xs [&_h2]:font-semibold [&_h2]:text-brand-text [&_strong]:text-brand-text">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{asset.protocol.content}</ReactMarkdown>
          </div>
          {asset.protocol.status === "SIGNED" ? (
            <p className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Assinado por {asset.protocol.signerName} em {formatDateTime(asset.protocol.signedAt)} · IP{" "}
              {asset.protocol.signerIp}
            </p>
          ) : (
            <Button size="sm" variant="secondary" onClick={handleSignProtocol} disabled={isPending} className="w-fit">
              {isPending ? "Assinando…" : "Assinar Protocolo"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
