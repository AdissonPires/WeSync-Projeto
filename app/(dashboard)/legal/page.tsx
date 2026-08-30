import { prisma } from "@/lib/prisma";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LegalTermsTable } from "@/components/legal/legal-terms-table";
import { FiscalUploadForm } from "@/components/legal/fiscal-upload-form";
import { HRRequestsTable } from "@/components/legal/hr-requests-table";

export const dynamic = "force-dynamic";

export default async function LegalPage() {
  const [terms, sessions, requests] = await Promise.all([
    prisma.legalTerm.findMany({
      include: { offboardingSession: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.offboardingSession.findMany({ orderBy: { employeeName: "asc" } }),
    prisma.hRRequest.findMany({
      include: { offboardingSession: true },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-brand-muted">
        Acompanhe assinaturas de termos, disponibilize documentos fiscais e responda
        solicitações enviadas pelo Portal do Ex-Colaborador.
      </p>

      <Tabs defaultValue="terms">
        <TabsList>
          <TabsTrigger value="terms">Termos & Assinaturas</TabsTrigger>
          <TabsTrigger value="documents">Documentos Fiscais</TabsTrigger>
          <TabsTrigger value="requests">
            Solicitações {requests.filter((r) => r.status === "OPEN").length > 0 && (
              <span className="ml-1 rounded-full bg-brand-primary px-1.5 text-[10px] font-semibold text-brand-bg">
                {requests.filter((r) => r.status === "OPEN").length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="terms">
          <LegalTermsTable terms={terms} />
        </TabsContent>

        <TabsContent value="documents" className="flex flex-col gap-4">
          <FiscalUploadForm sessions={sessions} />
        </TabsContent>

        <TabsContent value="requests">
          <HRRequestsTable requests={requests} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
