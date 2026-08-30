"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import type { OffboardingSession } from "@prisma/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { uploadFiscalDocument } from "@/app/actions/legal";

export function FiscalUploadForm({ sessions }: { sessions: OffboardingSession[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [sessionId, setSessionId] = useState("");
  const [type, setType] = useState<"INCOME_REPORT" | "PAYSLIP">("INCOME_REPORT");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    if (!sessionId) {
      toast.error("Selecione o colaborador.");
      return;
    }
    formData.set("offboardingSessionId", sessionId);
    formData.set("type", type);

    startTransition(async () => {
      const result = await uploadFiscalDocument(formData);
      if (result.success) {
        toast.success("Documento enviado com sucesso.");
        formRef.current?.reset();
        setSessionId("");
      } else {
        toast.error(result.error ?? "Não foi possível enviar o documento.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-brand-text text-base font-semibold">
          Anexar documento fiscal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Colaborador</Label>
            <Select value={sessionId} onValueChange={setSessionId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o colaborador" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.employeeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Tipo de documento</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INCOME_REPORT">Informe de Rendimentos</SelectItem>
                <SelectItem value="PAYSLIP">Holerite</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" placeholder="Ex: Informe de Rendimentos 2025" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="year">Ano de referência (opcional)</Label>
            <Input id="year" name="year" type="number" placeholder="2025" />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="file">Arquivo PDF</Label>
            <Input id="file" name="file" type="file" accept="application/pdf" required />
          </div>
          <Button type="submit" disabled={isPending} className="w-fit">
            <Upload className="h-3.5 w-3.5" />
            {isPending ? "Enviando…" : "Enviar documento"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
