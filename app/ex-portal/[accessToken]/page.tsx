import { Sparkles, Lock } from "lucide-react";
import { getExPortalData } from "@/app/actions/ex-portal";
import { ExPortalTabs } from "@/components/ex-portal/ex-portal-tabs";

export const dynamic = "force-dynamic";

export default async function ExPortalPage({
  params,
}: {
  params: Promise<{ accessToken: string }>;
}) {
  const { accessToken } = await params;
  const data = await getExPortalData(accessToken);

  return (
    <div className="flex min-h-screen flex-col bg-brand-bg">
      <header className="flex h-16 items-center gap-2 border-b border-brand-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10">
          <Sparkles className="h-4 w-4 text-brand-primary" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-brand-text">WSync</span>
        <span className="ml-2 text-xs text-brand-muted">Portal do Ex-Colaborador · wedpp</span>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:py-16">
        {!data || !data.active ? (
          <div className="flex max-w-md flex-col items-center gap-4 rounded-xl border border-brand-border bg-brand-card p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-secondary/20">
              <Lock className="h-6 w-6 text-brand-primary" />
            </div>
            <h1 className="text-lg font-semibold text-brand-text">Acesso indisponível</h1>
            <p className="text-sm text-brand-muted">
              Este link não existe ou foi desativado. Entre em contato com o RH da sua
              antiga empresa para mais informações.
            </p>
          </div>
        ) : (
          <ExPortalTabs accessToken={accessToken} data={data} />
        )}
      </main>
    </div>
  );
}
