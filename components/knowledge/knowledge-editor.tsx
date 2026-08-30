"use client";

import { useRef, useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import {
  Pencil,
  Eye,
  Copy,
  Download,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import type { KnowledgeDocument, OffboardingSession } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { updateKnowledgeDocument, approveKnowledgeDocument } from "@/app/actions/knowledge";

type DocWithSession = KnowledgeDocument & { offboardingSession: OffboardingSession };

const statusBadge: Record<string, { label: string; variant: "primary" | "warning" | "success" }> = {
  DRAFT: { label: "Rascunho", variant: "warning" },
  PROCESSING: { label: "Processando", variant: "warning" },
  READY: { label: "Pronto para revisão", variant: "primary" },
  APPROVED: { label: "Aprovado pelo Gestor", variant: "success" },
};

export function KnowledgeEditor({ document }: { document: DocWithSession }) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [content, setContent] = useState(document.markdownContent);
  const [status, setStatus] = useState(document.status);
  const [isPending, startTransition] = useTransition();
  const [isExporting, setIsExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const badge = statusBadge[status];
  const isProcessing = status === "PROCESSING";

  function handleSave() {
    startTransition(async () => {
      const result = await updateKnowledgeDocument({ id: document.id, markdownContent: content });
      if (result.success) {
        toast.success("Alterações salvas.");
        setMode("view");
      } else {
        toast.error(result.error ?? "Não foi possível salvar.");
      }
    });
  }

  function handleApprove() {
    startTransition(async () => {
      const result = await approveKnowledgeDocument(document.id);
      if (result.success) {
        setStatus("APPROVED");
        toast.success("Documento aprovado pelo gestor.");
      } else {
        toast.error(result.error ?? "Não foi possível aprovar o documento.");
      }
    });
  }

  function handleCopyMarkdown() {
    navigator.clipboard.writeText(content);
    toast.success("Markdown copiado — cole no Notion, Confluence ou Coda.");
  }

  async function handleExportPdf() {
    if (!printRef.current) return;
    setIsExporting(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);

      const canvas = await html2canvas(printRef.current, {
        backgroundColor: "#00181a",
        scale: 2,
      });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${document.title.replace(/\s+/g, "-").toLowerCase()}.pdf`);
      toast.success("PDF exportado com sucesso.");
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível gerar o PDF.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-brand-text">{document.title}</h2>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
          <p className="text-sm text-brand-muted">
            {document.department} · Entrevista de {document.offboardingSession.employeeName}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyMarkdown} disabled={isProcessing}>
            <Copy className="h-3.5 w-3.5" />
            Copiar Markdown
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={isProcessing || isExporting}>
            {isExporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            Exportar PDF
          </Button>
          {mode === "view" ? (
            <Button size="sm" onClick={() => setMode("edit")} disabled={isProcessing}>
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </Button>
          ) : (
            <Button size="sm" onClick={handleSave} disabled={isPending}>
              <Eye className="h-3.5 w-3.5" />
              {isPending ? "Salvando…" : "Salvar & Visualizar"}
            </Button>
          )}
          {status !== "APPROVED" && (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleApprove}
              disabled={isPending || isProcessing}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Aprovar pelo Gestor
            </Button>
          )}
        </div>
      </div>

      {isProcessing ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
            <p className="text-sm text-brand-muted">
              A IA ainda está processando esta entrevista. Atualize a página em alguns
              instantes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 sm:p-8">
            {mode === "edit" ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={24}
                className="w-full resize-y rounded-lg border border-brand-border bg-brand-bg p-4 font-mono text-sm text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50"
              />
            ) : (
              <div ref={printRef} className="bg-brand-card p-2">
                <MarkdownView content={content} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {status === "APPROVED" && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          Este documento foi revisado e aprovado pelo gestor responsável.
        </div>
      )}
    </div>
  );
}

function MarkdownView({ content }: { content: string }) {
  return (
    <div className="prose-invert flex flex-col gap-4 text-sm leading-relaxed text-brand-text [&_a]:text-brand-primary [&_blockquote]:border-l-2 [&_blockquote]:border-brand-primary [&_blockquote]:pl-4 [&_blockquote]:text-brand-muted [&_code]:rounded [&_code]:bg-brand-bg [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-brand-primary [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-brand-text [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-brand-text [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-brand-text [&_hr]:border-brand-border [&_li]:ml-4 [&_ol]:list-decimal [&_p]:text-brand-muted [&_strong]:text-brand-text [&_ul]:list-disc">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
