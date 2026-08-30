"use client";

import { ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { revokeAllAccess } from "@/app/actions/integrations";

export function RevokeAccessButton({ sessionId, count }: { sessionId: string; count: number }) {
  return (
    <ConfirmDialog
      trigger={
        <Button variant="destructive" size="sm">
          <ShieldOff className="h-3.5 w-3.5" />
          Revogar Todos os Acessos
        </Button>
      }
      title="Revogar todos os acessos?"
      description={`Isso vai revogar ${count} acesso(s) pendente(s) de uma vez. Essa ação não pode ser desfeita automaticamente — os acessos precisarão ser restaurados manualmente em cada provedor, se necessário.`}
      confirmLabel="Revogar acessos"
      variant="destructive"
      onConfirm={() => revokeAllAccess(sessionId)}
      onSuccess={() => toast.success("Todos os acessos pendentes foram revogados.")}
    />
  );
}
