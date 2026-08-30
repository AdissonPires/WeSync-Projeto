"use client";

import { ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { anonymizeSession } from "@/app/actions/compliance";

export function AnonymizeButton({
  sessionId,
  employeeName,
}: {
  sessionId: string;
  employeeName: string;
}) {
  return (
    <ConfirmDialog
      trigger={
        <Button variant="destructive" size="sm">
          <ShieldAlert className="h-3.5 w-3.5" />
          Anonimizar Dados Pessoais
        </Button>
      }
      title={`Anonimizar dados de ${employeeName}?`}
      description="Nome, e-mail e CPF serão substituídos permanentemente por um identificador anônimo, conforme o direito ao esquecimento previsto na LGPD. Dados estatísticos do desligamento (datas, status, ativos) são preservados para relatórios da empresa. Essa ação não pode ser desfeita."
      confirmLabel="Anonimizar permanentemente"
      variant="destructive"
      onConfirm={() => anonymizeSession(sessionId)}
      onSuccess={() => toast.success("Dados pessoais anonimizados com sucesso.")}
    />
  );
}
