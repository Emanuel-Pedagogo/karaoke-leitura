import { xpProgressInLevel } from "@karaoke/shared";
import { prisma } from "@/lib/prisma";
import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import { getSessionFromRequest } from "@/lib/auth";

export async function OPTIONS() {
  return optionsWithCors();
}

export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.studentId) {
      return jsonWithCors({ error: "Não autorizado" }, { status: 401 });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { id: session.studentId },
      include: {
        user: true,
        class: true,
        sessions: {
          orderBy: { startedAt: "desc" },
          take: 5,
          include: { text: true },
        },
      },
    });

    if (!student) {
      return jsonWithCors({ student: null });
    }

    const progress = xpProgressInLevel(student.xp);

    return jsonWithCors({
      student: {
        id: student.id,
        name: student.user.name,
        className: student.class.name,
        xp: student.xp,
        level: student.level,
        comboStreak: student.comboStreak,
        xpProgress: progress,
        recentSessions: student.sessions.map((session) => ({
          id: session.id,
          textTitle: session.text.title,
          accuracyPct: session.accuracyPct,
          wcpm: session.wcpm,
          startedAt: session.startedAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error(error);
    return jsonWithCors({ error: "Erro ao buscar perfil do aluno" }, { status: 500 });
  }
}
