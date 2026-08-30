"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";
import type { LegalTerm, OffboardingSession } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { resendSignatureRequest } from "@/app/actions/legal";

type Row = LegalTerm & { offboardingSession: OffboardingSession };

const typeLabel: Record<LegalTerm["type"], string> = {
  AVISO_PREVIO: "Aviso Prévio",
  TERMO_QUITACAO: "Termo de Quitação",
};

const statusMeta: Record<LegalTerm["status"], { label: string; variant: "warning" | "success" | "danger" }> = {
  PENDING: { label: "Pendente", variant: "warning" },
  SIGNED: { label: "Assinado", variant: "success" },
  REJECTED: { label: "Rejeitado", variant: "danger" },
};

function formatDateTime(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

export function LegalTermsTable({ terms }: { terms: Row[] }) {
  if (terms.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-brand-muted">
          Nenhum termo jurídico cadastrado ainda.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-brand-border text-xs text-brand-muted">
                <th className="px-5 py-3 font-medium">Colaborador</th>
                <th className="px-5 py-3 font-medium">Termo</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Assinado/Rejeitado em</th>
                <th className="px-5 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {terms.map((term) => (
                <TermRow key={term.id} term={term} />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function TermRow({ term }: { term: Row }) {
  const [isPending, startTransition] = useTransition();
  const status = statusMeta[term.status];

  function handleResend() {
    startTransition(async () => {
      const result = await resendSignatureRequest(term.id);
      if (result.success) {
        toast.success(`Link reenviado para ${term.offboardingSession.email}.`);
      } else {
        toast.error(result.error ?? "Não foi possível reenviar.");
      }
    });
  }

  return (
    <tr className="border-b border-brand-border/60 last:border-0">
      <td className="px-5 py-3 text-brand-text">{term.offboardingSession.employeeName}</td>
      <td className="px-5 py-3 text-brand-muted">{typeLabel[term.type]}</td>
      <td className="px-5 py-3">
        <Badge variant={status.variant}>{status.label}</Badge>
      </td>
      <td className="px-5 py-3 text-brand-muted">
        {formatDateTime(term.signedAt ?? term.rejectedAt)}
      </td>
      <td className="px-5 py-3 text-right">
        {term.status === "PENDING" && (
          <Button size="sm" variant="outline" onClick={handleResend} disabled={isPending}>
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Reenviar
          </Button>
        )}
      </td>
    </tr>
  );
}
