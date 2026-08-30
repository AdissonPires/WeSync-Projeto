import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSessionUser } from "@/lib/auth/session";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

const statusBadge: Record<string, { label: string; variant: "primary" | "warning" | "success" }> = {
  DRAFT: { label: "Rascunho", variant: "warning" },
  PROCESSING: { label: "Processando", variant: "warning" },
  READY: { label: "Pronto para revisão", variant: "primary" },
  APPROVED: { label: "Aprovado", variant: "success" },
};

export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const docs = await prisma.knowledgeDocument.findMany({
    where: { offboardingSession: { orgId: user.orgId } },
    include: { offboardingSession: true },
    orderBy: { generatedAt: "desc" },
  });

  const departments = Array.from(new Set(docs.map((d) => d.department)));

  return (
    <div className="flex flex-col gap-8">
      <p className="text-sm text-brand-muted">
        Manuais de processos (SOPs) gerados automaticamente pela IA a partir das
        entrevistas de saída, organizados por departamento.
      </p>

      {docs.length === 0 && (
        <p className="text-sm text-brand-muted">
          Nenhum manual gerado ainda. Ele aparece aqui assim que um colaborador enviar a
          entrevista de saída.
        </p>
      )}

      {departments.map((dept) => (
        <div key={dept} className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-brand-text">{dept}</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {docs
              .filter((d) => d.department === dept)
              .map((doc) => {
                const badge = statusBadge[doc.status];
                return (
                  <Link key={doc.id} href={`/knowledge/${doc.offboardingSessionId}`}>
                    <Card className="h-full transition-colors hover:border-brand-secondary">
                      <CardContent className="flex h-full flex-col gap-3 p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-secondary/20">
                            <FileText className="h-4 w-4 text-brand-primary" />
                          </div>
                          <Badge variant={badge.variant}>
                            <Sparkles className="h-3 w-3" />
                            {badge.label}
                          </Badge>
                        </div>
                        <h3 className="text-sm font-semibold leading-snug text-brand-text">
                          {doc.title}
                        </h3>
                        <p className="text-xs text-brand-muted">
                          Entrevista de saída — {doc.offboardingSession.employeeName}
                        </p>
                        <div className="mt-auto flex items-center justify-between text-xs text-brand-muted">
                          <span>Atualizado em {formatDate(doc.updatedAt)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
