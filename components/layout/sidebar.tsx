"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserMinus,
  BrainCircuit,
  Plug,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/offboardings", label: "Desligamentos", icon: UserMinus },
  { href: "/knowledge", label: "Base de Conhecimento (IA)", icon: BrainCircuit },
  { href: "/integrations", label: "Integrações de TI", icon: Plug },
  { href: "/settings", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-brand-border bg-brand-card/40 md:flex">
      <div className="flex h-16 items-center gap-2 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10">
          <Sparkles className="h-4 w-4 text-brand-primary" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-brand-text">
          WSync
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {navItems.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-primary/10 text-brand-primary"
                  : "text-brand-muted hover:bg-brand-border/40 hover:text-brand-text"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-brand-border px-4 py-4">
        <div className="rounded-lg border border-brand-border bg-brand-bg px-3 py-3">
          <p className="text-xs font-medium text-brand-text">wedpp · Acme Corp</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-brand-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
            Plano Business — Ativo
          </p>
        </div>
      </div>
    </aside>
  );
}
