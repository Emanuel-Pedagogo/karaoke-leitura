import { levelFromXp } from "@karaoke/shared";
import { prisma } from "@/lib/prisma";
import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import { getSessionFromRequest } from "@/lib/auth";
import { processAfterReading } from "@/lib/gamification";
import { studentHasVoiceConsent } from "@/lib/voice-consent";

export async function OPTIONS() {
  return optionsWithCors();
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.studentId) {
      return jsonWithCors({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      studentId: bodyStudentId,
      textId,
      durationSeconds,
      speedMultiplier,
      omissions,
      substitutions,
      hesitations,
      prosodyScore,
      accuracyPct,
      wcpm,
      score,
      xpEarned,
      spokenTranscript,
      asrSource,
    } = body;

    const studentId = session.studentId;
    if (bodyStudentId && bodyStudentId !== studentId) {
      return jsonWithCors({ error: "Aluno inválido" }, { status: 403 });
    }

    if (!textId) {
      return jsonWithCors({ error: "Dados inválidos" }, { status: 400 });
    }

    const allowVoice = await studentHasVoiceConsent(studentId);

    const readingSession = await prisma.readingSession.create({
      data: {
        studentId,
        textId,
        completedAt: new Date(),
        durationSeconds,
        speedMultiplier: speedMultiplier ?? 1,
        omissions: omissions ?? 0,
        substitutions: substitutions ?? 0,
        hesitations: hesitations ?? 0,
        prosodyScore,
        accuracyPct,
        wcpm,
        score,
        xpEarned,
        spokenTranscript:
          allowVoice && spokenTranscript?.trim()
            ? spokenTranscript.trim()
            : null,
        asrSource: allowVoice ? asrSource ?? null : null,
      },
    });

    const student = await prisma.studentProfile.update({
      where: { id: studentId },
      data: {
        xp: { increment: xpEarned ?? 0 },
        comboStreak:
          (accuracyPct ?? 0) >= 90
            ? { increment: 1 }
            : { set: 0 },
      },
    });

    const leveledUp = levelFromXp(student.xp) !== student.level;
    const newLevel = levelFromXp(student.xp);
    if (leveledUp) {
      await prisma.studentProfile.update({
        where: { id: studentId },
        data: { level: newLevel },
      });
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      select: { classId: true, comboStreak: true, level: true, xp: true },
    });

    const gamification = profile
      ? await processAfterReading({
          studentId,
          classId: profile.classId,
          accuracyPct: accuracyPct ?? 0,
          wcpm: wcpm ?? 0,
          completedAt: readingSession.completedAt ?? new Date(),
        })
      : { unlockedAchievements: [], missionsCompleted: [] };

    return jsonWithCors({
      session: readingSession,
      comboStreak: profile?.comboStreak ?? 0,
      level: leveledUp ? newLevel : student.level,
      leveledUp,
      ...gamification,
    });
  } catch (e) {
    console.error(e);
    return jsonWithCors({ error: "Erro ao salvar sessão" }, { status: 500 });
  }
}
