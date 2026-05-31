import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";

export async function OPTIONS() {
  return optionsWithCors();
}

/** Direito de apagar dados de voz (transcrições) — art. 18 LGPD */
export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.studentId) {
    return jsonWithCors({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const result = await prisma.readingSession.updateMany({
      where: { studentId: session.studentId },
      data: {
        spokenTranscript: null,
        asrSource: null,
      },
    });

    await prisma.studentProfile.update({
      where: { id: session.studentId },
      data: {
        voiceConsentAt: null,
        voiceConsentGuardian: false,
      },
    });

    return jsonWithCors({
      ok: true,
      sessionsUpdated: result.count,
      message:
        "Transcrições de voz apagadas. O histórico de leituras (métricas) foi mantido.",
    });
  } catch (e) {
    console.error(e);
    return jsonWithCors({ error: "Erro ao apagar dados" }, { status: 500 });
  }
}
