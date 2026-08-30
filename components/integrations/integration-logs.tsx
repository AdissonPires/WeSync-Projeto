import type { IntegrationLog, Integration } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getProviderMeta } from "@/lib/integration-meta";

type LogRow = IntegrationLog & { integration: Integration };

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function IntegrationLogs({ logs }: { logs: LogRow[] }) {
  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-brand-muted">
          Nenhuma chamada registrada ainda. Teste uma conexão ou revogue acessos para ver
          o histórico aqui.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-brand-border text-xs text-brand-muted">
                <th className="px-5 py-3 font-medium">Data</th>
                <th className="px-5 py-3 font-medium">Usuário/Sessão</th>
                <th className="px-5 py-3 font-medium">Provedor</th>
                <th className="px-5 py-3 font-medium">Ação</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-brand-border/60 last:border-0">
                  <td className="px-5 py-3 text-brand-muted">
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td className="px-5 py-3 text-brand-text">{log.targetUser}</td>
                  <td className="px-5 py-3 text-brand-muted">
                    {getProviderMeta(log.integration.provider).name}
                  </td>
                  <td className="px-5 py-3 text-brand-muted">{log.action}</td>
                  <td className="px-5 py-3">
                    <Badge variant={log.status === "SUCCESS" ? "success" : "danger"}>
                      {log.statusCode} {log.status === "SUCCESS" ? "OK" : "Error"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
