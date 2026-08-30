import Link from "next/link";
import { TrendingDown, Users, Sparkles, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TurnoverChart } from "@/components/analytics/turnover-charts";
import { getTurnoverAnalysis } from "@/app/actions/analytics";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PERIODS = [
  { value: 3, label: "3 meses" },
  { value: 6, label: "6 meses" },
  { value: 12, label: "12 meses" },
] as const;

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period } = await searchParams;
  const periodMonths = period === "3" || period === "12" ? Number(period) : 6;

  const analysis = await getTurnoverAnalysis(periodMonths as 3 | 6 | 12);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-brand-muted">
          Análise preditiva de causa-raiz de turnover, consolidada por IA a partir das
          entrevistas de saída.
        </p>
        <div className="flex gap-1 rounded-lg border border-brand-border bg-brand-card p-1">
          {PERIODS.map((p) => (
            <Link
              key={p.value}
              href={`/analytics?period=${p.value}`}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                periodMonths === p.value
                  ? "bg-brand-primary text-brand-bg"
                  : "text-brand-muted hover:text-brand-text"
              )}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary/10">
              <Users className="h-4.5 w-4.5 text-brand-primary" />
            </div>
            <div>
              <p className="text-xs text-brand-muted">Desligamentos analisados</p>
              <p className="text-2xl font-semibold text-brand-text">{analysis.sessionCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start gap-3 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-secondary/20">
              <TrendingDown className="h-4.5 w-4.5 text-brand-primary" />
            </div>
            <div>
              <p className="text-xs text-brand-muted">Sentimento geral das saídas</p>
              <p className="text-sm font-semibold text-brand-text">{analysis.sentiment.label}</p>
              <p className="mt-1 text-xs text-brand-muted">{analysis.sentiment.summary}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-brand-text text-base font-semibold">
              Motivos estimados de saída
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TurnoverChart reasons={analysis.reasons} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <Lightbulb className="h-4 w-4 text-brand-primary" />
            <CardTitle className="text-brand-text text-base font-semibold">
              Recomendações para o CHRO
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0">
            {analysis.recommendations.length === 0 ? (
              <p className="text-sm text-brand-muted">
                Sem recomendações suficientes para o período selecionado.
              </p>
            ) : (
              analysis.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg border border-brand-border p-3">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-primary" />
                  <p className="text-sm text-brand-muted">{rec}</p>
                </div>
              ))
            )}
            <Badge variant="muted" className="w-fit">
              {process.env.OPENAI_API_KEY ? "Gerado via GPT-4o-mini" : "Heurística local (demo)"}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
