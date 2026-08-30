/**
 * Transcreve um áudio gravado no navegador usando a API Whisper da OpenAI.
 * Sem OPENAI_API_KEY configurada, retorna uma transcrição simulada para
 * manter o fluxo de gravação + transcrição testável ponta a ponta.
 */
export async function transcribeAudio(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  if (process.env.OPENAI_API_KEY) {
    return transcribeWithWhisper(buffer, filename, mimeType);
  }
  return mockTranscript(buffer.byteLength);
}

async function transcribeWithWhisper(buffer: Buffer, filename: string, mimeType: string) {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)], { type: mimeType }), filename);
  form.append("model", "whisper-1");
  form.append("language", "pt");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha na transcrição Whisper: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  if (typeof data.text !== "string") throw new Error("Resposta da Whisper sem texto.");
  return data.text as string;
}

function mockTranscript(byteLength: number) {
  const approxSeconds = Math.max(1, Math.round(byteLength / 16_000));
  return `[Transcrição simulada de ~${approxSeconds}s de áudio — configure OPENAI_API_KEY para transcrição real via Whisper.]`;
}
