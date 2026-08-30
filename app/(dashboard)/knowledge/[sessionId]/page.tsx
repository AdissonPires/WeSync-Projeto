import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { KnowledgeEditor } from "@/components/knowledge/knowledge-editor";

export const dynamic = "force-dynamic";

export default async function KnowledgeDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  const doc = await prisma.knowledgeDocument.findUnique({
    where: { offboardingSessionId: sessionId },
    include: { offboardingSession: true },
  });

  if (!doc) notFound();

  return <KnowledgeEditor document={doc} />;
}
