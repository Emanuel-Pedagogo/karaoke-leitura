/**
 * Transcrição de áudio via OpenAI Whisper (opcional).
 * Defina OPENAI_API_KEY no .env para ativar no servidor.
 */
export async function transcribeAudioBuffer(
  buffer: Buffer,
  filename: string,
  mimeType: string,
): Promise<{ text: string; provider: "whisper" } | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const form = new FormData();
  const blob = new Blob([buffer], { type: mimeType });
  form.append("file", blob, filename);
  form.append("model", "whisper-1");
  form.append("language", "pt");

  const response = await fetch(
    "https://api.openai.com/v1/audio/transcriptions",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    },
  );

  if (!response.ok) {
    const err = await response.text();
    console.error("Whisper error:", err);
    return null;
  }

  const data = (await response.json()) as { text?: string };
  if (!data.text?.trim()) return null;

  return { text: data.text.trim(), provider: "whisper" };
}

export function isServerAsrAvailable() {
  return Boolean(process.env.OPENAI_API_KEY);
}
