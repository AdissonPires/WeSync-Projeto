import { PrismaClient } from "@prisma/client";
import { generateExitReport } from "../lib/ai/generate-exit-report";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding WSync demo data…");

  await prisma.integrationLog.deleteMany();
  await prisma.integration.deleteMany();
  await prisma.accessRevocation.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.pendingTask.deleteMany();
  await prisma.knowledgeDocument.deleteMany();
  await prisma.exitInterviewResponse.deleteMany();
  await prisma.interviewToken.deleteMany();
  await prisma.offboardingSession.deleteMany();

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

  const rafaelResponses = {
    employeeName: rafael.employeeName,
    role: rafael.role,
    department: rafael.department,
    dailyRoutines: "Reviso PRs abertos, participo do daily do time, monitoro alertas do Sentry.",
    weeklyRoutines: "Toda sexta faço o deploy de produção e atualizo o changelog interno.",
    monthlyRoutines: "No fim do mês reviso métricas de performance da API com o time de dados.",
    projectsPending: "Migração do serviço de pagamentos está 70% concluída, falta o rollout gradual.",
    fileLinks: "Documentação técnica: notion.so/acme/pagamentos",
    requiredAccess: "Acesso admin ao GitHub da organização, chave de produção do Stripe.",
    keyContacts: "Camila (RH) para dúvidas de processo, time de Dados para métricas de API.",
    successorNotes: "Comece revisando os PRs em aberto antes de iniciar o rollout da migração.",
  };

  const rafaelMarkdown = await generateExitReport(rafaelResponses);

  await prisma.exitInterviewResponse.create({
    data: { offboardingSessionId: rafael.id, ...omit(rafaelResponses, ["employeeName", "role", "department"]) },
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

  console.log("\nSeed concluído.");
  console.log(`Link de entrevista pendente (Marina Costa): /interview/${marinaToken.token}`);
}

function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const clone = { ...obj };
  for (const key of keys) delete clone[key];
  return clone;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
