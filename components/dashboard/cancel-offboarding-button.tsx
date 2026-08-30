"use client";

import { XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cancelOffboarding } from "@/app/actions/offboarding";

export function CancelOffboardingButton({ sessionId }: { sessionId: string }) {
  return (
    <ConfirmDialog
      trigger={
        <Button variant="outline" size="sm">
          <XCircle className="h-3.5 w-3.5" />
          Cancelar Processo
        </Button>
      }
      title="Cancelar processo de offboarding?"
      description="O processo será marcado como cancelado e removido das listas ativas. Os dados já coletados (entrevista, ativos, acessos) serão mantidos para auditoria."
      confirmLabel="Cancelar processo"
      variant="destructive"
      onConfirm={() => cancelOffboarding(sessionId)}
      onSuccess={() => toast.success("Processo de offboarding cancelado.")}
    />
  );
}
