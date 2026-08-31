import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { photoId } = await params;

  const photo = await prisma.assetPhoto.findFirst({
    where: { id: photoId, asset: { offboardingSession: { orgId: user.orgId } } },
  });
  if (!photo) {
    return NextResponse.json({ error: "Foto não encontrada." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(photo.imageData), {
    headers: {
      "Content-Type": photo.mimeType,
      "Content-Disposition": `inline; filename="${photo.fileName}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
