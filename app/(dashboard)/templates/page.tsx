import { redirect } from "next/navigation";
import { ClipboardList, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TemplateEditorDialog } from "@/components/templates/template-editor-dialog";
import { DEFAULT_TEMPLATE_STEPS, DEFAULT_TEMPLATE_TITLE, totalQuestions } from "@/lib/interview-template";
import type { TemplateStep } from "@/lib/interview-template";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [sessions, templates] = await Promise.all([
    prisma.offboardingSession.findMany({
      where: { orgId: user.orgId },
      select: { department: true },
      distinct: ["department"],
    }),
    prisma.interviewTemplate.findMany({ where: { orgId: user.orgId } }),
  ]);

  const departmentSet = new Set<string>(sessions.map((s) => s.department));
  templates.forEach((t) => departmentSet.add(t.department));
  const departments = Array.from(departmentSet).sort((a, b) => a.localeCompare(b));

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-brand-muted">
        Personalize as perguntas da entrevista de saída para cada departamento. Sem um
        questionário customizado, o WSync usa o questionário padrão automaticamente.
      </p>

      {departments.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-brand-muted">
            Nenhum departamento encontrado ainda. Crie um desligamento para começar.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {departments.map((department) => {
            const custom = templates.find((t) => t.department === department);
            const steps = (custom?.steps as unknown as TemplateStep[]) ?? DEFAULT_TEMPLATE_STEPS;
            const title = custom?.title ?? DEFAULT_TEMPLATE_TITLE;

            return (
              <Card key={department}>
                <CardContent className="flex flex-col gap-3 p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-secondary/20">
                      <ClipboardList className="h-4 w-4 text-brand-primary" />
                    </div>
                    <Badge variant={custom ? "primary" : "muted"}>
                      {custom ? "Customizado" : "Padrão"}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-brand-text">{department}</h3>
                    <p className="mt-0.5 text-xs text-brand-muted">{title}</p>
                  </div>
                  <p className="text-xs text-brand-muted">
                    {steps.length} passos · {totalQuestions(steps)} perguntas
                  </p>
                  <TemplateEditorDialog
                    department={department}
                    title={title}
                    steps={steps}
                    isCustom={!!custom}
                    trigger={
                      <Button variant="outline" size="sm" className="w-fit">
                        <Pencil className="h-3.5 w-3.5" />
                        Editar questionário
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
