import type { AuditLog } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(date);
}

export function AuditLogTable({ logs }: { logs: AuditLog[] }) {
  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-brand-muted">
          Nenhum evento registrado ainda.
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
                <th className="px-5 py-3 font-medium">Ator</th>
                <th className="px-5 py-3 font-medium">Ação</th>
                <th className="px-5 py-3 font-medium">Alvo</th>
                <th className="px-5 py-3 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-brand-border/60 last:border-0">
                  <td className="px-5 py-3 text-brand-muted">{formatDateTime(log.createdAt)}</td>
                  <td className="px-5 py-3 text-brand-text">{log.actor}</td>
                  <td className="px-5 py-3 text-brand-muted">{log.action}</td>
                  <td className="px-5 py-3 text-brand-text">{log.targetLabel}</td>
                  <td className="px-5 py-3 text-brand-muted">{log.ipAddress ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
