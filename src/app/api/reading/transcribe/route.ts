import { transcribeAudioBuffer, isServerAsrAvailable } from "@/lib/asr";
import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import { getSessionFromRequest } from "@/lib/auth";
import { validateAudioUploadSize } from "@/lib/audio-upload-limits";
import { studentHasVoiceConsent } from "@/lib/voice-consent";

export async function OPTIONS() {
  return optionsWithCors();
}

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.studentId) {
    return jsonWithCors({ error: "Não autorizado" }, { status: 401 });
  }

  if (!(await studentHasVoiceConsent(session.studentId))) {
    return jsonWithCors(
      { error: "Consentimento de voz necessário", code: "VOICE_CONSENT_REQUIRED" },
      { status: 403 },
    );
  }

  if (!isServerAsrAvailable()) {
    return jsonWithCors(
      {
        error: "ASR no servidor não configurado",
        hint: "Defina OPENAI_API_KEY no .env ou use o reconhecimento do navegador.",
        serverAsr: false,
      },
      { status: 503 },
    );
  }

  try {
    const form = await request.formData();
    const file = form.get("audio");
    if (!file || !(file instanceof Blob)) {
      return jsonWithCors({ error: "Arquivo de áudio obrigatório" }, { status: 400 });
    }

    const uploadError = validateAudioUploadSize(file);
    if (uploadError) {
      return jsonWithCors(uploadError, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const name =
      file instanceof File ? file.name : "recording.webm";
    const mime = file.type || "audio/webm";

    const result = await transcribeAudioBuffer(buffer, name, mime);
    if (!result) {
      return jsonWithCors({ error: "Falha na transcrição" }, { status: 502 });
    }

    return jsonWithCors({
      transcript: result.text,
      provider: result.provider,
    });
  } catch (error) {
    console.error(error);
    return jsonWithCors({ error: "Erro na transcrição" }, { status: 500 });
  }
}
