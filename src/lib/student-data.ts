import { prisma } from "@/lib/prisma";

export async function getActiveMissionsForStudent(
  studentId: string,
  classId: string,
) {
  const now = new Date();
  const missions = await prisma.mission.findMany({
    where: {
      AND: [
        { OR: [{ classId }, { classId: null }] },
        { activeFrom: { lte: now } },
        {
          OR: [{ activeUntil: null }, { activeUntil: { gte: now } }],
        },
      ],
    },
    include: {
      progress: { where: { studentId }, take: 1 },
    },
    orderBy: { activeFrom: "desc" },
  });

  return missions.map((m) => {
    const prog = m.progress[0];
    return {
      id: m.id,
      title: m.title,
      description: m.description,
      targetCount: m.targetCount,
      completed: prog?.completed ?? 0,
      done: prog?.done ?? false,
      xpReward: m.xpReward,
    };
  });
}

export async function getStudentAchievements(studentId: string) {
  const [all, unlocked] = await Promise.all([
    prisma.achievement.findMany({ orderBy: { title: "asc" } }),
    prisma.studentAchievement.findMany({
      where: { studentId },
      include: { achievement: true },
    }),
  ]);

  const unlockedIds = new Set(unlocked.map((u) => u.achievementId));

  return all.map((a) => ({
    ...a,
    unlocked: unlockedIds.has(a.id),
    unlockedAt: unlocked.find((u) => u.achievementId === a.id)?.unlockedAt,
  }));
}
