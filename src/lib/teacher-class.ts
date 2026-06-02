import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const baseInclude = { school: true } satisfies Prisma.ClassInclude;

const studentsInclude = {
  school: true,
  students: { include: { user: true } },
} satisfies Prisma.ClassInclude;

const dashboardInclude = {
  school: true,
  goal: true,
  students: {
    include: {
      user: true,
      sessions: {
        where: { completedAt: { not: null } },
        orderBy: { completedAt: "desc" as const },
      },
    },
  },
} satisfies Prisma.ClassInclude;

export type TeacherClassWithStudents = Prisma.ClassGetPayload<{
  include: typeof studentsInclude;
}>;

export type TeacherClassDashboard = Prisma.ClassGetPayload<{
  include: typeof dashboardInclude;
}>;

export async function getTeacherProfile(userId: string) {
  return prisma.teacherProfile.findUnique({
    where: { userId },
  });
}

async function findTeacherClass<I extends Prisma.ClassInclude>(
  userId: string,
  include: I,
) {
  const teacher = await getTeacherProfile(userId);
  if (!teacher) return null;
  return prisma.class.findFirst({
    where: { teacherId: teacher.id },
    include,
  });
}

export async function getTeacherClass(userId: string) {
  return findTeacherClass(userId, baseInclude);
}

export async function getTeacherClassWithStudents(userId: string) {
  return findTeacherClass(userId, studentsInclude);
}

export async function getTeacherClassDashboard(userId: string) {
  return findTeacherClass(userId, dashboardInclude);
}

export async function getTeacherClassWithGoal(userId: string) {
  return findTeacherClass(userId, {
    ...baseInclude,
    goal: true,
  });
}
