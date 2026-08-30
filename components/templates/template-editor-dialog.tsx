"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveTemplate, resetTemplateToDefault } from "@/app/actions/templates";
import type { TemplateStep } from "@/lib/interview-template";

function newQuestionId() {
  return `q_${Math.random().toString(36).slice(2, 9)}`;
}

export function TemplateEditorDialog({
  department,
  title,
  steps,
  isCustom,
  trigger,
}: {
  department: string;
  title: string;
  steps: TemplateStep[];
  isCustom: boolean;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [templateTitle, setTemplateTitle] = useState(title);
  const [localSteps, setLocalSteps] = useState<TemplateStep[]>(() => structuredCloneSteps(steps));
  const [isPending, startTransition] = useTransition();

  function structuredCloneSteps(s: TemplateStep[]) {
    return s.map((step) => ({ ...step, questions: step.questions.map((q) => ({ ...q })) }));
  }

  function resetLocalState() {
    setTemplateTitle(title);
    setLocalSteps(structuredCloneSteps(steps));
  }

  function updateStep(index: number, patch: Partial<TemplateStep>) {
    setLocalSteps((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function addStep() {
    setLocalSteps((prev) => [
      ...prev,
      { title: "Novo passo", description: "", questions: [{ id: newQuestionId(), label: "Nova pergunta", placeholder: "" }] },
    ]);
  }

  function removeStep(index: number) {
    setLocalSteps((prev) => prev.filter((_, i) => i !== index));
  }

  function addQuestion(stepIndex: number) {
    setLocalSteps((prev) =>
      prev.map((s, i) =>
        i === stepIndex
          ? { ...s, questions: [...s.questions, { id: newQuestionId(), label: "Nova pergunta", placeholder: "" }] }
          : s
      )
    );
  }

  function updateQuestion(stepIndex: number, qIndex: number, patch: Partial<TemplateStep["questions"][number]>) {
    setLocalSteps((prev) =>
      prev.map((s, i) =>
        i === stepIndex
          ? { ...s, questions: s.questions.map((q, j) => (j === qIndex ? { ...q, ...patch } : q)) }
          : s
      )
    );
  }

  function removeQuestion(stepIndex: number, qIndex: number) {
    setLocalSteps((prev) =>
      prev.map((s, i) => (i === stepIndex ? { ...s, questions: s.questions.filter((_, j) => j !== qIndex) } : s))
    );
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveTemplate({ department, title: templateTitle, steps: localSteps });
      if (result.success) {
        toast.success(`Questionário de ${department} salvo com sucesso.`);
        setOpen(false);
      } else {
        toast.error(result.error ?? "Não foi possível salvar o questionário.");
      }
    });
  }

  function handleResetDefault() {
    startTransition(async () => {
      const result = await resetTemplateToDefault(department);
      if (result.success) {
        toast.success("Questionário restaurado para o padrão.");
        setOpen(false);
      } else {
        toast.error(result.error ?? "Não foi possível restaurar o padrão.");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) resetLocalState();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Questionário — {department}</DialogTitle>
          <DialogDescription>
            Personalize as perguntas que colaboradores deste departamento verão na
            entrevista de saída.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label>Título do questionário</Label>
            <Input value={templateTitle} onChange={(e) => setTemplateTitle(e.target.value)} />
          </div>

          {localSteps.map((step, stepIndex) => (
            <div key={stepIndex} className="flex flex-col gap-3 rounded-lg border border-brand-border p-3">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 shrink-0 text-brand-muted" />
                <Input
                  value={step.title}
                  onChange={(e) => updateStep(stepIndex, { title: e.target.value })}
                  placeholder="Título do passo"
                  className="font-medium"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeStep(stepIndex)}
                  disabled={localSteps.length <= 1}
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                </Button>
              </div>
              <Input
                value={step.description}
                onChange={(e) => updateStep(stepIndex, { description: e.target.value })}
                placeholder="Descrição breve do passo"
                className="text-xs"
              />

              <div className="flex flex-col gap-2 pl-6">
                {step.questions.map((q, qIndex) => (
                  <div key={q.id} className="flex flex-col gap-1 rounded-md bg-brand-bg p-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={q.label}
                        onChange={(e) => updateQuestion(stepIndex, qIndex, { label: e.target.value })}
                        placeholder="Texto da pergunta"
                        className="text-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeQuestion(stepIndex, qIndex)}
                        disabled={step.questions.length <= 1}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </Button>
                    </div>
                    <Input
                      value={q.placeholder}
                      onChange={(e) => updateQuestion(stepIndex, qIndex, { placeholder: e.target.value })}
                      placeholder="Placeholder de exemplo (opcional)"
                      className="text-xs"
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={() => addQuestion(stepIndex)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Pergunta
                </Button>
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" className="w-fit" onClick={addStep}>
            <Plus className="h-3.5 w-3.5" />
            Novo passo
          </Button>
        </div>

        <div className="mt-6 flex items-center justify-between gap-2">
          {isCustom ? (
            <Button variant="ghost" onClick={handleResetDefault} disabled={isPending}>
              Restaurar padrão
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "Salvando…" : "Salvar questionário"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
