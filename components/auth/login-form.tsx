"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, Lock, LogIn } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { loginAction } from "@/app/actions/auth";

export function LoginForm({
  callbackUrl,
  google,
  microsoft,
}: {
  callbackUrl: string;
  google: boolean;
  microsoft: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await loginAction({ email, password });
      if (result.success) {
        toast.success("Login realizado com sucesso!");
        router.push(callbackUrl);
        router.refresh();
      } else {
        setError(result.error ?? "Não foi possível entrar.");
        toast.error(result.error ?? "Não foi possível entrar.");
      }
    });
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-brand-text text-lg font-semibold">Entrar</CardTitle>
        <p className="text-sm text-brand-muted">Acesse o painel de RH e TI da sua empresa.</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-mail</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@empresa.com"
                className="pl-9"
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9"
                required
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button type="submit" disabled={isPending} className="w-full">
            <LogIn className="h-4 w-4" />
            {isPending ? "Entrando…" : "Entrar"}
          </Button>
        </form>

        {(google || microsoft) && (
          <>
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-brand-border" />
              <span className="text-xs text-brand-muted">ou</span>
              <div className="h-px flex-1 bg-brand-border" />
            </div>
            <OAuthButtons google={google} microsoft={microsoft} callbackUrl={callbackUrl} />
          </>
        )}

        <p className="text-center text-xs text-brand-muted">
          Ainda não tem uma conta?{" "}
          <a href="/register" className="text-brand-primary hover:underline">
            Cadastre sua empresa
          </a>
        </p>
      </CardContent>
    </Card>
  );
}
