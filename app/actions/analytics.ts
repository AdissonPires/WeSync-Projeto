"use server";

import { prisma } from "@/lib/prisma";
import { analyzeTurnover, type TurnoverAnalysis, type TurnoverEntry } from "@/lib/services/ai-analytics";
import type { TemplateStep } from "@/lib/interview-template";

export async function getTurnoverAnalysis(periodMonths: 3 | 6 | 12): Promise<TurnoverAnalysis> {
  const since = new Date();
  since.setMonth(since.getMonth() - periodMonths);

  const sessions = await prisma.offboardingSession.findMany({
    where: {
      exitDate: { gte: since },
      anonymizedAt: null,
    },
    include: { interviewResponse: true, knowledgeDocument: true },
  });

  const entries: TurnoverEntry[] = sessions
    .filter((s) => s.interviewResponse)
    .map((s) => {
      const response = s.interviewResponse!;
      const steps = response.templateSnapshot as unknown as TemplateStep[];
      const answers = response.answers as unknown as Record<string, string>;
      const answersText = steps
        .flatMap((step) => step.questions.map((q) => `${q.label}: ${answers[q.id] ?? ""}`))
        .join("\n");

      return {
        department: s.department,
        role: s.role,
        answersText: response.voiceTranscript
          ? `${answersText}\n${response.voiceTranscript}`
          : answersText,
        knowledgeMarkdown: s.knowledgeDocument?.markdownContent,
      };
    });

  return analyzeTurnover(entries);
}
