import { PrismaClient } from "@prisma/client";
import { generateExitReport } from "../lib/ai/generate-exit-report";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding WSync demo data…");

  await prisma.integrationLog.deleteMany();
  await prisma.integration.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.hRRequest.deleteMany();
  await prisma.legalTerm.deleteMany();
  await prisma.fiscalDocument.deleteMany();
  await prisma.exPortalAccess.deleteMany();
  await prisma.accessRevocation.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.pendingTask.deleteMany();
  await prisma.knowledgeDocument.deleteMany();
  await prisma.exitInterviewResponse.deleteMany();
  await prisma.interviewToken.deleteMany();
  await prisma.offboardingSession.deleteMany();
  await prisma.interviewTemplate.deleteMany();

  // --- Interview templates (questionários dinâmicos por departamento) ---
  const engenhariaSteps = [
    {
      title: "Repositórios, Deploys & Infraestrutura",
      description: "Nos ajude a mapear o que você mantém tecnicamente.",
      questions: [
        {
          id: "repos",
          label: "Quais repositórios de código você mantém ou administra?",
          placeholder: "Ex: acme/api-pagamentos (admin), acme/infra-terraform (colaborador)…",
        },
        {
          id: "deployProcess",
          label: "Como funciona o processo de deploy dos seus projetos?",
          placeholder: "Ex: CI no GitHub Actions, deploy automático na main, aprovação manual em produção…",
        },
        {
          id: "servers",
          label: "Quais servidores, bancos de dados ou serviços em nuvem você administra?",
          placeholder: "Ex: RDS de produção, bucket S3 de backups, cluster Kubernetes…",
        },
      ],
    },
    {
      title: "Rotinas Técnicas",
      description: "Descreva suas atividades recorrentes.",
      questions: [
        { id: "dailyRoutines", label: "Rotinas diárias", placeholder: "Ex: Reviso PRs, monitoro alertas…" },
        { id: "weeklyRoutines", label: "Rotinas semanais", placeholder: "Ex: Deploy de produção toda sexta…" },
      ],
    },
    {
      title: "Passagem de Bastão",
      description: "Ajude quem for assumir suas atividades a começar com o pé direito.",
      questions: [
        { id: "keyContacts", label: "Contatos técnicos-chave", placeholder: "Ex: Time de Dados para métricas de API…" },
        { id: "successorNotes", label: "Recomendações para o sucessor", placeholder: "Ex: Comece revisando os PRs em aberto…" },
      ],
    },
  ];

  const vendasSteps = [
    {
      title: "Carteira de Clientes",
      description: "Mapeie os relacionamentos comerciais sob sua responsabilidade.",
      questions: [
        {
          id: "clientPortfolio",
          label: "Descreva sua carteira de clientes ativos",
          placeholder: "Ex: 12 contas enterprise, destaque para Acme Retail (contrato renovando em out/2026)…",
        },
        {
          id: "negotiations",
          label: "Há contas em negociação ou risco de churn?",
          placeholder: "Ex: Cliente X está avaliando concorrente, negociação de desconto em andamento…",
        },
      ],
    },
    {
      title: "Pipeline & Processos Comerciais",
      description: "Como você organiza e conduz suas vendas.",
      questions: [
        {
          id: "pipelineProcess",
          label: "Como você organiza seu pipeline de vendas?",
          placeholder: "Ex: Uso o CRM HubSpot, funil com 5 etapas, follow-up semanal…",
        },
        {
          id: "salesTools",
          label: "Ferramentas e rotinas que utiliza no dia a dia comercial",
          placeholder: "Ex: HubSpot, planilha de metas, reunião semanal de forecast…",
        },
      ],
    },
    {
      title: "Passagem de Bastão",
      description: "Ajude quem for assumir sua carteira a começar com o pé direito.",
      questions: [
        { id: "keyContacts", label: "Contatos-chave dos clientes", placeholder: "Ex: Maria (decisora na Acme Retail)…" },
        { id: "successorNotes", label: "Recomendações para o sucessor", placeholder: "Ex: Priorize a renovação do contrato X…" },
      ],
    },
  ];

  await prisma.interviewTemplate.create({
    data: { department: "Engenharia", title: "Questionário Técnico — Engenharia", steps: engenhariaSteps },
  });
  await prisma.interviewTemplate.create({
    data: { department: "Vendas", title: "Questionário Comercial — Vendas", steps: vendasSteps },
  });

  // --- Integrations -------------------------------------------------
  const googleIntegration = await prisma.integration.create({
    data: {
      provider: "GOOGLE_WORKSPACE",
      status: "CONNECTED",
      config: { clientId: "demo-client-id.apps.googleusercontent.com" },
      lastTestedAt: new Date(),
    },
  });
  const slackIntegration = await prisma.integration.create({
    data: {
      provider: "SLACK",
      status: "CONNECTED",
      config: { apiToken: "xoxb-demo-token" },
      lastTestedAt: new Date(),
    },
  });
  await prisma.integration.create({
    data: { provider: "GITHUB", status: "CONNECTED", config: { apiToken: "ghp_demo" } },
  });
  await prisma.integration.create({ data: { provider: "OKTA", status: "PENDING" } });
  await prisma.integration.create({ data: { provider: "NOTION", status: "PENDING" } });
  await prisma.integration.create({ data: { provider: "MICROSOFT_ENTRA", status: "PENDING" } });
  await prisma.integration.create({ data: { provider: "FIGMA", status: "PENDING" } });

  await prisma.integrationLog.createMany({
    data: [
      {
        integrationId: googleIntegration.id,
        action: "revoke_access",
        targetUser: "rafael.almeida@acme.com",
        status: "SUCCESS",
        statusCode: 200,
        message: "Acesso ao Google Workspace revogado com sucesso.",
      },
      {
        integrationId: slackIntegration.id,
        action: "revoke_access",
        targetUser: "juliana.prado@acme.com",
        status: "SUCCESS",
        statusCode: 200,
        message: "Conta desativada no workspace do Slack.",
      },
      {
        integrationId: googleIntegration.id,
        action: "test_connection",
        targetUser: "system",
        status: "ERROR",
        statusCode: 401,
        message: "Falha na autenticação — verifique as credenciais.",
      },
    ],
  });

  // --- Session 1: fully completed with approved knowledge doc -------
  const rafael = await prisma.offboardingSession.create({
    data: {
      employeeName: "Rafael Almeida",
      email: "rafael.almeida@acme.com",
      cpf: "123.456.789-00",
      role: "Engenheiro de Software Sênior",
      department: "Engenharia",
      exitDate: new Date("2026-09-02"),
      status: "IT_ACTION",
      assets: {
        create: [
          { type: "NOTEBOOK", serialNumber: "MBP-2023-0091", status: "RETURNED" },
          { type: "BADGE", serialNumber: "Crachá #4821", status: "PENDING_RETURN" },
        ],
      },
      accessRevocations: {
        create: [
          { provider: "GITHUB", revoked: false },
          { provider: "SLACK", revoked: true, revokedAt: new Date() },
        ],
      },
    },
  });

  const rafaelAnswers = {
    repos: "acme/api-pagamentos (admin), acme/infra-terraform (colaborador), acme/mobile-app (colaborador).",
    deployProcess: "CI no GitHub Actions, deploy automático na main para staging, aprovação manual para produção.",
    servers: "RDS de produção (Postgres), bucket S3 de backups, cluster Kubernetes de pagamentos.",
    dailyRoutines: "Reviso PRs abertos, participo do daily do time, monitoro alertas do Sentry.",
    weeklyRoutines: "Toda sexta faço o deploy de produção e atualizo o changelog interno.",
    keyContacts: "Camila (RH) para dúvidas de processo, time de Dados para métricas de API.",
    successorNotes: "Comece revisando os PRs em aberto antes de iniciar o rollout da migração de pagamentos.",
  };

  const rafaelVoiceTranscript =
    "## Repositórios, Deploys & Infraestrutura\n[Transcrição de exemplo] A migração do serviço de pagamentos está 70% concluída, falta apenas o rollout gradual para os clientes enterprise. A documentação técnica completa está em notion.so/acme/pagamentos, e o sucessor vai precisar de acesso admin ao GitHub da organização e à chave de produção do Stripe.";

  const rafaelMarkdown = await generateExitReport({
    employeeName: rafael.employeeName,
    role: rafael.role,
    department: rafael.department,
    steps: engenhariaSteps,
    answers: rafaelAnswers,
    voiceTranscript: rafaelVoiceTranscript,
  });

  await prisma.exitInterviewResponse.create({
    data: {
      offboardingSessionId: rafael.id,
      templateSnapshot: engenhariaSteps,
      answers: rafaelAnswers,
      voiceTranscript: rafaelVoiceTranscript,
    },
  });

  await prisma.knowledgeDocument.create({
    data: {
      offboardingSessionId: rafael.id,
      title: `Manual de Processos — ${rafael.role}`,
      department: rafael.department,
      markdownContent: rafaelMarkdown,
      status: "READY",
    },
  });

  await prisma.interviewToken.create({
    data: {
      offboardingSessionId: rafael.id,
      used: true,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
    },
  });

  await prisma.pendingTask.create({
    data: {
      offboardingSessionId: rafael.id,
      title: `Revogar acesso GitHub — ${rafael.employeeName}`,
      description: "Acesso ainda ativo após a data de desligamento.",
      urgent: true,
    },
  });

  const rafaelPortal = await prisma.exPortalAccess.create({
    data: { offboardingSessionId: rafael.id },
  });

  await prisma.legalTerm.create({
    data: {
      offboardingSessionId: rafael.id,
      type: "AVISO_PREVIO",
      title: "Aviso Prévio Indenizado",
      content: `# Aviso Prévio Indenizado\n\nA empresa **Acme Corp** comunica a ${rafael.employeeName} o desligamento do cargo de ${rafael.role}, com aviso prévio indenizado, nos termos da legislação trabalhista vigente.\n\n- Data de desligamento: 02/09/2026\n- Modalidade: Indenizado\n- Verbas rescisórias a serem pagas em até 10 dias corridos\n\nAo assinar este termo, o colaborador declara estar ciente das condições acima.`,
      status: "PENDING",
    },
  });

  await prisma.legalTerm.create({
    data: {
      offboardingSessionId: rafael.id,
      type: "TERMO_QUITACAO",
      title: "Termo de Quitação de Equipamentos e Acessos",
      content: `# Termo de Quitação\n\nDeclaro, para os devidos fins, que devolvi (ou me comprometo a devolver) todos os equipamentos e acessos corporativos recebidos durante o vínculo com a **Acme Corp**, incluindo notebook, crachá e credenciais de sistemas internos.\n\nA não devolução dos itens listados poderá acarretar desconto no valor equivalente na rescisão, conforme previsto em contrato.`,
      status: "PENDING",
    },
  });

  await prisma.fiscalDocument.create({
    data: {
      offboardingSessionId: rafael.id,
      type: "INCOME_REPORT",
      title: "Informe de Rendimentos 2025",
      year: 2025,
      fileName: "informe-rendimentos-2025.pdf",
      mimeType: "application/pdf",
      content: Buffer.from(
        "Documento de demonstração — Informe de Rendimentos 2025 (WSync seed data)."
      ),
    },
  });

  await prisma.hRRequest.create({
    data: {
      offboardingSessionId: rafael.id,
      type: "RECOMMENDATION_LETTER",
      message: "Poderiam emitir uma carta de recomendação para o meu novo processo seletivo?",
      status: "OPEN",
    },
  });

  // --- Session 2: AI capture still pending, valid interview link ----
  const marina = await prisma.offboardingSession.create({
    data: {
      employeeName: "Marina Costa",
      email: "marina.costa@acme.com",
      role: "Gerente de Produto",
      department: "Produto",
      exitDate: new Date("2026-09-05"),
      status: "AI_CAPTURE",
      assets: {
        create: [{ type: "NOTEBOOK", serialNumber: "DELL-2022-0044", status: "PENDING_RETURN" }],
      },
      accessRevocations: {
        create: [
          { provider: "GOOGLE_WORKSPACE", revoked: false },
          { provider: "SLACK", revoked: false },
        ],
      },
    },
  });

  const marinaToken = await prisma.interviewToken.create({
    data: {
      offboardingSessionId: marina.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
    },
  });

  await prisma.pendingTask.create({
    data: {
      offboardingSessionId: marina.id,
      title: `Aguardando entrevista de saída — ${marina.employeeName}`,
      description: "Link de entrevista enviado, aguardando resposta do colaborador.",
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        offboardingSessionId: rafael.id,
        actor: "RH — Camila Duarte",
        action: "view_sensitive_data",
        targetLabel: rafael.employeeName,
        ipAddress: "187.45.12.90",
        details: "Visualizou dados do colaborador na sessão de offboarding.",
      },
      {
        offboardingSessionId: rafael.id,
        actor: "sistema",
        action: "resend_signature_request",
        targetLabel: "Aviso Prévio Indenizado",
        ipAddress: "10.0.0.4",
        details: `Link de assinatura reenviado para ${rafael.email}.`,
      },
      {
        offboardingSessionId: marina.id,
        actor: "sistema",
        action: "interview_link_generated",
        targetLabel: marina.employeeName,
        ipAddress: "10.0.0.4",
        details: "Link de entrevista de saída gerado e enviado por e-mail.",
      },
    ],
  });

  console.log("\nSeed concluído.");
  console.log(`Link de entrevista pendente (Marina Costa): /interview/${marinaToken.token}`);
  console.log(`Portal do ex-colaborador (Rafael Almeida): /ex-portal/${rafaelPortal.accessToken}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
