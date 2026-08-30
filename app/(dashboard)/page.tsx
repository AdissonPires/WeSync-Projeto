import { redirect } from "next/navigation";
import { UserMinus, Brain, ShieldAlert } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { MetricCard } from "@/components/dashboard/metric-card";
import { OffboardingsTable } from "@/components/dashboard/offboardings-table";
import { TasksWidget } from "@/components/dashboard/tasks-widget";
import { computeAiProgress } from "@/lib/offboarding-helpers";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [sessions, tasks, pendingRevocations] = await Promise.all([
    prisma.offboardingSession.findMany({
      where: { orgId: user.orgId, status: { in: ["AI_CAPTURE", "IT_ACTION"] } },
      include: { knowledgeDocument: true, assets: true },
      orderBy: { exitDate: "asc" },
      take: 6,
    }),
    prisma.pendingTask.findMany({
      where: { OR: [{ offboardingSession: { orgId: user.orgId } }, { offboardingSessionId: null }] },
      orderBy: [{ done: "asc" }, { createdAt: "desc" }],
      take: 6,
    }),
    prisma.accessRevocation.count({
      where: { revoked: false, offboardingSession: { orgId: user.orgId } },
    }),
  ]);

  const activeCount = await prisma.offboardingSession.count({
    where: { orgId: user.orgId, status: { in: ["AI_CAPTURE", "IT_ACTION"] } },
  });

  const avgAiProgress =
    sessions.length > 0
      ? Math.round(
          sessions.reduce((sum, s) => sum + computeAiProgress(s.knowledgeDocument), 0) /
            sessions.length
        )
      : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard
          label="Desligamentos Ativos"
          value={String(activeCount)}
          icon={UserMinus}
        />
        <MetricCard
          label="Captura de Conhecimento IA"
          value={`${avgAiProgress}%`}
          icon={Brain}
          progress={avgAiProgress}
        />
        <MetricCard
          label="Revogações de TI Pendentes"
          value={String(pendingRevocations)}
          icon={ShieldAlert}
          trend={
            pendingRevocations > 0
              ? { value: `${pendingRevocations} acesso(s) em aberto`, positive: false }
              : undefined
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <OffboardingsTable sessions={sessions} />
        </div>
        <TasksWidget tasks={tasks} />
      </div>
    </div>
  );
}
