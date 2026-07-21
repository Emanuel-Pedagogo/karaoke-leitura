import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import { getSessionFromRequest } from "@/lib/auth";
import { evaluateReadingWithGemini } from "@/lib/gemini";
import { studentHasVoiceConsent } from "@/lib/voice-consent";
import { prisma } from "@/lib/prisma";
import { recordUsageEvent, UsageEventType } from "@/lib/usage-events";

export async function OPTIONS() {
  return optionsWithCors();
}

export async function POST(request: Request) {
  let session: Awaited<ReturnType<typeof getSessionFromRequest>> = null;
  let evaluatedTextId: string | null = null;
  try {
    // 1. Validar Autenticação
    session = await getSessionFromRequest(request);
    if (!session?.studentId) {
      return jsonWithCors({ error: "Não autorizado" }, { status: 401 });
    }

    const studentId = session.studentId;

    // 2. Validar Consentimento de Voz (LGPD)
    const allowVoice = await studentHasVoiceConsent(studentId);
    if (!allowVoice) {
      return jsonWithCors(
        { error: "O aluno não possui consentimento para gravação de voz." },
        { status: 403 }
      );
    }

    // 3. Receber o arquivo de áudio (FormData)
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    const textId = formData.get("textId") as string | null;
    evaluatedTextId = textId;

    if (!audioFile || !textId) {
      return jsonWithCors(
        { error: "Áudio e textId são obrigatórios." },
        { status: 400 }
      );
    }

    if (audioFile.size > 8 * 1024 * 1024) {
      return jsonWithCors(
        { error: "Áudio muito grande. Grave leituras de até alguns minutos." },
        { status: 413 },
      );
    }

    // 4. Buscar o texto de referência no banco de dados
    const readingText = await prisma.readingText.findUnique({
      where: { id: textId },
    });

    if (!readingText) {
      return jsonWithCors({ error: "Texto não encontrado." }, { status: 404 });
    }

    // 5. Converter o File para Buffer e enviar para o Gemini
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = audioFile.type || "audio/m4a";

    const evaluation = await evaluateReadingWithGemini(
      buffer,
      mimeType,
      readingText.content
    );

    await recordUsageEvent({
      request,
      session,
      type: UsageEventType.AI_EVALUATION_OK,
      metadata: { textId, audioBytes: audioFile.size, mimeType },
    });

    // 6. Retornar os resultados da avaliação
    return jsonWithCors({
      success: true,
      evaluation,
    });
  } catch (e) {
    console.error("Erro na API de avaliação com IA:", e);
    const message =
      e instanceof Error ? e.message : "Erro ao processar o áudio com a IA.";
    await recordUsageEvent({
      request,
      session,
      type: UsageEventType.AI_EVALUATION_FAILED,
      metadata: { textId: evaluatedTextId, message: message.slice(0, 300) },
    });
    return jsonWithCors({ error: message }, { status: 500 });
  }
}
