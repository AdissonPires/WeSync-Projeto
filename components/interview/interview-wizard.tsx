"use client";

import { useState, useTransition } from "react";
import {
  Sparkles,
  ClipboardList,
  FolderKanban,
  Users,
  Check,
  ChevronLeft,
  ChevronRight,
  PartyPopper,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { submitEmployeeExitInterview } from "@/app/actions/interview";

interface InterviewWizardProps {
  token: string;
  employeeName: string;
  role: string;
  department: string;
  companyName: string;
}

const steps = [
  { id: 1, title: "Boas-vindas", icon: Sparkles },
  { id: 2, title: "Rotinas & Processos", icon: ClipboardList },
  { id: 3, title: "Projetos & Pendências", icon: FolderKanban },
  { id: 4, title: "Passagem de Bastão", icon: Users },
];

type FormState = {
  dailyRoutines: string;
  weeklyRoutines: string;
  monthlyRoutines: string;
  projectsPending: string;
  fileLinks: string;
  requiredAccess: string;
  keyContacts: string;
  successorNotes: string;
};

const initialForm: FormState = {
  dailyRoutines: "",
  weeklyRoutines: "",
  monthlyRoutines: "",
  projectsPending: "",
  fileLinks: "",
  requiredAccess: "",
  keyContacts: "",
  successorNotes: "",
};

export function InterviewWizard({
  token,
  employeeName,
  role,
  department,
  companyName,
}: InterviewWizardProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const update = (field: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const next = () => setStep((s) => Math.min(s + 1, 4));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const canAdvanceFromStep2 =
    form.dailyRoutines.trim().length >= 10 && form.weeklyRoutines.trim().length >= 10;
  const canAdvanceFromStep3 =
    form.projectsPending.trim().length > 0 && form.requiredAccess.trim().length > 0;

  function handleSubmit() {
    startTransition(async () => {
      const result = await submitEmployeeExitInterview({ token, ...form });
      if (result.success) {
        setSubmitted(true);
        toast.success("Entrevista enviada com sucesso!");
      } else {
        toast.error(result.error ?? "Não foi possível enviar a entrevista.");
      }
    });
  }

  if (submitted) {
    return (
      <div className="flex max-w-lg flex-col items-center gap-4 rounded-xl border border-brand-border bg-brand-card p-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary/10">
          <PartyPopper className="h-7 w-7 text-brand-primary" />
        </div>
        <h1 className="text-xl font-semibold text-brand-text">Obrigado, {employeeName}!</h1>
        <p className="text-sm text-brand-muted">
          Suas respostas foram registradas com sucesso. Nossa IA está processando o
          manual de transferência de conhecimento com base nas suas informações — o
          time de RH da {companyName} cuidará do restante do processo.
        </p>
        <p className="text-xs text-brand-muted">Você já pode fechar esta página.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.id} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
                  step > s.id
                    ? "border-brand-primary bg-brand-primary text-brand-bg"
                    : step === s.id
                    ? "border-brand-primary text-brand-primary"
                    : "border-brand-border text-brand-muted"
                )}
              >
                {step > s.id ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "h-px flex-1",
                    step > s.id ? "bg-brand-primary" : "bg-brand-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-5 p-6 sm:p-8">
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <h1 className="text-xl font-semibold text-brand-text">
                Olá, {employeeName} 👋
              </h1>
              <p className="text-sm leading-relaxed text-brand-muted">
                Antes de você seguir para os próximos passos, a {companyName} quer
                garantir que todo o conhecimento que você construiu como{" "}
                <span className="text-brand-text">{role}</span> no time de{" "}
                <span className="text-brand-text">{department}</span> continue vivo na
                empresa.
              </p>
              <p className="text-sm leading-relaxed text-brand-muted">
                As próximas perguntas levam cerca de 10 minutos e serão usadas pela
                nossa IA para gerar um manual de processos completo para quem assumir
                suas atividades. Suas respostas são confidenciais e usadas apenas para
                esse fim.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <StepHeader
                title="Mapeamento de Rotinas & Processos"
                description="Descreva com o máximo de detalhe possível suas atividades recorrentes."
              />
              <Field
                label="Rotinas diárias"
                value={form.dailyRoutines}
                onChange={(v) => update("dailyRoutines", v)}
                placeholder="Ex: Todo dia às 9h eu reviso os tickets abertos no Jira e respondo o time no Slack..."
              />
              <Field
                label="Rotinas semanais"
                value={form.weeklyRoutines}
                onChange={(v) => update("weeklyRoutines", v)}
                placeholder="Ex: Toda segunda-feira eu envio o relatório semanal para a diretoria..."
              />
              <Field
                label="Rotinas mensais"
                value={form.monthlyRoutines}
                onChange={(v) => update("monthlyRoutines", v)}
                placeholder="Ex: No fechamento do mês eu concilio os relatórios financeiros..."
              />
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-4">
              <StepHeader
                title="Projetos & Pendências"
                description="Liste o que está em andamento e o que precisa de atenção."
              />
              <Field
                label="Projetos em andamento e pendências"
                value={form.projectsPending}
                onChange={(v) => update("projectsPending", v)}
                placeholder="Ex: Projeto X está 80% concluído, falta apenas a aprovação final do cliente..."
              />
              <Field
                label="Links de arquivos relevantes"
                value={form.fileLinks}
                onChange={(v) => update("fileLinks", v)}
                placeholder="Ex: Planilha de controle: drive.google.com/... | Documentação: notion.so/..."
              />
              <Field
                label="Acessos necessários para o sucessor"
                value={form.requiredAccess}
                onChange={(v) => update("requiredAccess", v)}
                placeholder="Ex: Acesso ao painel de administração do Google Ads, permissão de admin no GitHub..."
              />
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-4">
              <StepHeader
                title="Passagem de Bastão"
                description="Ajude quem for assumir suas atividades a começar com o pé direito."
              />
              <Field
                label="Contatos-chave (internos e externos)"
                value={form.keyContacts}
                onChange={(v) => update("keyContacts", v)}
                placeholder="Ex: João (Financeiro) para aprovações de orçamento, Maria (cliente Acme) para questões de contrato..."
              />
              <Field
                label="Recomendações para o sucessor"
                value={form.successorNotes}
                onChange={(v) => update("successorNotes", v)}
                placeholder="Ex: Recomendo começar revisando os processos em aberto antes de assumir novos projetos..."
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="outline" onClick={back} disabled={step === 1 || isPending}>
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Button>
        {step < 4 ? (
          <Button
            onClick={next}
            disabled={
              (step === 2 && !canAdvanceFromStep2) || (step === 3 && !canAdvanceFromStep3)
            }
          >
            Próximo
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isPending || form.keyContacts.trim().length === 0}
          >
            {isPending ? "Enviando…" : "Enviar entrevista"}
            <Check className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function StepHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-brand-text">{title}</h2>
      <p className="mt-1 text-sm text-brand-muted">{description}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full resize-none rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50"
      />
    </div>
  );
}
