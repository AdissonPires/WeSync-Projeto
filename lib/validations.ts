import { z } from "zod";

export const createOffboardingSchema = z.object({
  employeeName: z.string().min(2, "Informe o nome completo"),
  email: z.string().email("E-mail inválido"),
  role: z.string().min(2, "Informe o cargo"),
  department: z.string().min(1, "Selecione o departamento"),
  exitDate: z.string().min(1, "Informe a data de saída"),
  accessToRevoke: z.array(z.string()).default([]),
});
export type CreateOffboardingInput = z.infer<typeof createOffboardingSchema>;

export const exitInterviewSchema = z.object({
  token: z.string().min(1),
  dailyRoutines: z.string().min(10, "Descreva suas rotinas diárias com mais detalhes"),
  weeklyRoutines: z.string().min(10, "Descreva suas rotinas semanais com mais detalhes"),
  monthlyRoutines: z.string().min(1, "Descreva suas rotinas mensais"),
  projectsPending: z.string().min(1, "Liste os projetos e pendências"),
  fileLinks: z.string().min(1, "Informe links de arquivos relevantes"),
  requiredAccess: z.string().min(1, "Informe os acessos necessários"),
  keyContacts: z.string().min(1, "Informe os contatos-chave"),
  successorNotes: z.string().min(1, "Deixe recomendações para o sucessor"),
});
export type ExitInterviewInput = z.infer<typeof exitInterviewSchema>;

export const integrationConfigSchema = z.object({
  provider: z.enum([
    "GOOGLE_WORKSPACE",
    "MICROSOFT_ENTRA",
    "SLACK",
    "GITHUB",
    "OKTA",
    "NOTION",
  ]),
  config: z.record(z.string(), z.string().min(1, "Campo obrigatório")),
});
export type IntegrationConfigInput = z.infer<typeof integrationConfigSchema>;

export const updateKnowledgeDocumentSchema = z.object({
  id: z.string().min(1),
  markdownContent: z.string().min(1),
});

export const addAssetSchema = z.object({
  offboardingSessionId: z.string().min(1),
  type: z.enum(["NOTEBOOK", "MONITOR", "PERIPHERAL", "BADGE"]),
  serialNumber: z.string().min(1, "Informe o número de série ou identificador"),
});
