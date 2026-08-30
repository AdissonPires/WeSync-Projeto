export interface TemplateQuestion {
  id: string;
  label: string;
  placeholder: string;
}

export interface TemplateStep {
  title: string;
  description: string;
  questions: TemplateQuestion[];
}

/**
 * Template genérico usado quando o departamento do colaborador não tem um
 * questionário customizado cadastrado em /templates.
 */
export const DEFAULT_TEMPLATE_STEPS: TemplateStep[] = [
  {
    title: "Rotinas & Processos",
    description: "Descreva com o máximo de detalhe possível suas atividades recorrentes.",
    questions: [
      {
        id: "dailyRoutines",
        label: "Rotinas diárias",
        placeholder: "Ex: Todo dia às 9h eu reviso os tickets abertos e respondo o time no Slack…",
      },
      {
        id: "weeklyRoutines",
        label: "Rotinas semanais",
        placeholder: "Ex: Toda segunda-feira eu envio o relatório semanal para a diretoria…",
      },
      {
        id: "monthlyRoutines",
        label: "Rotinas mensais",
        placeholder: "Ex: No fechamento do mês eu concilio os relatórios financeiros…",
      },
    ],
  },
  {
    title: "Projetos & Pendências",
    description: "Liste o que está em andamento e o que precisa de atenção.",
    questions: [
      {
        id: "projectsPending",
        label: "Projetos em andamento e pendências",
        placeholder: "Ex: Projeto X está 80% concluído, falta apenas a aprovação final do cliente…",
      },
      {
        id: "fileLinks",
        label: "Links de arquivos relevantes",
        placeholder: "Ex: Planilha de controle: drive.google.com/… | Documentação: notion.so/…",
      },
      {
        id: "requiredAccess",
        label: "Acessos necessários para o sucessor",
        placeholder: "Ex: Acesso ao painel de administração do Google Ads, permissão de admin no GitHub…",
      },
    ],
  },
  {
    title: "Passagem de Bastão",
    description: "Ajude quem for assumir suas atividades a começar com o pé direito.",
    questions: [
      {
        id: "keyContacts",
        label: "Contatos-chave (internos e externos)",
        placeholder: "Ex: João (Financeiro) para aprovações de orçamento, Maria (cliente Acme)…",
      },
      {
        id: "successorNotes",
        label: "Recomendações para o sucessor",
        placeholder: "Ex: Recomendo começar revisando os processos em aberto antes de assumir novos projetos…",
      },
    ],
  },
];

export const DEFAULT_TEMPLATE_TITLE = "Questionário Padrão";

export function totalQuestions(steps: TemplateStep[]) {
  return steps.reduce((sum, step) => sum + step.questions.length, 0);
}
