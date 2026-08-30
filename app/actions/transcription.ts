"use server";

import { ok, fail, type ActionResult } from "@/lib/action-result";
import { transcribeAudio } from "@/lib/services/ai-transcription";

export async function transcribeAudioStep(formData: FormData): Promise<ActionResult<{ text: string }>> {
  try {
    const file = formData.get("audio");
    if (!(file instanceof File) || file.size === 0) {
      return fail("Nenhum áudio recebido.");
    }
    if (file.size > 20 * 1024 * 1024) {
      return fail("Áudio muito grande (máximo 20MB).");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await transcribeAudio(buffer, file.name || "gravacao.webm", file.type || "audio/webm");

    return ok({ text });
  } catch (error) {
    console.error(error);
    return fail("Não foi possível transcrever o áudio. Tente novamente.");
  }
}
