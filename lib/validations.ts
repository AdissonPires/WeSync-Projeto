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
    "FIGMA",
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

export const hrRequestSchema = z.object({
  accessToken: z.string().min(1),
  type: z.enum(["RECOMMENDATION_LETTER", "GENERAL_QUESTION"]),
  message: z.string().min(5, "Descreva sua solicitação com mais detalhes"),
});
export type HRRequestInput = z.infer<typeof hrRequestSchema>;

export const signLegalTermSchema = z.object({
  accessToken: z.string().min(1),
  legalTermId: z.string().min(1),
  signerName: z.string().min(2, "Informe seu nome completo para assinar"),
  consent: z
    .boolean()
    .refine((v) => v === true, "Você precisa confirmar que leu e concorda com o termo"),
});
export type SignLegalTermInput = z.infer<typeof signLegalTermSchema>;

export const rejectLegalTermSchema = z.object({
  accessToken: z.string().min(1),
  legalTermId: z.string().min(1),
  reason: z.string().min(5, "Explique o motivo da rejeição"),
});

export const resolveHRRequestSchema = z.object({
  id: z.string().min(1),
});
