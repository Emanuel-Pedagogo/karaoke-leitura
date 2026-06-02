import { prisma } from "@/lib/prisma";

/** Remove sessões e vínculos do aluno antes de apagar o perfil. */
async function deleteStudentData(studentId: string) {
  await prisma.readingSession.deleteMany({ where: { studentId } });
  await prisma.studentAchievement.deleteMany({ where: { studentId } });
  await prisma.missionProgress.deleteMany({ where: { studentId } });
  await prisma.classJoinRequest.deleteMany({ where: { studentId } });
  await prisma.studentProfile.delete({ where: { id: studentId } });
}

/** Exclui conta e todos os dados pessoais vinculados (LGPD — direito de eliminação). */
export async function deleteUserAccount(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { student: true, teacher: true, coordinator: true },
  });

  if (!user) {
    return { deleted: false as const, reason: "not_found" as const };
  }

  await prisma.$transaction(async (tx) => {
    if (user.student) {
      const studentId = user.student.id;
      await tx.readingSession.deleteMany({ where: { studentId } });
      await tx.studentAchievement.deleteMany({ where: { studentId } });
      await tx.missionProgress.deleteMany({ where: { studentId } });
      await tx.classJoinRequest.deleteMany({ where: { studentId } });
      await tx.studentProfile.delete({ where: { id: studentId } });
    }

    if (user.teacher) {
      await tx.class.updateMany({
        where: { teacherId: user.teacher.id },
        data: { teacherId: null },
      });
      await tx.teacherProfile.delete({ where: { id: user.teacher.id } });
    }

    if (user.coordinator) {
      await tx.coordinatorProfile.delete({ where: { id: user.coordinator.id } });
    }

    await tx.user.delete({ where: { id: userId } });
  });

  return { deleted: true as const };
}

/** Remove todos os usuários (mantém escolas, turmas, textos, conquistas). */
export async function deleteAllUsers() {
  await prisma.$transaction([
    prisma.readingSession.deleteMany(),
    prisma.studentAchievement.deleteMany(),
    prisma.missionProgress.deleteMany(),
    prisma.classJoinRequest.deleteMany(),
    prisma.studentProfile.deleteMany(),
    prisma.class.updateMany({ data: { teacherId: null } }),
    prisma.teacherProfile.deleteMany(),
    prisma.coordinatorProfile.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}
