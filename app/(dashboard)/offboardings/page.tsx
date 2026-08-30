import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OffboardingsTable } from "@/components/dashboard/offboardings-table";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function OffboardingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const sessions = await prisma.offboardingSession.findMany({
    where: { orgId: user.orgId },
    include: { knowledgeDocument: true, assets: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-brand-muted">
          Acompanhe todos os processos de desligamento em andamento e concluídos.
        </p>
        <Button asChild>
          <Link href="/offboardings/new">
            <Plus className="h-4 w-4" />
            Novo Desligamento
          </Link>
        </Button>
      </div>
      <OffboardingsTable sessions={sessions} title="Todos os Desligamentos" />
    </div>
  );
}
