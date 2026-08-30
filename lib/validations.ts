import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Informe sua senha"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  orgName: z.string().min(2, "Informe o nome da empresa"),
  name: z.string().min(2, "Informe seu nome completo"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "A senha precisa ter ao menos 8 caracteres"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

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
  answers: z.record(z.string(), z.string()),
  voiceTranscript: z.string().optional(),
});
export type ExitInterviewInput = z.infer<typeof exitInterviewSchema>;

const templateQuestionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1, "Informe o texto da pergunta"),
  placeholder: z.string().default(""),
});

const templateStepSchema = z.object({
  title: z.string().min(1, "Informe o título do passo"),
  description: z.string().default(""),
  questions: z.array(templateQuestionSchema).min(1, "Adicione ao menos uma pergunta"),
});

export const saveTemplateSchema = z.object({
  department: z.string().min(1, "Informe o departamento"),
  title: z.string().min(1, "Informe o título do questionário"),
  steps: z.array(templateStepSchema).min(1, "Adicione ao menos um passo"),
});
export type SaveTemplateInput = z.infer<typeof saveTemplateSchema>;

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
