"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import type { HRRequest, HRRequestType, OffboardingSession } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { resolveHRRequest } from "@/app/actions/legal";

type Row = HRRequest & { offboardingSession: OffboardingSession };

const typeLabel: Record<HRRequestType, string> = {
  RECOMMENDATION_LETTER: "Carta de Recomendação",
  GENERAL_QUESTION: "Dúvida sobre a rescisão",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(
    date
  );
}

export function HRRequestsTable({ requests }: { requests: Row[] }) {
  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-brand-muted">
          Nenhuma solicitação de ex-colaborador no momento.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {requests.map((req) => (
        <RequestCard key={req.id} req={req} />
      ))}
    </div>
  );
}

function RequestCard({ req }: { req: Row }) {
  const [isPending, startTransition] = useTransition();

  function handleResolve() {
    startTransition(async () => {
      const result = await resolveHRRequest(req.id);
      if (result.success) {
        toast.success("Solicitação marcada como respondida.");
      } else {
        toast.error(result.error ?? "Não foi possível atualizar.");
      }
    });
  }

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div>
          <p className="text-sm font-medium text-brand-text">
            {req.offboardingSession.employeeName} · {typeLabel[req.type]}
          </p>
          <p className="mt-0.5 text-xs text-brand-muted">{req.message}</p>
          <p className="mt-1 text-xs text-brand-muted">Enviado em {formatDate(req.createdAt)}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant={req.status === "RESOLVED" ? "success" : "warning"}>
            {req.status === "RESOLVED" ? "Respondido" : "Em aberto"}
          </Badge>
          {req.status === "OPEN" && (
            <Button size="sm" variant="outline" onClick={handleResolve} disabled={isPending}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Marcar como respondido
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
