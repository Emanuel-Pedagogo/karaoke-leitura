import { startOfWeek } from "@karaoke/shared";
import { prisma } from "@/lib/prisma";

export type UnlockedAchievement = {
  slug: string;
  title: string;
  description: string;
  icon: string;
};

export type MissionUpdateResult = {
  missionId: string;
  title: string;
  completed: boolean;
  xpReward: number;
};

type AfterReadingInput = {
  studentId: string;
  classId: string;
  accuracyPct: number;
  wcpm: number;
  completedAt: Date;
};

function readingQualifies(accuracyPct: number, minAccuracy: number | null) {
  if (minAccuracy == null) return true;
  return accuracyPct >= minAccuracy;
}

export async function processAfterReading(input: AfterReadingInput) {
  const unlockedAchievements = await checkAchievements(input);
  const missionsCompleted = await updateMissionProgress(input);

  return { unlockedAchievements, missionsCompleted };
}

async function checkAchievements(input: AfterReadingInput) {
  const unlocked: UnlockedAchievement[] = [];
  const existing = await prisma.studentAchievement.findMany({
    where: { studentId: input.studentId },
    select: { achievement: { select: { slug: true } } },
  });
  const has = new Set(existing.map((e) => e.achievement.slug));

  const totalSessions = await prisma.readingSession.count({
    where: { studentId: input.studentId, completedAt: { not: null } },
  });

  const rules: Array<{
    slug: string;
    test: () => boolean;
  }> = [
    { slug: "primeira-leitura", test: () => totalSessions >= 1 },
    { slug: "fluente-10", test: () => input.wcpm >= 60 },
    { slug: "precisao-ouro", test: () => input.accuracyPct >= 100 },
  ];

  for (const rule of rules) {
    if (has.has(rule.slug) || !rule.test()) continue;
    const achievement = await prisma.achievement.findUnique({
      where: { slug: rule.slug },
    });
    if (!achievement) continue;

    await prisma.studentAchievement.create({
      data: {
        studentId: input.studentId,
        achievementId: achievement.id,
      },
    });

    unlocked.push({
      slug: achievement.slug,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
    });
  }

  return unlocked;
}

async function updateMissionProgress(input: AfterReadingInput) {
  const now = input.completedAt;

  const missions = await prisma.mission.findMany({
    where: {
      AND: [
        { OR: [{ classId: input.classId }, { classId: null }] },
        { activeFrom: { lte: now } },
        {
          OR: [{ activeUntil: null }, { activeUntil: { gte: now } }],
        },
      ],
    },
  });

  const completedMissions: MissionUpdateResult[] = [];

  for (const mission of missions) {
    if (
      !readingQualifies(input.accuracyPct, mission.minAccuracy)
    ) {
      continue;
    }

    const progress = await prisma.missionProgress.upsert({
      where: {
        missionId_studentId: {
          missionId: mission.id,
          studentId: input.studentId,
        },
      },
      create: {
        missionId: mission.id,
        studentId: input.studentId,
        completed: 0,
        done: false,
      },
      update: {},
    });

    if (progress.done) continue;

    const newCompleted = Math.min(
      mission.targetCount,
      progress.completed + 1,
    );

    const justFinished = newCompleted >= mission.targetCount && !progress.done;

    await prisma.missionProgress.update({
      where: { id: progress.id },
      data: {
        completed: newCompleted,
        done: justFinished,
      },
    });

    if (justFinished) {
      await prisma.studentProfile.update({
        where: { id: input.studentId },
        data: { xp: { increment: mission.xpReward } },
      });
      completedMissions.push({
        missionId: mission.id,
        title: mission.title,
        completed: true,
        xpReward: mission.xpReward,
      });
    }
  }

  return completedMissions;
}

export async function getWeeklyRanking(classId: string) {
  const weekStart = startOfWeek();

  const students = await prisma.studentProfile.findMany({
    where: { classId },
    include: {
      user: true,
      sessions: {
        where: { completedAt: { gte: weekStart } },
      },
    },
  });

  return students
    .map((s) => ({
      studentId: s.id,
      name: s.user.name,
      level: s.level,
      weeklyXp: s.sessions.reduce((sum, x) => sum + (x.xpEarned ?? 0), 0),
      weeklyReadings: s.sessions.length,
      weeklyScore: s.sessions.reduce((sum, x) => sum + (x.score ?? 0), 0),
    }))
    .sort((a, b) => b.weeklyXp - a.weeklyXp || b.weeklyScore - a.weeklyScore);
}
