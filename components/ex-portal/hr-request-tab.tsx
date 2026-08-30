"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Send, MessageCircleQuestion, CheckCircle2, Clock } from "lucide-react";
import type { HRRequest, HRRequestType } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { submitHRRequest } from "@/app/actions/ex-portal";

const typeLabel: Record<HRRequestType, string> = {
  RECOMMENDATION_LETTER: "Carta de Recomendação",
  GENERAL_QUESTION: "Dúvida sobre a rescisão",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(
    date
  );
}

export function HRRequestTab({
  accessToken,
  requests,
}: {
  accessToken: string;
  requests: HRRequest[];
}) {
  const [type, setType] = useState<HRRequestType>("GENERAL_QUESTION");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      const result = await submitHRRequest({ accessToken, type, message });
      if (result.success) {
        toast.success("Solicitação enviada ao RH.");
        setMessage("");
      } else {
        toast.error(result.error ?? "Não foi possível enviar sua solicitação.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-brand-text text-base font-semibold">
            Nova solicitação
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Tipo de solicitação</Label>
            <Select value={type} onValueChange={(v) => setType(v as HRRequestType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RECOMMENDATION_LETTER">Carta de Recomendação</SelectItem>
                <SelectItem value="GENERAL_QUESTION">Dúvida sobre a rescisão</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Mensagem</Label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Descreva sua solicitação…"
              className="w-full resize-none rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50"
            />
          </div>
          <Button onClick={handleSubmit} disabled={isPending || message.trim().length < 5} className="w-fit">
            <Send className="h-3.5 w-3.5" />
            {isPending ? "Enviando…" : "Enviar ao RH"}
          </Button>
        </CardContent>
      </Card>

      {requests.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-brand-text">Suas solicitações</h3>
          {requests.map((req) => (
            <Card key={req.id}>
              <CardContent className="flex items-start justify-between gap-3 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-secondary/20">
                    <MessageCircleQuestion className="h-4 w-4 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-brand-text">{typeLabel[req.type]}</p>
                    <p className="mt-0.5 text-xs text-brand-muted">{req.message}</p>
                    <p className="mt-1 text-xs text-brand-muted">
                      Enviado em {formatDate(req.createdAt)}
                    </p>
                  </div>
                </div>
                <Badge variant={req.status === "RESOLVED" ? "success" : "warning"}>
                  {req.status === "RESOLVED" ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" /> Respondido
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3" /> Em aberto
                    </>
                  )}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
