"use client";

import { useMemo, useState, useTransition } from "react";
import { Sparkles, Check, ChevronLeft, ChevronRight, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { submitEmployeeExitInterview } from "@/app/actions/interview";
import { AudioRecorder } from "@/components/interview/audio-recorder";
import type { TemplateStep } from "@/lib/interview-template";

interface InterviewWizardProps {
  token: string;
  employeeName: string;
  role: string;
  department: string;
  companyName: string;
  templateTitle: string;
  steps: TemplateStep[];
}

const MIN_ANSWER_LENGTH = 5;

export function InterviewWizard({
  token,
  employeeName,
  role,
  department,
  companyName,
  templateTitle,
  steps,
}: InterviewWizardProps) {
  const [stepIndex, setStepIndex] = useState(0); // 0 = boas-vindas
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [voiceNotes, setVoiceNotes] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const totalSteps = steps.length + 1; // +1 boas-vindas
  const currentTemplateStep = stepIndex > 0 ? steps[stepIndex - 1] : null;

  const canAdvance = useMemo(() => {
    if (!currentTemplateStep) return true;
    return currentTemplateStep.questions.every(
      (q) => (answers[q.id] ?? "").trim().length >= MIN_ANSWER_LENGTH
    );
  }, [currentTemplateStep, answers]);

  function update(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function next() {
    setStepIndex((s) => Math.min(s + 1, totalSteps - 1));
  }
  function back() {
    setStepIndex((s) => Math.max(s - 1, 0));
  }

  function handleSubmit() {
    const voiceTranscript = steps
      .map((step, i) => ({ step, text: voiceNotes[i + 1] }))
      .filter((v) => v.text && v.text.trim().length > 0)
      .map((v) => `## ${v.step.title}\n${v.text}`)
      .join("\n\n");

    startTransition(async () => {
      const result = await submitEmployeeExitInterview({
        token,
        answers,
        voiceTranscript: voiceTranscript || undefined,
      });
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
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-medium",
                stepIndex > i
                  ? "border-brand-primary bg-brand-primary text-brand-bg"
                  : stepIndex === i
                  ? "border-brand-primary text-brand-primary"
                  : "border-brand-border text-brand-muted"
              )}
            >
              {stepIndex > i ? <Check className="h-4 w-4" /> : i === 0 ? <Sparkles className="h-4 w-4" /> : i}
            </div>
            {i < totalSteps - 1 && (
              <div
                className={cn("h-px flex-1", stepIndex > i ? "bg-brand-primary" : "bg-brand-border")}
              />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-5 p-6 sm:p-8">
          {stepIndex === 0 ? (
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
                As próximas perguntas ({templateTitle}) levam cerca de 10 minutos e
                serão usadas pela nossa IA para gerar um manual de processos completo
                para quem assumir suas atividades. Você também pode gravar notas de voz
                em cada passo — elas são transcritas automaticamente. Suas respostas são
                confidenciais e usadas apenas para esse fim.
              </p>
            </div>
          ) : (
            currentTemplateStep && (
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="text-base font-semibold text-brand-text">
                    {currentTemplateStep.title}
                  </h2>
                  <p className="mt-1 text-sm text-brand-muted">
                    {currentTemplateStep.description}
                  </p>
                </div>

                {currentTemplateStep.questions.map((q) => (
                  <div key={q.id} className="flex flex-col gap-1.5">
                    <Label>{q.label}</Label>
                    <textarea
                      value={answers[q.id] ?? ""}
                      onChange={(e) => update(q.id, e.target.value)}
                      placeholder={q.placeholder}
                      rows={4}
                      className="w-full resize-none rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50"
                    />
                  </div>
                ))}

                <AudioRecorder
                  stepLabel={currentTemplateStep.title}
                  onTranscript={(text) =>
                    setVoiceNotes((prev) => ({ ...prev, [stepIndex]: text }))
                  }
                />
              </div>
            )
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="outline" onClick={back} disabled={stepIndex === 0 || isPending}>
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Button>
        {stepIndex < totalSteps - 1 ? (
          <Button onClick={next} disabled={!canAdvance}>
            Próximo
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isPending || !canAdvance}>
            {isPending ? "Enviando…" : "Enviar entrevista"}
            <Check className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
