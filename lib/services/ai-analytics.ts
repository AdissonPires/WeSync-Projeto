export interface TurnoverReason {
  label: string;
  percent: number;
}

export interface TurnoverAnalysis {
  sessionCount: number;
  reasons: TurnoverReason[];
  sentiment: { label: string; summary: string };
  recommendations: string[];
}

export interface TurnoverEntry {
  department: string;
  role: string;
  answersText: string;
  knowledgeMarkdown?: string | null;
}

const EMPTY_ANALYSIS: TurnoverAnalysis = {
  sessionCount: 0,
  reasons: [],
  sentiment: {
    label: "Sem dados suficientes",
    summary: "Nenhuma entrevista de saída registrada no período selecionado.",
  },
  recommendations: [],
};

/**
 * Consolida entrevistas de saída para estimar causas-raiz de turnover.
 * Usa a OpenAI (gpt-4o-mini) quando OPENAI_API_KEY está configurada;
 * caso contrário, usa uma heurística local por palavras-chave.
 */
export async function analyzeTurnover(entries: TurnoverEntry[]): Promise<TurnoverAnalysis> {
  if (entries.length === 0) return EMPTY_ANALYSIS;

  if (process.env.OPENAI_API_KEY) {
    try {
      return await analyzeWithOpenAI(entries);
    } catch (error) {
      console.error("Falha na análise de turnover via OpenAI, usando heurística local:", error);
      return analyzeWithHeuristics(entries);
    }
  }
  return analyzeWithHeuristics(entries);
}

async function analyzeWithOpenAI(entries: TurnoverEntry[]): Promise<TurnoverAnalysis> {
  const corpus = entries
    .map((e, i) => `Saída #${i + 1} — Cargo: ${e.role} (${e.department})\n${e.answersText}`)
    .join("\n\n---\n\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Você é um analista de People Analytics. Analise entrevistas de saída anonimizadas e retorne APENAS um JSON com o formato: " +
            '{"reasons":[{"label":string,"percent":number}],"sentiment":{"label":string,"summary":string},"recommendations":[string]}. ' +
            "Os percentuais em reasons devem somar aproximadamente 100. Escreva em português do Brasil.",
        },
        { role: "user", content: corpus },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`Falha na chamada à OpenAI: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Resposta da OpenAI sem conteúdo.");

  const parsed = JSON.parse(content);
  return { sessionCount: entries.length, ...parsed };
}

const KEYWORD_REASONS: { label: string; keywords: string[] }[] = [
  { label: "Remuneração & Benefícios", keywords: ["salário", "remunera", "benefício", "bonus", "bônus"] },
  { label: "Liderança & Gestão", keywords: ["líder", "gestor", "gestão", "chefe", "supervisor"] },
  { label: "Plano de Carreira", keywords: ["carreira", "crescimento", "promoção", "evolução"] },
  { label: "Cultura & Clima", keywords: ["cultura", "clima", "ambiente", "equilíbrio", "burnout", "estresse"] },
  { label: "Carga de Trabalho", keywords: ["carga", "sobrecarga", "horário", "prazo", "pressão"] },
];

function analyzeWithHeuristics(entries: TurnoverEntry[]): TurnoverAnalysis {
  const combined = entries.map((e) => e.answersText.toLowerCase());

  const counts = KEYWORD_REASONS.map((reason) => ({
    label: reason.label,
    count: combined.filter((text) => reason.keywords.some((kw) => text.includes(kw))).length,
  }));

  const totalHits = counts.reduce((sum, c) => sum + c.count, 0);
  const fallbackWeight = 1 / KEYWORD_REASONS.length;

  const reasons: TurnoverReason[] =
    totalHits === 0
      ? KEYWORD_REASONS.map((r) => ({ label: r.label, percent: Math.round(fallbackWeight * 100) }))
      : counts
          .filter((c) => c.count > 0)
          .map((c) => ({ label: c.label, percent: Math.round((c.count / totalHits) * 100) }));

  const normalized = normalizeToHundred(reasons);
  const top = [...normalized].sort((a, b) => b.percent - a.percent)[0];

  return {
    sessionCount: entries.length,
    reasons: normalized,
    sentiment: {
      label: totalHits === 0 ? "Neutro" : "Misto, com sinais de atenção",
      summary:
        totalHits === 0
          ? "As entrevistas não indicam um padrão dominante de insatisfação — os motivos de saída parecem diversos e pontuais."
          : `O motivo mais recorrente identificado nas entrevistas foi "${top.label.toLowerCase()}", presente em parte significativa das saídas analisadas.`,
    },
    recommendations: buildRecommendations(normalized),
  };
}

function normalizeToHundred(reasons: TurnoverReason[]): TurnoverReason[] {
  const sum = reasons.reduce((s, r) => s + r.percent, 0);
  if (sum === 0) return reasons;
  const scaled = reasons.map((r) => ({ ...r, percent: Math.round((r.percent / sum) * 100) }));
  const diff = 100 - scaled.reduce((s, r) => s + r.percent, 0);
  if (diff !== 0 && scaled.length > 0) scaled[0].percent += diff;
  return scaled;
}

function buildRecommendations(reasons: TurnoverReason[]): string[] {
  const sorted = [...reasons].sort((a, b) => b.percent - a.percent).slice(0, 2);
  const map: Record<string, string> = {
    "Remuneração & Benefícios":
      "Revisar a política salarial e benchmark de mercado para os cargos com maior recorrência de saída.",
    "Liderança & Gestão":
      "Investir em treinamento de lideranças e coletar feedback 360° recorrente para identificar gestores em risco.",
    "Plano de Carreira":
      "Estruturar trilhas de carreira mais claras e ciclos de promoção mais frequentes.",
    "Cultura & Clima":
      "Realizar pesquisas de clima periódicas e agir sobre os pontos críticos antes que virem desligamentos.",
    "Carga de Trabalho":
      "Revisar dimensionamento de times e prazos para reduzir sobrecarga nas áreas mais afetadas.",
  };
  const recs = sorted.map((r) => map[r.label]).filter(Boolean) as string[];
  recs.push(
    "Acompanhar a evolução desses indicadores trimestralmente para medir o impacto das ações tomadas."
  );
  return recs;
}
