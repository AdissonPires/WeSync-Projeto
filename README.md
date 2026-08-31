# WSync

Plataforma B2B de gestão inteligente de **offboarding** de colaboradores e **transferência de conhecimento via IA**, desenvolvida pela **wape solutions**.

O WSync acompanha o desligamento de um colaborador de ponta a ponta: coleta o conhecimento operacional dele através de uma entrevista guiada por IA, gera automaticamente um manual de processos (SOP) para o sucessor, controla a devolução de equipamentos e centraliza a revogação de acessos em sistemas de TI.

## Funcionalidades

- **Dashboard** com KPIs (desligamentos ativos, % de captura de conhecimento, revogações de TI pendentes), tabela de sessões e lista de tarefas pendentes.
- **Wizard de novo desligamento** em 3 passos (dados do colaborador, acessos a revogar, geração do link de entrevista).
- **Portal público do colaborador** (`/interview/[token]`) — sem login, validado por token — com um wizard de 4 passos para mapear rotinas, projetos, pendências e passagem de bastão.
- **Geração de relatório por IA**: ao final da entrevista, um manual de processos em Markdown é gerado automaticamente (via OpenAI `gpt-4o-mini`, com fallback determinístico caso nenhuma chave esteja configurada).
- **Base de Conhecimento**: visualização, edição, aprovação pelo gestor, exportação em PDF e cópia em Markdown dos manuais gerados.
- **Gestão de ativos físicos**: checklist de notebooks, monitores, periféricos e crachás por sessão, com status de devolução.
- **Logística reversa de ativos**: geração de código de postagem (Correios) ou agendamento de coleta na casa do colaborador remoto, por equipamento.
- **Checklist fotográfico de danos**: o time de TI anexa fotos da conferência, registra se há avaria (com valor de amortização opcional) e gera um protocolo em Markdown assinado digitalmente (nome, IP, data/hora) — a assinatura atualiza o status do ativo automaticamente.
- **Central de Integrações**: configuração de credenciais por provedor (Google Workspace, Microsoft Entra ID, Slack, GitHub, Okta, Notion, Figma), teste de conexão simulado e histórico de execuções.
- **Portal permanente do ex-colaborador** (`/ex-portal/[accessToken]`) — área self-service sem senha para baixar Informe de Rendimentos e holerites, assinar digitalmente (ou rejeitar, com justificativa) Aviso Prévio e Termo de Quitação, e abrir solicitações ao RH (carta de recomendação, dúvidas).
- **Módulo Jurídico** (`/legal`): status de assinatura de cada termo, reenvio de link de assinatura com 1 clique, upload de documentos fiscais (PDF) por colaborador e triagem das solicitações recebidas do portal.
- **Módulo de Compliance/LGPD** (`/compliance`): trilha de auditoria imutável (quem acessou o quê, quando e de qual IP) e ação de anonimização — direito ao esquecimento, substituindo nome/e-mail/CPF por um identificador anônimo e preservando apenas dados estatísticos.
- **Gravação de voz & transcrição** no portal de entrevista: nota de voz opcional em cada passo (Web MediaRecorder API), transcrita automaticamente via Whisper (`gpt-4o-mini`/`whisper-1`, com fallback mock) e combinada com as respostas digitadas no prompt do SOP.
- **Templates dinâmicos por departamento** (`/templates`): o RH edita o questionário da entrevista de saída por área (perguntas, placeholders, passos). O portal do colaborador carrega automaticamente o questionário do departamento correspondente, com um padrão genérico como fallback.
- **Analytics preditivo de turnover** (`/analytics`): consolida entrevistas de saída dos últimos 3/6/12 meses via IA para estimar causas-raiz, sentimento geral e recomendações estratégicas para o CHRO, com gráfico interativo (Recharts).
- Toasts, modais de confirmação para ações críticas (revogar acessos, cancelar processo, anonimizar dados) e skeletons de carregamento em toda a aplicação.
- **Autenticação & multi-tenancy** (NextAuth/Auth.js): login por e-mail/senha (bcrypt) e OAuth opcional (Google Workspace, Microsoft), cadastro de nova empresa (`/register`), RBAC por papel (`ADMIN`, `IT_ADMIN`, `HR_MANAGER`, `EMPLOYEE`) aplicado no middleware e nas Server Actions, e isolamento real de dados por organização (`orgId`) em todas as consultas.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 |
| UI | Componentes estilo shadcn sobre Radix Primitives, Lucide Icons, Sonner (toasts) |
| Dados | Prisma ORM + PostgreSQL (Supabase) |
| Autenticação | NextAuth (Auth.js) v5 — Credentials + Google/Microsoft OAuth, JWT sessions |
| Backend | Next.js Server Actions, validação com Zod |
| IA | OpenAI `gpt-4o-mini` (com fallback mock local) |
| Exportação | jsPDF + html2canvas (PDF gerado no navegador) |

## Como rodar

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

- `DATABASE_URL` / `DIRECT_URL` — connection string do Postgres (Supabase: Project Settings → Database).
- `OPENAI_API_KEY` — opcional. Sem essa chave, os relatórios de IA usam um gerador mock, mantendo o fluxo 100% funcional para demonstração.
- `NEXT_PUBLIC_APP_URL` — usado para montar os links de entrevista gerados.
- `AUTH_SECRET` — obrigatório. Gere com `openssl rand -base64 32`.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, `AZURE_AD_CLIENT_ID` / `AZURE_AD_CLIENT_SECRET` / `AZURE_AD_TENANT_ID` — opcionais. Sem essas credenciais, os botões de login social ficam ocultos e só o login por e-mail/senha fica disponível.

### 3. Preparar o banco de dados

O `prisma/schema.prisma` ativo aponta para PostgreSQL. As tabelas já existem no banco de referência do projeto; para aplicar o schema em um banco novo:

```bash
npx prisma generate
npx prisma db push
```

> Se `db push`/`migrate` falharem com `Can't reach database server` na porta `5432`, é porque a conexão direta do Supabase é IPv6-only em algumas redes. A aplicação em si não é afetada — ela usa o *connection pooler* (porta `6543`, variável `DATABASE_URL`).

### 4. Popular dados de demonstração (opcional)

```bash
npm run db:seed
```

Cria a organização "Acme Corp" e o login administrador de demonstração:
`admin@acme.com` / `admin123`.

### 5. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

> A gravação de voz (Web MediaRecorder API) exige um contexto seguro — funciona em
> `localhost` e em produção com HTTPS, mas não em HTTP puro — e permissão de microfone
> concedida pelo navegador.

## Testando localmente sem Postgres/OpenAI

Para uma simulação 100% local (sem depender de um banco remoto ou de uma chave de API), há uma variante SQLite do schema em `prisma/schema.sqlite.prisma`:

```bash
cp prisma/schema.sqlite.prisma prisma/schema.prisma
echo 'DATABASE_URL="file:./dev.db"' > .env.local
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Para voltar à configuração de produção, restaure `prisma/schema.postgres.prisma` como `prisma/schema.prisma` e reconfigure o `.env.local` com a connection string real.

## Estrutura do projeto

```
auth.ts / auth.config.ts  Configuração do NextAuth (a segunda, sem Prisma/bcrypt, Edge-safe p/ middleware)
middleware.ts             Bloqueio de rotas por autenticação + RBAC
app/
  (auth)/               Telas públicas de login e cadastro
  (dashboard)/          Rotas autenticadas do painel (dashboard, desligamentos, base de conhecimento,
                         templates, analytics, integrações, jurídico, compliance)
  interview/[token]/    Portal público da entrevista de saída (com gravação de voz)
  ex-portal/[token]/    Portal permanente do ex-colaborador (documentos, assinaturas, solicitações)
  access-denied/        Tela exibida quando um EMPLOYEE tenta acessar o painel
  api/assets/photos/[id] Serve as fotos da conferência (autenticado, escopado por organização)
  actions/               Server Actions (auth, offboarding, entrevista, conhecimento, integrações,
                          jurídico, compliance, ex-portal, templates, transcrição, analytics,
                          logística de ativos)
components/
  auth/                 Formulários de login/cadastro e botões OAuth
  ui/                   Componentes de UI reutilizáveis (estilo shadcn)
  dashboard/            Componentes específicos do painel de RH
  interview/            Wizard da entrevista pública + gravador de áudio
  knowledge/             Editor/visualizador do manual de conhecimento
  integrations/          Cards, modais e logs de integração
  ex-portal/             Abas do portal do ex-colaborador
  legal/                 Tabelas e formulários do módulo jurídico
  compliance/            Trilha de auditoria e anonimização LGPD
  templates/              Editor de questionários dinâmicos por departamento
  analytics/              Gráficos de analytics de turnover
lib/
  auth/                  Sessão atual (getSessionUser), papéis e config de provedores OAuth
  services/               Serviços de IA (transcrição Whisper, analytics de turnover)
  ai/                     Geração do manual de processos (SOP)
  interview-template.ts   Tipos e questionário padrão do template dinâmico
prisma/                  Schema (Postgres + variante SQLite), seed de demonstração
```

## Modelo de dados

`Organization` é o tenant raiz — todo usuário (`User`) e dado operacional pertence a uma organização (`orgId`), garantindo isolamento real entre empresas clientes. `User` segue o schema padrão do adapter do NextAuth (`Account`, `Session`, `VerificationToken`) mais `role` (`ADMIN`/`IT_ADMIN`/`HR_MANAGER`/`EMPLOYEE`) e `passwordHash` para login por credenciais.

`OffboardingSession` é a entidade operacional central, relacionada a `InterviewToken`, `ExitInterviewResponse`, `KnowledgeDocument`, `Asset[]`, `PendingTask[]`, `AccessRevocation[]`, `ExPortalAccess`, `FiscalDocument[]`, `LegalTerm[]`, `HRRequest[]` e `AuditLog[]`. Cada `Asset` pode ter dados de logística reversa (código de postagem ou coleta agendada), `AssetPhoto[]` (fotos da conferência) e um `AssetReturnProtocol` (protocolo de devolução assinado, que determina se o ativo foi recebido ou avariado). `ExitInterviewResponse` guarda um snapshot do template usado (`templateSnapshot`) e as respostas dinâmicas (`answers`, JSON por `questionId`), além da transcrição de voz consolidada. `InterviewTemplate` guarda o questionário customizado por departamento (único por `orgId` + `department`) — sem um registro, o questionário padrão em `lib/interview-template.ts` é usado automaticamente. Integrações e seus logs (`Integration`, `IntegrationLog`) são independentes por provedor e por organização. `AuditLog` nunca é editado ou apagado pela aplicação — é a trilha de auditoria imutável usada pelo módulo de Compliance.

`Asset` também carrega `orgId` diretamente (denormalizado a partir de `offboardingSession.orgId`) como camada extra de isolamento multi-tenant, além de índices compostos com `orgId` como coluna líder em `OffboardingSession`, `AuditLog` e nas colunas de status/data mais filtradas pelo dashboard — ver `prisma/schema.prisma` para o mapeamento completo de índices.

## Autenticação & RBAC

- **Rotas públicas**: `/login`, `/register`, `/interview/[token]`, `/ex-portal/[accessToken]`, `/api/auth/*`, `/access-denied`. Todo o resto exige sessão válida — o `middleware.ts` redireciona para `/login?callbackUrl=...` quando não autenticado.
- **Papéis**:
  | Papel | Acesso |
  |---|---|
  | `ADMIN` / `IT_ADMIN` | Total, incluindo `/integrations` e revogação de acessos |
  | `HR_MANAGER` | Dashboard, desligamentos, base de conhecimento, templates, analytics, jurídico, compliance — sem `/integrations` |
  | `EMPLOYEE` | Nenhum acesso ao painel — redirecionado para `/access-denied` |
- A checagem de papel acontece tanto no `middleware.ts` (bloqueio de rota) quanto dentro das Server Actions sensíveis (`lib/auth/session.ts` → `getSessionUser()`), como segunda camada de defesa.
- Login OAuth (Google/Microsoft) só é aceito para e-mails já cadastrados por um admin da organização — evita que uma conta externa qualquer entre automaticamente em um tenant.

## Build de produção

```bash
npm run build
npm run start
```



Este é um MVP funcional de ponta a ponta, mas ainda não está pronto para produção com dados reais de clientes.
