import { prisma } from "@/lib/prisma";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { IntegrationCard } from "@/components/integrations/integration-card";
import { IntegrationLogs } from "@/components/integrations/integration-logs";
import { PROVIDERS } from "@/lib/integration-meta";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const [integrations, logs] = await Promise.all([
    prisma.integration.findMany(),
    prisma.integrationLog.findMany({
      include: { integration: true },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
  ]);

  const integrationByProvider = new Map(integrations.map((i) => [i.provider, i]));

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-brand-muted">
        Conecte provedores de identidade e SaaS para automatizar a revogação de
        acessos durante o offboarding.
      </p>

      <Tabs defaultValue="providers">
        <TabsList>
          <TabsTrigger value="providers">Provedores</TabsTrigger>
          <TabsTrigger value="logs">Logs de Execução</TabsTrigger>
        </TabsList>

        <TabsContent value="providers">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {PROVIDERS.map((meta) => (
              <IntegrationCard
                key={meta.provider}
                meta={meta}
                integration={integrationByProvider.get(meta.provider) ?? null}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <IntegrationLogs logs={logs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
