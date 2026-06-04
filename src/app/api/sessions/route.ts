import {
  calculateSessionMetrics,
  comboMultiplierFromStreak,
  levelFromXp,
} from "@karaoke/shared";
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
      clientSessionId,
      durationSeconds,
      speedMultiplier,
      omissions,
      substitutions,
      hesitations,
      prosodyScore,
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

    const normalizedClientSessionId =
      typeof clientSessionId === "string" && clientSessionId.trim()
        ? clientSessionId.trim()
        : undefined;

    if (normalizedClientSessionId) {
      const existingSession = await prisma.readingSession.findUnique({
        where: { clientSessionId: normalizedClientSessionId },
      });

      if (existingSession) {
        if (existingSession.studentId !== studentId) {
          return jsonWithCors(
            { error: "Sessão de leitura pertence a outro aluno" },
            { status: 409 },
          );
        }

        const profile = await prisma.studentProfile.findUnique({
          where: { id: studentId },
          select: { comboStreak: true, level: true, xp: true },
        });

        return jsonWithCors({
          session: existingSession,
          comboStreak: profile?.comboStreak ?? 0,
          level: profile?.level ?? levelFromXp(profile?.xp ?? 0),
          leveledUp: false,
          duplicate: true,
          unlockedAchievements: [],
          missionsCompleted: [],
        });
      }
    }

    const [allowVoice, text, currentProfile] = await Promise.all([
      studentHasVoiceConsent(studentId),
      prisma.readingText.findUnique({
        where: { id: textId },
        select: { wordCount: true },
      }),
      prisma.studentProfile.findUnique({
        where: { id: studentId },
        select: { classId: true, comboStreak: true, level: true },
      }),
    ]);

    if (!text || !currentProfile) {
      return jsonWithCors({ error: "Dados inválidos" }, { status: 400 });
    }

    const duration = Math.max(1, Number(durationSeconds) || 1);
    const counts = {
      omissions: Math.max(0, Number(omissions) || 0),
      substitutions: Math.max(0, Number(substitutions) || 0),
      hesitations: Math.max(0, Number(hesitations) || 0),
    };
    const parsedProsodyScore = Number(prosodyScore);
    const normalizedProsodyScore = Number.isFinite(parsedProsodyScore)
      ? Math.round(parsedProsodyScore)
      : undefined;
    const parsedSpeedMultiplier = Number(speedMultiplier);
    const normalizedSpeedMultiplier = Number.isFinite(parsedSpeedMultiplier)
      ? parsedSpeedMultiplier
      : 1;
    const metrics = calculateSessionMetrics({
      wordCount: text.wordCount,
      durationSeconds: duration,
      ...counts,
      prosodyScore: normalizedProsodyScore,
      comboMultiplier: comboMultiplierFromStreak(currentProfile.comboStreak),
    });

    const readingSession = await prisma.readingSession.create({
      data: {
        studentId,
        clientSessionId: normalizedClientSessionId,
        textId,
        completedAt: new Date(),
        durationSeconds: duration,
        speedMultiplier: normalizedSpeedMultiplier,
        ...counts,
        prosodyScore: normalizedProsodyScore,
        accuracyPct: metrics.accuracyPct,
        wcpm: metrics.wcpm,
        score: metrics.score,
        xpEarned: metrics.xpEarned,
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
        xp: { increment: metrics.xpEarned },
        comboStreak:
          metrics.accuracyPct >= 90
            ? { increment: 1 }
            : { set: 0 },
      },
    });

    const leveledUp = levelFromXp(student.xp) !== currentProfile.level;
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
          accuracyPct: metrics.accuracyPct,
          wcpm: metrics.wcpm,
          completedAt: readingSession.completedAt ?? new Date(),
        })
      : { unlockedAchievements: [], missionsCompleted: [] };

    return jsonWithCors({
      session: readingSession,
      comboStreak: profile?.comboStreak ?? 0,
      level: leveledUp ? newLevel : student.level,
      leveledUp,
      duplicate: false,
      ...gamification,
    });
  } catch (e) {
    console.error(e);
    return jsonWithCors({ error: "Erro ao salvar sessão" }, { status: 500 });
  }
}
