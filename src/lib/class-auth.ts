import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export type AuthSession = NonNullable<
  Awaited<ReturnType<typeof getSessionFromRequest>>
>;

export async function canManageClass(
  session: AuthSession,
  classId: string,
): Promise<boolean> {
  if (session.role === "TEACHER") {
    if (!session.teacherId) return false;
    const ownedClass = await prisma.class.findFirst({
      where: { id: classId, teacherId: session.teacherId },
      select: { id: true },
    });
    return Boolean(ownedClass);
  }

  if (session.role === "COORDINATOR") {
    const coordinatedClass = await prisma.class.findFirst({
      where: {
        id: classId,
        school: {
          coordinators: {
            some: { userId: session.userId },
          },
        },
      },
      select: { id: true },
    });
    return Boolean(coordinatedClass);
  }

  return false;
}

export async function getStudentIfManageable(
  session: AuthSession,
  studentId: string,
) {
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      class: { select: { id: true, name: true } },
    },
  });

  if (!student) return null;
  if (!(await canManageClass(session, student.classId))) return null;
  return student;
}
