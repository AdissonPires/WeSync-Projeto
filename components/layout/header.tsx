"use client";

import { usePathname } from "next/navigation";
import { Bell, Search, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { UserMenu } from "@/components/layout/user-menu";
import type { SessionUser } from "@/lib/auth/session";

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/offboardings": "Desligamentos",
  "/offboardings/new": "Novo Desligamento",
  "/knowledge": "Base de Conhecimento (IA)",
  "/templates": "Templates de Entrevista",
  "/analytics": "Analytics de Turnover",
  "/integrations": "Integrações de TI",
  "/legal": "Jurídico",
  "/compliance": "Compliance",
  "/settings": "Configurações",
};

function resolveTitle(pathname: string) {
  if (titles[pathname]) return titles[pathname];
  const match = Object.keys(titles)
    .filter((key) => key !== "/" && pathname.startsWith(key))
    .sort((a, b) => b.length - a.length)[0];
  return match ? titles[match] : "WSync";
}

export function Header({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const title = resolveTitle(pathname);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-brand-border px-6">
      <h1 className="text-lg font-semibold text-brand-text">{title}</h1>

      <div className="flex flex-1 items-center justify-end gap-4">
        <div className="relative hidden w-full max-w-sm sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
          <Input placeholder="Pesquisar colaboradores, SOPs, integrações…" className="pl-9" />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border text-brand-muted hover:text-brand-text">
              <Bell className="h-4 w-4" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                3
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Notificações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex-col items-start gap-0.5">
              <span className="flex items-center gap-1.5 text-sm font-medium text-red-400">
                <ShieldAlert className="h-3.5 w-3.5" />
                Alerta de segurança
              </span>
              <span className="text-xs text-brand-muted">
                Acesso GitHub de Rafael Almeida ainda ativo.
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex-col items-start gap-0.5">
              <span className="text-sm font-medium text-brand-text">
                Captura de IA concluída
              </span>
              <span className="text-xs text-brand-muted">
                Entrevista de Camila Duarte finalizada.
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <UserMenu user={user} />
      </div>
    </header>
  );
}
