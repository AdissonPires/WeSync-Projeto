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
- **Central de Integrações**: configuração de credenciais por provedor (Google Workspace, Microsoft Entra ID, Slack, GitHub, Okta, Notion, Figma), teste de conexão simulado e histórico de execuções.
- Toasts, modais de confirmação para ações críticas (revogar acessos, cancelar processo) e skeletons de carregamento em toda a aplicação.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 |
| UI | Componentes estilo shadcn sobre Radix Primitives, Lucide Icons, Sonner (toasts) |
| Dados | Prisma ORM + PostgreSQL (Supabase) |
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

### 5. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

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
app/
  (dashboard)/         Rotas autenticadas do painel (dashboard, desligamentos, base de conhecimento, integrações)
  interview/[token]/   Portal público da entrevista de saída
  actions/             Server Actions (offboarding, entrevista, conhecimento, integrações)
components/
  ui/                  Componentes de UI reutilizáveis (estilo shadcn)
  dashboard/           Componentes específicos do painel de RH
  interview/           Wizard da entrevista pública
  knowledge/           Editor/visualizador do manual de conhecimento
  integrations/        Cards, modais e logs de integração
lib/                   Prisma client, validações Zod, geração de relatório IA, helpers
prisma/                Schema (Postgres + variante SQLite), seed de demonstração
```

## Modelo de dados

`OffboardingSession` é a entidade central, relacionada a `InterviewToken`, `ExitInterviewResponse`, `KnowledgeDocument`, `Asset[]`, `PendingTask[]` e `AccessRevocation[]`. Integrações e seus logs (`Integration`, `IntegrationLog`) são independentes por provedor.

## Build de produção

```bash
npm run build
npm run start
```

## Roadmap sugerido

Este é um MVP funcional de ponta a ponta, mas ainda não está pronto para produção com dados reais de clientes. Antes disso, priorize:

1. Autenticação e controle de acesso multiusuário (RH Admin, TI, Gestor).
2. Multi-tenancy (isolamento de dados por empresa cliente).
3. Criptografia das credenciais de integração armazenadas.
4. Conformidade com LGPD (retenção de dados, direito ao esquecimento, auditoria).
5. Conectores reais para os provedores de TI (hoje simulados) e uma fila assíncrona para revogações e geração de relatórios.
