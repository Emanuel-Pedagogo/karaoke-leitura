import { startOfWeek } from "@karaoke/shared";
import { prisma } from "@/lib/prisma";

const MS_DAY = 24 * 60 * 60 * 1000;

export type ParticipationAlert = {
  type: "no_recent_reading" | "below_goal_readings" | "below_goal_accuracy" | "never_read";
  studentId: string;
  studentName: string;
  message: string;
};

export type PeriodPoint = {
  label: string;
  readings: number;
  avgAccuracy: number;
  avgWcpm: number;
};

function startOfMonth(date = new Date()) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getClassGoal(classId: string) {
  return prisma.classGoal.findUnique({ where: { classId } });
}

export async function getClassGoalProgress(classId: string) {
  const goal = await getClassGoal(classId);
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

  const totalWeeklyReadings = students.reduce(
    (n, s) => n + s.sessions.length,
    0,
  );
  const targetTotal = (goal?.targetWeeklyReadings ?? 0) * students.length;
  const onTrack = students.filter(
    (s) => s.sessions.length >= (goal?.targetWeeklyReadings ?? 0),
  ).length;

  return {
    goal,
    studentCount: students.length,
    totalWeeklyReadings,
    targetTotal,
    onTrack,
    percent:
      students.length > 0
        ? Math.round((onTrack / students.length) * 100)
        : 0,
  };
}

export async function getParticipationAlerts(
  classId: string,
): Promise<ParticipationAlert[]> {
  const goal = await getClassGoal(classId);
  const weekStart = startOfWeek();
  const sevenDaysAgo = new Date(Date.now() - 7 * MS_DAY);

  const students = await prisma.studentProfile.findMany({
    where: { classId },
    include: {
      user: true,
      sessions: {
        where: { completedAt: { not: null } },
        orderBy: { completedAt: "desc" },
      },
    },
  });

  const alerts: ParticipationAlert[] = [];

  for (const student of students) {
    const name = student.user.name;
    const recent = student.sessions.filter(
      (s) => s.completedAt && s.completedAt >= sevenDaysAgo,
    );
    const thisWeek = student.sessions.filter(
      (s) => s.completedAt && s.completedAt >= weekStart,
    );

    if (student.sessions.length === 0) {
      alerts.push({
        type: "never_read",
        studentId: student.id,
        studentName: name,
        message: "Nunca fez uma leitura registrada",
      });
      continue;
    }

    if (recent.length === 0) {
      alerts.push({
        type: "no_recent_reading",
        studentId: student.id,
        studentName: name,
        message: "Sem leituras nos últimos 7 dias",
      });
    }

    if (
      goal &&
      thisWeek.length < goal.targetWeeklyReadings
    ) {
      alerts.push({
        type: "below_goal_readings",
        studentId: student.id,
        studentName: name,
        message: `Abaixo da meta semanal (${thisWeek.length}/${goal.targetWeeklyReadings} leituras)`,
      });
    }

    if (goal?.minAccuracyPct != null && recent.length > 0) {
      const avg =
        recent.reduce((a, s) => a + (s.accuracyPct ?? 0), 0) / recent.length;
      if (avg < goal.minAccuracyPct) {
        alerts.push({
          type: "below_goal_accuracy",
          studentId: student.id,
          studentName: name,
          message: `Precisão média ${avg.toFixed(0)}% (meta ≥${goal.minAccuracyPct}%)`,
        });
      }
    }
  }

  return alerts;
}

export async function getWeeklyEvolution(
  classId: string,
  weeks = 8,
): Promise<PeriodPoint[]> {
  const sessions = await prisma.readingSession.findMany({
    where: {
      student: { classId },
      completedAt: { not: null },
    },
    select: {
      completedAt: true,
      accuracyPct: true,
      wcpm: true,
    },
  });

  const points: PeriodPoint[] = [];
  const now = new Date();

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = startOfWeek(new Date(now.getTime() - i * 7 * MS_DAY));
    const weekEnd = new Date(weekStart.getTime() + 7 * MS_DAY);
    const inWeek = sessions.filter(
      (s) =>
        s.completedAt &&
        s.completedAt >= weekStart &&
        s.completedAt < weekEnd,
    );
    const n = inWeek.length;
    points.push({
      label: weekStart.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      }),
      readings: n,
      avgAccuracy:
        n > 0
          ? Math.round(
              (inWeek.reduce((a, s) => a + (s.accuracyPct ?? 0), 0) / n) * 10,
            ) / 10
          : 0,
      avgWcpm:
        n > 0
          ? Math.round(
              (inWeek.reduce((a, s) => a + (s.wcpm ?? 0), 0) / n) * 10,
            ) / 10
          : 0,
    });
  }

  return points;
}

export async function getMonthlyEvolution(
  classId: string,
  months = 6,
): Promise<PeriodPoint[]> {
  const sessions = await prisma.readingSession.findMany({
    where: {
      student: { classId },
      completedAt: { not: null },
    },
    select: {
      completedAt: true,
      accuracyPct: true,
      wcpm: true,
    },
  });

  const points: PeriodPoint[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = startOfMonth(
      new Date(now.getFullYear(), now.getMonth() - i, 1),
    );
    const monthEnd = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth() + 1,
      1,
    );
    const inMonth = sessions.filter(
      (s) =>
        s.completedAt &&
        s.completedAt >= monthStart &&
        s.completedAt < monthEnd,
    );
    const n = inMonth.length;
    points.push({
      label: monthStart.toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      }),
      readings: n,
      avgAccuracy:
        n > 0
          ? Math.round(
              (inMonth.reduce((a, s) => a + (s.accuracyPct ?? 0), 0) / n) *
                10,
            ) / 10
          : 0,
      avgWcpm:
        n > 0
          ? Math.round(
              (inMonth.reduce((a, s) => a + (s.wcpm ?? 0), 0) / n) * 10,
            ) / 10
          : 0,
    });
  }

  return points;
}

export async function getStudentEvolution(studentId: string, weeks = 8) {
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: { user: true, class: true },
  });
  if (!student) return null;

  const sessions = await prisma.readingSession.findMany({
    where: { studentId, completedAt: { not: null } },
    orderBy: { completedAt: "asc" },
    include: { text: true },
  });

  const points: PeriodPoint[] = [];
  const now = new Date();

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = startOfWeek(new Date(now.getTime() - i * 7 * MS_DAY));
    const weekEnd = new Date(weekStart.getTime() + 7 * MS_DAY);
    const inWeek = sessions.filter(
      (s) =>
        s.completedAt &&
        s.completedAt >= weekStart &&
        s.completedAt < weekEnd,
    );
    const n = inWeek.length;
    points.push({
      label: weekStart.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      }),
      readings: n,
      avgAccuracy:
        n > 0
          ? Math.round(
              (inWeek.reduce((a, s) => a + (s.accuracyPct ?? 0), 0) / n) * 10,
            ) / 10
          : 0,
      avgWcpm:
        n > 0
          ? Math.round(
              (inWeek.reduce((a, s) => a + (s.wcpm ?? 0), 0) / n) * 10,
            ) / 10
          : 0,
    });
  }

  return {
    student,
    totalSessions: sessions.length,
    sessions: sessions.slice(-10).reverse(),
    weekly: points,
  };
}

export async function getSchoolOverview(schoolId: string) {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: {
      classes: {
        include: {
          goal: true,
          students: {
            include: {
              sessions: {
                where: { completedAt: { not: null } },
              },
            },
          },
        },
      },
    },
  });

  if (!school) return null;

  const weekStart = startOfWeek();

  const classes = school.classes.map((turma) => {
    const readingsWeek = turma.students.reduce(
      (n, s) =>
        n +
        s.sessions.filter(
          (x) => x.completedAt && x.completedAt >= weekStart,
        ).length,
      0,
    );
    const totalReadings = turma.students.reduce(
      (n, s) => n + s.sessions.length,
      0,
    );
    return {
      id: turma.id,
      name: turma.name,
      grade: turma.grade,
      studentCount: turma.students.length,
      readingsWeek,
      totalReadings,
      goal: turma.goal,
    };
  });

  return {
    schoolName: school.name,
    classes,
    totalStudents: classes.reduce((n, c) => n + c.studentCount, 0),
    totalReadingsWeek: classes.reduce((n, c) => n + c.readingsWeek, 0),
  };
}
