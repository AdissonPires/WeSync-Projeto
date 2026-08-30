import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuditLogTable } from "@/components/compliance/audit-log-table";
import { AnonymizeButton } from "@/components/compliance/anonymize-button";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(
    date
  );
}

export default async function CompliancePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [sessions, logs] = await Promise.all([
    prisma.offboardingSession.findMany({
      where: { orgId: user.orgId },
      orderBy: { exitDate: "desc" },
    }),
    prisma.auditLog.findMany({
      where: { orgId: user.orgId },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-brand-muted">
        Governança de dados pessoais (LGPD) e trilha de auditoria imutável de acessos e
        ações no sistema.
      </p>

      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-brand-primary" />
          <CardTitle className="text-brand-text text-base font-semibold">
            Retenção & Anonimização de Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-0">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex flex-col gap-2 rounded-lg border border-brand-border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium text-brand-text">{session.employeeName}</p>
                <p className="text-xs text-brand-muted">
                  {session.role} · {session.department} · Saída em {formatDate(session.exitDate)}
                </p>
              </div>
              {session.anonymizedAt ? (
                <Badge variant="muted">
                  Anonimizado em {formatDate(session.anonymizedAt)}
                </Badge>
              ) : (
                <AnonymizeButton sessionId={session.id} employeeName={session.employeeName} />
              )}
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="text-sm text-brand-muted">Nenhuma sessão de desligamento cadastrada.</p>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-brand-text">Trilha de Auditoria</h2>
        <AuditLogTable logs={logs} />
      </div>
    </div>
  );
}
