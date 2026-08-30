import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Mail, Calendar, Building2, FileText, ShieldOff, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AssetChecklist } from "@/components/dashboard/asset-checklist";
import { RevokeAccessButton } from "@/components/dashboard/revoke-access-button";
import { CancelOffboardingButton } from "@/components/dashboard/cancel-offboarding-button";
import {
  offboardingStatusLabel,
  offboardingStatusVariant,
} from "@/lib/offboarding-helpers";
import { getSessionUser, canManageIntegrations } from "@/lib/auth/session";

const providerLabel: Record<string, string> = {
  GOOGLE_WORKSPACE: "Google Workspace",
  MICROSOFT_ENTRA: "Microsoft Entra ID",
  SLACK: "Slack",
  GITHUB: "GitHub",
  OKTA: "Okta",
  NOTION: "Notion",
  FIGMA: "Figma",
};

export const dynamic = "force-dynamic";

export default async function OffboardingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const session = await prisma.offboardingSession.findFirst({
    where: { id, orgId: user.orgId },
    include: {
      assets: { orderBy: { createdAt: "asc" } },
      accessRevocations: true,
      knowledgeDocument: true,
    },
  });

  if (!session) notFound();

  const pendingRevocations = session.accessRevocations.filter((r) => !r.revoked);
  const formattedExitDate = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(session.exitDate);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-brand-text">{session.employeeName}</h2>
            <Badge variant={offboardingStatusVariant[session.status]}>
              {offboardingStatusLabel[session.status]}
            </Badge>
          </div>
          <p className="text-sm text-brand-muted">
            {session.role} · {session.department}
          </p>
        </div>

        {session.status !== "COMPLETED" && session.status !== "CANCELLED" && (
          <CancelOffboardingButton sessionId={session.id} />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <InfoCard icon={Mail} label="E-mail" value={session.email} />
        <InfoCard icon={Calendar} label="Data de saída" value={formattedExitDate} />
        <InfoCard icon={Building2} label="Departamento" value={session.department} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AssetChecklist offboardingSessionId={session.id} assets={session.assets} />

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-brand-text text-base font-semibold">
              Acessos & Revogação de TI
            </CardTitle>
            {pendingRevocations.length > 0 && canManageIntegrations(user.role) && (
              <RevokeAccessButton sessionId={session.id} count={pendingRevocations.length} />
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pt-0">
            {session.accessRevocations.length === 0 && (
              <p className="text-sm text-brand-muted">
                Nenhum acesso selecionado para revogação nesta sessão.
              </p>
            )}
            {session.accessRevocations.map((revocation) => (
              <div
                key={revocation.id}
                className="flex items-center justify-between rounded-lg border border-brand-border p-3"
              >
                <span className="flex items-center gap-2 text-sm text-brand-text">
                  <ShieldOff className="h-4 w-4 text-brand-muted" />
                  {providerLabel[revocation.provider] ?? revocation.provider}
                </span>
                <Badge variant={revocation.revoked ? "success" : "warning"}>
                  {revocation.revoked ? "Revogado" : "Pendente"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {session.knowledgeDocument && (
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-secondary/20">
                <FileText className="h-4.5 w-4.5 text-brand-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-brand-text">
                  {session.knowledgeDocument.title}
                </p>
                <p className="text-xs text-brand-muted">
                  Status: {session.knowledgeDocument.status}
                </p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href={`/knowledge/${session.id}`}>Ver manual de processos</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {session.status === "CANCELLED" && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          <XCircle className="h-4 w-4" />
          Este processo de offboarding foi cancelado.
        </div>
      )}
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-secondary/20">
          <Icon className="h-4 w-4 text-brand-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-brand-muted">{label}</p>
          <p className="truncate text-sm font-medium text-brand-text">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
