interface ExitReportInput {
  employeeName: string;
  role: string;
  department: string;
  dailyRoutines: string;
  weeklyRoutines: string;
  monthlyRoutines: string;
  projectsPending: string;
  fileLinks: string;
  requiredAccess: string;
  keyContacts: string;
  successorNotes: string;
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
  return `Gere um SOP (Standard Operating Procedure) em Markdown para o cargo de ${input.role} (${input.department}), com base na entrevista de saída de ${input.employeeName}.

Rotinas diárias: ${input.dailyRoutines}
Rotinas semanais: ${input.weeklyRoutines}
Rotinas mensais: ${input.monthlyRoutines}
Projetos e pendências: ${input.projectsPending}
Arquivos e acessos necessários: ${input.fileLinks} / ${input.requiredAccess}
Contatos-chave: ${input.keyContacts}
Recomendações para o sucessor: ${input.successorNotes}

Estruture com títulos, subtítulos e listas.`;
}

function generateMock(input: ExitReportInput): string {
  return `# Manual de Processos — ${input.role}

> Gerado automaticamente pela IA da WSync a partir da entrevista de saída de **${input.employeeName}** (${input.department}).

## Visão Geral

Este documento consolida o conhecimento operacional de ${input.employeeName} para garantir a continuidade das atividades do cargo de ${input.role} durante e após a transição.

## Rotinas Diárias

${toList(input.dailyRoutines)}

## Rotinas Semanais

${toList(input.weeklyRoutines)}

## Rotinas Mensais

${toList(input.monthlyRoutines)}

## Projetos em Andamento & Pendências

${toList(input.projectsPending)}

## Arquivos e Acessos Necessários

**Arquivos:** ${input.fileLinks}

**Acessos:** ${input.requiredAccess}

## Contatos-Chave

${toList(input.keyContacts)}

## Recomendações para o Sucessor

${input.successorNotes}

---

*Este documento foi gerado automaticamente e está sujeito à revisão do gestor responsável antes da aprovação final.*
`;
}

function toList(text: string) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `- ${line}`)
    .join("\n");
}
