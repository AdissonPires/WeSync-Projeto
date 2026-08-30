"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Plug, Loader2, Settings } from "lucide-react";
import type { Integration } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProviderMeta } from "@/lib/integration-meta";
import { IntegrationConfigDialog } from "@/components/integrations/integration-config-dialog";
import { testIntegrationConnection } from "@/app/actions/integrations";

const statusMeta: Record<string, { label: string; variant: "success" | "warning" | "danger" }> = {
  CONNECTED: { label: "Conectado (Ativo)", variant: "success" },
  PENDING: { label: "Pendente", variant: "warning" },
  ERROR: { label: "Erro de conexão", variant: "danger" },
};

export function IntegrationCard({
  meta,
  integration,
}: {
  meta: ProviderMeta;
  integration: Integration | null;
}) {
  const [isPending, startTransition] = useTransition();
  const status = statusMeta[integration?.status ?? "PENDING"];
  const config = (integration?.config as Record<string, string> | null) ?? null;

  function handleTest() {
    startTransition(async () => {
      const result = await testIntegrationConnection(meta.provider);
      if (result.success) {
        if (result.data?.connected) {
          toast.success(`${meta.name}: conexão validada com sucesso.`);
        } else {
          toast.error(`${meta.name}: falha na autenticação — verifique as credenciais.`);
        }
      } else {
        toast.error(result.error ?? "Não foi possível testar a conexão.");
      }
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-secondary/20">
            <Plug className="h-4.5 w-4.5 text-brand-primary" />
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-brand-text">{meta.name}</h3>
          <p className="mt-1 text-xs text-brand-muted">{meta.description}</p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="text-xs text-brand-muted">{meta.category}</span>
          <div className="flex gap-2">
            <IntegrationConfigDialog
              meta={meta}
              initialConfig={config}
              trigger={
                <Button variant="outline" size="sm">
                  <Settings className="h-3.5 w-3.5" />
                  Configurar
                </Button>
              }
            />
            <Button size="sm" onClick={handleTest} disabled={isPending || !config}>
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Testar Conexão
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
