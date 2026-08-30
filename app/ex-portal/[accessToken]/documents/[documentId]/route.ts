import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ accessToken: string; documentId: string }> }
) {
  const { accessToken, documentId } = await params;

  const access = await prisma.exPortalAccess.findUnique({ where: { accessToken } });
  if (!access || !access.active) {
    return NextResponse.json({ error: "Acesso inválido ou expirado." }, { status: 403 });
  }

  const document = await prisma.fiscalDocument.findFirst({
    where: { id: documentId, offboardingSessionId: access.offboardingSessionId },
  });
  if (!document) {
    return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(document.content), {
    headers: {
      "Content-Type": document.mimeType,
      "Content-Disposition": `attachment; filename="${document.fileName}"`,
    },
  });
}
