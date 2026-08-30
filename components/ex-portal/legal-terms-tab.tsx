"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileSignature, CheckCircle2, XCircle, PenLine } from "lucide-react";
import type { LegalTerm } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { signLegalTerm, rejectLegalTerm } from "@/app/actions/ex-portal";

const typeLabel: Record<LegalTerm["type"], string> = {
  AVISO_PREVIO: "Aviso Prévio",
  TERMO_QUITACAO: "Termo de Quitação",
};

const statusMeta: Record<LegalTerm["status"], { label: string; variant: "warning" | "success" | "danger" }> = {
  PENDING: { label: "Pendente", variant: "warning" },
  SIGNED: { label: "Assinado", variant: "success" },
  REJECTED: { label: "Rejeitado", variant: "danger" },
};

export function LegalTermsTab({
  accessToken,
  terms,
}: {
  accessToken: string;
  terms: LegalTerm[];
}) {
  if (terms.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-brand-muted">
          Nenhum termo pendente de assinatura no momento.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {terms.map((term) => (
        <TermCard key={term.id} accessToken={accessToken} term={term} />
      ))}
    </div>
  );
}

function TermCard({ accessToken, term }: { accessToken: string; term: LegalTerm }) {
  const status = statusMeta[term.status];

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-secondary/20">
              <FileSignature className="h-4.5 w-4.5 text-brand-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-brand-text">{term.title}</p>
              <p className="text-xs text-brand-muted">{typeLabel[term.type]}</p>
            </div>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        <div className="max-h-48 overflow-y-auto rounded-lg border border-brand-border bg-brand-bg p-4 text-xs leading-relaxed text-brand-muted [&_h1]:text-sm [&_h1]:font-semibold [&_h1]:text-brand-text [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-brand-text [&_strong]:text-brand-text">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{term.content}</ReactMarkdown>
        </div>

        {term.status === "PENDING" && (
          <div className="flex gap-2">
            <SignDialog accessToken={accessToken} term={term} />
            <RejectDialog accessToken={accessToken} term={term} />
          </div>
        )}

        {term.status === "SIGNED" && (
          <p className="flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Assinado por {term.signerName} em{" "}
            {term.signedAt &&
              new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
                term.signedAt
              )}{" "}
            · IP {term.signerIp}
          </p>
        )}

        {term.status === "REJECTED" && (
          <p className="flex items-center gap-1.5 text-xs text-red-400">
            <XCircle className="h-3.5 w-3.5" />
            Rejeitado: {term.rejectionReason}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function SignDialog({ accessToken, term }: { accessToken: string; term: LegalTerm }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSign() {
    startTransition(async () => {
      const result = await signLegalTerm({
        accessToken,
        legalTermId: term.id,
        signerName: name,
        consent,
      });
      if (result.success) {
        toast.success("Termo assinado com sucesso.");
        setOpen(false);
      } else {
        toast.error(result.error ?? "Não foi possível assinar o termo.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PenLine className="h-3.5 w-3.5" />
          Assinar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assinar {term.title}</DialogTitle>
          <DialogDescription>
            Sua assinatura registra nome, data/hora e endereço IP como comprovante de
            consentimento.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="signerName">Nome completo</Label>
            <Input
              id="signerName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite seu nome completo"
            />
          </div>
          <label className="flex items-start gap-2 text-sm text-brand-muted">
            <Checkbox
              checked={consent}
              onCheckedChange={(c) => setConsent(c === true)}
              className="mt-0.5"
            />
            Li e concordo com os termos descritos acima.
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSign} disabled={isPending || !name || !consent}>
            {isPending ? "Assinando…" : "Confirmar assinatura"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({ accessToken, term }: { accessToken: string; term: LegalTerm }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleReject() {
    startTransition(async () => {
      const result = await rejectLegalTerm({ accessToken, legalTermId: term.id, reason });
      if (result.success) {
        toast.success("Rejeição registrada. O RH entrará em contato.");
        setOpen(false);
      } else {
        toast.error(result.error ?? "Não foi possível registrar a rejeição.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <XCircle className="h-3.5 w-3.5" />
          Rejeitar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rejeitar {term.title}</DialogTitle>
          <DialogDescription>
            Explique o motivo — o RH será notificado para entrar em contato com você.
          </DialogDescription>
        </DialogHeader>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="Ex: Discordo do valor descrito no termo de quitação..."
          className="w-full resize-none rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50"
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleReject} disabled={isPending || !reason}>
            {isPending ? "Enviando…" : "Confirmar rejeição"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
