import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import { getSessionFromRequest } from "@/lib/auth";
import { evaluateReadingWithGemini } from "@/lib/gemini";
import { studentHasVoiceConsent } from "@/lib/voice-consent";
import { prisma } from "@/lib/prisma";

export async function OPTIONS() {
  return optionsWithCors();
}

export async function POST(request: Request) {
  try {
    // 1. Validar Autenticação
    const session = await getSessionFromRequest(request);
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

    if (!audioFile || !textId) {
      return jsonWithCors(
        { error: "Áudio e textId são obrigatórios." },
        { status: 400 }
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

    // 6. Retornar os resultados da avaliação
    return jsonWithCors({
      success: true,
      evaluation,
    });
  } catch (e) {
    console.error("Erro na API de avaliação com IA:", e);
    return jsonWithCors(
      { error: "Erro ao processar o áudio com a IA." },
      { status: 500 }
    );
  }
}
