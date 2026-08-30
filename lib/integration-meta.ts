import type { IntegrationProvider } from "@prisma/client";

export interface ProviderField {
  key: string;
  label: string;
  placeholder: string;
  type?: "text" | "textarea" | "password";
}

export interface ProviderMeta {
  provider: IntegrationProvider;
  name: string;
  description: string;
  category: string;
  fields: ProviderField[];
}

export const PROVIDERS: ProviderMeta[] = [
  {
    provider: "GOOGLE_WORKSPACE",
    name: "Google Workspace",
    description: "Gerencie contas, e-mails e Drive dos colaboradores.",
    category: "Identidade",
    fields: [
      {
        key: "clientId",
        label: "OAuth Client ID",
        placeholder: "1234567890-abc.apps.googleusercontent.com",
      },
      {
        key: "serviceAccountJson",
        label: "Chave da Conta de Serviço (JSON)",
        placeholder: '{ "type": "service_account", ... }',
        type: "textarea",
      },
    ],
  },
  {
    provider: "MICROSOFT_ENTRA",
    name: "Microsoft Azure AD",
    description: "Sincronize identidades e revogue acessos do Entra ID.",
    category: "Identidade",
    fields: [
      { key: "tenantId", label: "Tenant ID", placeholder: "00000000-0000-0000-0000-000000000000" },
      { key: "clientId", label: "Client ID", placeholder: "00000000-0000-0000-0000-000000000000" },
      { key: "clientSecret", label: "Client Secret", placeholder: "••••••••••••", type: "password" },
    ],
  },
  {
    provider: "SLACK",
    name: "Slack",
    description: "Desative contas e transfira canais automaticamente.",
    category: "Comunicação",
    fields: [{ key: "apiToken", label: "Token de API", placeholder: "xoxb-...", type: "password" }],
  },
  {
    provider: "OKTA",
    name: "Okta",
    description: "Provisionamento e desprovisionamento centralizado de SSO.",
    category: "Identidade",
    fields: [
      { key: "orgUrl", label: "Org URL", placeholder: "https://sua-empresa.okta.com" },
      { key: "apiToken", label: "Token de API", placeholder: "••••••••••••", type: "password" },
    ],
  },
  {
    provider: "NOTION",
    name: "Notion",
    description: "Publique automaticamente os SOPs gerados pela IA.",
    category: "Base de Conhecimento",
    fields: [{ key: "apiToken", label: "Token de Integração", placeholder: "secret_...", type: "password" }],
  },
  {
    provider: "GITHUB",
    name: "GitHub",
    description: "Revogue acessos a repositórios e organizações.",
    category: "Desenvolvimento",
    fields: [
      { key: "webhookUrl", label: "Webhook URL", placeholder: "https://api.github.com/orgs/sua-org/hooks" },
      { key: "apiToken", label: "Token de API", placeholder: "ghp_...", type: "password" },
    ],
  },
  {
    provider: "FIGMA",
    name: "Figma",
    description: "Revogue acessos a arquivos e times do Figma.",
    category: "Design",
    fields: [{ key: "apiToken", label: "Token de API", placeholder: "figd_...", type: "password" }],
  },
];

export function getProviderMeta(provider: IntegrationProvider) {
  return PROVIDERS.find((p) => p.provider === provider)!;
}
