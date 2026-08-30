import type { TemplateStep } from "@/lib/interview-template";

interface ExitReportInput {
  employeeName: string;
  role: string;
  department: string;
  steps: TemplateStep[];
  answers: Record<string, string>;
  voiceTranscript?: string | null;
}

/**
 * Generates the SOP markdown from an exit interview.
 * Uses OpenAI (gpt-4o-mini) when OPENAI_API_KEY is set; otherwise falls back
 * to a deterministic mock so the pipeline works end-to-end without a key.
 */
export async function generateExitReport(input: ExitReportInput): Promise<string> {
  if (process.env.OPENAI_API_KEY) {
    return generateWithOpenAI(input);
  }
  return generateMock(input);
}

async function generateWithOpenAI(input: ExitReportInput): Promise<string> {
  const prompt = buildPrompt(input);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Você é um analista de operações que transforma entrevistas de desligamento em manuais de processos (SOPs) claros, estruturados em Markdown, para o sucessor no cargo.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha na chamada à OpenAI: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Resposta da OpenAI sem conteúdo.");
  return content as string;
}

function buildPrompt(input: ExitReportInput) {
  const qa = input.steps
    .map((step) =>
      step.questions
        .map((q) => `${q.label}: ${input.answers[q.id] ?? "(não respondido)"}`)
        .join("\n")
    )
    .join("\n\n");

  const voiceSection = input.voiceTranscript
    ? `\n\nNotas de voz transcritas (Whisper):\n${input.voiceTranscript}`
    : "";

  return `Gere um SOP (Standard Operating Procedure) em Markdown para o cargo de ${input.role} (${input.department}), com base na entrevista de saída de ${input.employeeName}.

${qa}${voiceSection}

Estruture com títulos, subtítulos e listas, seguindo a ordem das perguntas acima.`;
}

function generateMock(input: ExitReportInput): string {
  const sections = input.steps
    .map((step) => {
      const body = step.questions
        .map((q) => `## ${q.label}\n\n${toList(input.answers[q.id] ?? "")}`)
        .join("\n\n");
      return `# ${step.title}\n\n${body}`;
    })
    .join("\n\n");

  const voiceSection = input.voiceTranscript
    ? `\n\n## Notas de Voz (transcrição)\n\n${input.voiceTranscript}\n`
    : "";

  return `# Manual de Processos — ${input.role}

> Gerado automaticamente pela IA da WSync a partir da entrevista de saída de **${input.employeeName}** (${input.department}).

${sections}${voiceSection}

---

*Este documento foi gerado automaticamente e está sujeito à revisão do gestor responsável antes da aprovação final.*
`;
}

function toList(text: string) {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return "_Não respondido._";
  return lines.map((line) => `- ${line}`).join("\n");
}
