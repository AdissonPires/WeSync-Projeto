"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { ProviderMeta } from "@/lib/integration-meta";
import { saveIntegrationConfig } from "@/app/actions/integrations";

export function IntegrationConfigDialog({
  meta,
  trigger,
  initialConfig,
}: {
  meta: ProviderMeta;
  trigger: ReactNode;
  initialConfig: Record<string, string> | null;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(
    initialConfig ?? Object.fromEntries(meta.fields.map((f) => [f.key, ""]))
  );
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    const missing = meta.fields.find((f) => !values[f.key]?.trim());
    if (missing) {
      toast.error(`Preencha o campo "${missing.label}".`);
      return;
    }
    startTransition(async () => {
      const result = await saveIntegrationConfig({ provider: meta.provider, config: values });
      if (result.success) {
        toast.success(`Credenciais de ${meta.name} salvas.`);
        setOpen(false);
      } else {
        toast.error(result.error ?? "Não foi possível salvar a configuração.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurar {meta.name}</DialogTitle>
          <DialogDescription>
            As credenciais são usadas apenas para autenticar chamadas de revogação de
            acesso durante o offboarding.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {meta.fields.map((field) => (
            <div key={field.key} className="flex flex-col gap-1.5">
              <Label htmlFor={field.key}>{field.label}</Label>
              {field.type === "textarea" ? (
                <textarea
                  id={field.key}
                  placeholder={field.placeholder}
                  value={values[field.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                  rows={4}
                  className="w-full resize-none rounded-lg border border-brand-border bg-brand-bg px-3 py-2 font-mono text-xs text-brand-text placeholder:text-brand-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50"
                />
              ) : (
                <Input
                  id={field.key}
                  type={field.type === "password" ? "password" : "text"}
                  placeholder={field.placeholder}
                  value={values[field.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Salvando…" : "Salvar credenciais"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
