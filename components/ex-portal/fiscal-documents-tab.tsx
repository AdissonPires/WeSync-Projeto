import { FileText, Download } from "lucide-react";
import type { FiscalDocument } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";

const typeLabel: Record<FiscalDocument["type"], string> = {
  INCOME_REPORT: "Informe de Rendimentos",
  PAYSLIP: "Holerite",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(
    date
  );
}

export function FiscalDocumentsTab({
  accessToken,
  documents,
}: {
  accessToken: string;
  documents: FiscalDocument[];
}) {
  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-brand-muted">
          Nenhum documento disponível ainda. Assim que o RH anexar seu Informe de
          Rendimentos ou holerites, eles aparecerão aqui.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {documents.map((doc) => (
        <Card key={doc.id}>
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-secondary/20">
                <FileText className="h-4.5 w-4.5 text-brand-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-brand-text">{doc.title}</p>
                <p className="text-xs text-brand-muted">
                  {typeLabel[doc.type]}
                  {doc.year ? ` · ${doc.year}` : ""} · Enviado em {formatDate(doc.uploadedAt)}
                </p>
              </div>
            </div>
            <a
              href={`/ex-portal/${accessToken}/documents/${doc.id}`}
              className="flex items-center gap-1.5 rounded-lg border border-brand-border px-3 py-1.5 text-xs font-medium text-brand-text hover:bg-brand-bg"
            >
              <Download className="h-3.5 w-3.5" />
              Baixar
            </a>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
