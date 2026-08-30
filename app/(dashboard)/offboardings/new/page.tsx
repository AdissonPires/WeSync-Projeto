"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Link2, Copy } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createOffboarding } from "@/app/actions/offboarding";

const steps = [
  { id: 1, title: "Dados do Colaborador" },
  { id: 2, title: "Acessos a Revogar" },
  { id: 3, title: "Entrevista de IA" },
];

const accessOptions = [
  "Google Workspace",
  "Microsoft Entra ID",
  "Slack",
  "GitHub",
  "Figma",
];

export default function NewOffboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    employeeName: "",
    email: "",
    role: "",
    department: "",
    exitDate: "",
  });
  const [access, setAccess] = useState<Record<string, boolean>>({});
  const [interviewLink, setInterviewLink] = useState<string | null>(null);

  const next = () => setStep((s) => Math.min(s + 1, 3));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  function handleGenerateLink() {
    startTransition(async () => {
      const accessToRevoke = Object.entries(access)
        .filter(([, checked]) => checked)
        .map(([label]) => label);

      const result = await createOffboarding({ ...form, accessToRevoke });

      if (result.success && result.data) {
        const origin =
          process.env.NEXT_PUBLIC_APP_URL ??
          (typeof window !== "undefined" ? window.location.origin : "");
        setInterviewLink(`${origin}/interview/${result.data.interviewToken}`);
        toast.success("Desligamento criado com sucesso!");
      } else {
        toast.error(result.error ?? "Não foi possível criar o desligamento.");
      }
    });
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.id} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium",
                step > s.id
                  ? "border-brand-primary bg-brand-primary text-brand-bg"
                  : step === s.id
                  ? "border-brand-primary text-brand-primary"
                  : "border-brand-border text-brand-muted"
              )}
            >
              {step > s.id ? <Check className="h-4 w-4" /> : s.id}
            </div>
            <span
              className={cn(
                "hidden text-sm sm:inline",
                step >= s.id ? "text-brand-text" : "text-brand-muted"
              )}
            >
              {s.title}
            </span>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-px flex-1",
                  step > s.id ? "bg-brand-primary" : "bg-brand-border"
                )}
              />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-brand-text text-base font-semibold">
            Passo {step} de 3 — {steps[step - 1].title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {step === 1 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  placeholder="Ex: Marina Costa"
                  value={form.employeeName}
                  onChange={(e) => setForm({ ...form, employeeName: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">E-mail corporativo</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="marina@empresa.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="role">Cargo</Label>
                <Input
                  id="role"
                  placeholder="Gerente de Produto"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Departamento</Label>
                <Select
                  value={form.department}
                  onValueChange={(v) => setForm({ ...form, department: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Produto">Produto</SelectItem>
                    <SelectItem value="Engenharia">Engenharia</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Recursos Humanos">Recursos Humanos</SelectItem>
                    <SelectItem value="Dados & Analytics">Dados & Analytics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="exitDate">Data de saída</Label>
                <Input
                  id="exitDate"
                  type="date"
                  value={form.exitDate}
                  onChange={(e) => setForm({ ...form, exitDate: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-2">
              <p className="mb-1 text-sm text-brand-muted">
                Selecione os acessos que devem ser revogados automaticamente na data de
                saída.
              </p>
              {accessOptions.map((opt) => (
                <label
                  key={opt}
                  className="flex items-center gap-3 rounded-lg border border-brand-border p-3 hover:bg-brand-bg/40"
                >
                  <Checkbox
                    checked={!!access[opt]}
                    onCheckedChange={(checked) =>
                      setAccess((prev) => ({ ...prev, [opt]: checked === true }))
                    }
                  />
                  <span className="text-sm text-brand-text">{opt}</span>
                </label>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-brand-muted">
                Gere um link único para que {form.employeeName || "o colaborador"} realize
                a entrevista de transferência de conhecimento com a IA da WSync.
              </p>

              {!interviewLink ? (
                <Button onClick={handleGenerateLink} disabled={isPending} className="w-fit">
                  <Link2 className="h-4 w-4" />
                  {isPending ? "Gerando…" : "Gerar link da entrevista"}
                </Button>
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-brand-border bg-brand-bg p-3">
                  <span className="flex-1 truncate text-sm text-brand-primary">
                    {interviewLink}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(interviewLink);
                      toast.success("Link copiado para a área de transferência!");
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copiar
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={back} disabled={step === 1}>
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Button>
        {step < 3 ? (
          <Button onClick={next}>
            Próximo
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={() => router.push("/offboardings")} disabled={!interviewLink}>
            <Check className="h-4 w-4" />
            Concluir Desligamento
          </Button>
        )}
      </div>
    </div>
  );
}
