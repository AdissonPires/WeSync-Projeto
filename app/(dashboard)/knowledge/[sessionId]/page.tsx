import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { KnowledgeEditor } from "@/components/knowledge/knowledge-editor";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function KnowledgeDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const doc = await prisma.knowledgeDocument.findFirst({
    where: { offboardingSessionId: sessionId, offboardingSession: { orgId: user.orgId } },
    include: { offboardingSession: true },
  });

  if (!doc) notFound();

  return <KnowledgeEditor document={doc} />;
}
