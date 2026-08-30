import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FiscalDocumentsTab } from "@/components/ex-portal/fiscal-documents-tab";
import { LegalTermsTab } from "@/components/ex-portal/legal-terms-tab";
import { HRRequestTab } from "@/components/ex-portal/hr-request-tab";
import type { ExPortalData } from "@/app/actions/ex-portal";

export function ExPortalTabs({
  accessToken,
  data,
}: {
  accessToken: string;
  data: ExPortalData;
}) {
  return (
    <div className="w-full max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-brand-text">Olá, {data.employeeName} 👋</h1>
        <p className="mt-1 text-sm text-brand-muted">
          Este é o seu espaço permanente para acessar documentos, assinar termos pendentes e
          falar com o RH da sua antiga empresa, mesmo após o desligamento.
        </p>
      </div>

      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="terms">Termos & Assinaturas</TabsTrigger>
          <TabsTrigger value="requests">Solicitações ao RH</TabsTrigger>
        </TabsList>

        <TabsContent value="documents">
          <FiscalDocumentsTab accessToken={accessToken} documents={data.fiscalDocuments} />
        </TabsContent>
        <TabsContent value="terms">
          <LegalTermsTab accessToken={accessToken} terms={data.legalTerms} />
        </TabsContent>
        <TabsContent value="requests">
          <HRRequestTab accessToken={accessToken} requests={data.hrRequests} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
