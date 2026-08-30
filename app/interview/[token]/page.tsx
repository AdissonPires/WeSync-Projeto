import { Sparkles, Lock, CheckCircle2 } from "lucide-react";
import { getInterviewByToken } from "@/app/actions/interview";
import { InterviewWizard } from "@/components/interview/interview-wizard";

export const dynamic = "force-dynamic";

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const info = await getInterviewByToken(token);

  return (
    <div className="flex min-h-screen flex-col bg-brand-bg">
      <header className="flex h-16 items-center gap-2 border-b border-brand-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10">
          <Sparkles className="h-4 w-4 text-brand-primary" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-brand-text">WSync</span>
        <span className="ml-2 text-xs text-brand-muted">por wedpp</span>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:py-16">
        {!info ? (
          <InvalidState
            icon={Lock}
            title="Link inválido"
            description="Este link de entrevista não existe ou foi removido. Entre em contato com o RH da sua empresa para receber um novo link."
          />
        ) : info.reason === "used" ? (
          <InvalidState
            icon={CheckCircle2}
            title="Entrevista já enviada"
            description={`Obrigado, ${info.employeeName}! Suas respostas já foram registradas e não é possível enviar novamente por este link.`}
          />
        ) : info.reason === "expired" ? (
          <InvalidState
            icon={Lock}
            title="Link expirado"
            description="Este link de entrevista expirou. Entre em contato com o RH da sua empresa para receber um novo link."
          />
        ) : (
          <InterviewWizard
            token={token}
            employeeName={info.employeeName}
            role={info.role}
            department={info.department}
            companyName={info.companyName}
          />
        )}
      </main>
    </div>
  );
}

function InvalidState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Lock;
  title: string;
  description: string;
}) {
  return (
    <div className="flex max-w-md flex-col items-center gap-4 rounded-xl border border-brand-border bg-brand-card p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-secondary/20">
        <Icon className="h-6 w-6 text-brand-primary" />
      </div>
      <h1 className="text-lg font-semibold text-brand-text">{title}</h1>
      <p className="text-sm text-brand-muted">{description}</p>
    </div>
  );
}
