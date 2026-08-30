import Link from "next/link";
import type { Asset, KnowledgeDocument, OffboardingSession } from "@prisma/client";
import { MoreHorizontal, Package } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  offboardingStatusLabel,
  offboardingStatusVariant,
  computeAssetProgress,
} from "@/lib/offboarding-helpers";

export type OffboardingRow = OffboardingSession & {
  knowledgeDocument: KnowledgeDocument | null;
  assets: Asset[];
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date);
}

export function OffboardingsTable({
  sessions,
  title = "Desligamentos Ativos",
}: {
  sessions: OffboardingRow[];
  title?: string;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-brand-text text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {sessions.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-brand-muted">
            Nenhum desligamento encontrado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-y border-brand-border text-xs text-brand-muted">
                  <th className="px-5 py-3 font-medium">Nome</th>
                  <th className="px-5 py-3 font-medium">Cargo / Departamento</th>
                  <th className="px-5 py-3 font-medium">Data de Saída</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Ativos</th>
                  <th className="px-5 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => {
                  const assetProgress = computeAssetProgress(session.assets);
                  return (
                    <tr
                      key={session.id}
                      className="border-b border-brand-border/60 last:border-0 hover:bg-brand-bg/40"
                    >
                      <td className="px-5 py-3">
                        <Link
                          href={`/offboardings/${session.id}`}
                          className="flex items-center gap-3"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{initials(session.employeeName)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-brand-text hover:text-brand-primary">
                            {session.employeeName}
                          </span>
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-brand-muted">
                        <div className="text-brand-text">{session.role}</div>
                        <div className="text-xs">{session.department}</div>
                      </td>
                      <td className="px-5 py-3 text-brand-muted">
                        {formatDate(session.exitDate)}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={offboardingStatusVariant[session.status]}>
                          {offboardingStatusLabel[session.status]}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs text-brand-muted">
                          <Package className="h-3.5 w-3.5" />
                          {assetProgress}%
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="rounded-md p-1.5 text-brand-muted hover:bg-brand-border hover:text-brand-text">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/offboardings/${session.id}`}>Ver detalhes</Link>
                            </DropdownMenuItem>
                            {session.knowledgeDocument && (
                              <DropdownMenuItem asChild>
                                <Link href={`/knowledge/${session.id}`}>
                                  Revisar SOP gerado
                                </Link>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
