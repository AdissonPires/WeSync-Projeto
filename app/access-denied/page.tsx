import Link from "next/link";
import { ShieldOff, Sparkles } from "lucide-react";

export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-brand-bg px-4 text-center">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary/10">
          <Sparkles className="h-4.5 w-4.5 text-brand-primary" />
        </div>
        <span className="text-xl font-semibold tracking-tight text-brand-text">WSync</span>
      </div>

      <div className="flex max-w-md flex-col items-center gap-4 rounded-xl border border-brand-border bg-brand-card p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
          <ShieldOff className="h-6 w-6 text-red-400" />
        </div>
        <h1 className="text-lg font-semibold text-brand-text">Acesso negado</h1>
        <p className="text-sm text-brand-muted">
          Sua conta não tem permissão para acessar o painel administrativo do WSync.
          Se você acredita que isso é um engano, fale com o administrador da sua
          organização.
        </p>
        <Link
          href="/login"
          className="text-sm font-medium text-brand-primary hover:underline"
        >
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}
