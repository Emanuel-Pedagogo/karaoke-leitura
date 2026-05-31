import { alignReadingToText } from "@/lib/speech-alignment";
import { prisma } from "@/lib/prisma";
import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import { getSessionFromRequest } from "@/lib/auth";
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
      {
        error: "Consentimento de voz necessário",
        code: "VOICE_CONSENT_REQUIRED",
      },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const { textId, transcript, content } = body;

    if (!transcript?.trim()) {
      return jsonWithCors(
        { error: "Transcrição vazia" },
        { status: 400 },
      );
    }

    let expectedContent = content;
    if (textId) {
      const text = await prisma.readingText.findUnique({
        where: { id: textId },
      });
      if (!text) {
        return jsonWithCors({ error: "Texto não encontrado" }, { status: 404 });
      }
      expectedContent = text.content;
    }

    if (!expectedContent) {
      return jsonWithCors({ error: "Texto esperado obrigatório" }, { status: 400 });
    }

    const alignment = alignReadingToText(expectedContent, transcript);

    return jsonWithCors({
      alignment,
      transcript: transcript.trim(),
      disclaimer:
        "Sugestão automática — revise com o professor ou ajuste manualmente.",
    });
  } catch (error) {
    console.error(error);
    return jsonWithCors({ error: "Erro na análise" }, { status: 500 });
  }
}
