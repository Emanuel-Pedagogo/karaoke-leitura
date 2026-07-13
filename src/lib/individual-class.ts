import { prisma } from "@/lib/prisma";
import { generateUniqueClassCode } from "@/lib/access-code";

const INDIVIDUAL_SCHOOL_NAME = "Contas individuais";

async function getOrCreateIndividualSchool() {
  const existing = await prisma.school.findFirst({
    where: { name: INDIVIDUAL_SCHOOL_NAME },
  });
  if (existing) return existing;

  return prisma.school.create({
    data: { name: INDIVIDUAL_SCHOOL_NAME },
  });
}

/** Remove o aluno da turma atual, movendo-o para uma turma individual. */
export async function moveStudentToIndividualClass(
  studentId: string,
  studentName: string,
) {
  const school = await getOrCreateIndividualSchool();
  const accessCode = await generateUniqueClassCode();
  const className = `Leitura — ${studentName.split(" ")[0]}`;

  const individualClass = await prisma.class.create({
    data: {
      name: className,
      schoolId: school.id,
      accessCode,
    },
  });

  await prisma.$transaction([
    prisma.classJoinRequest.deleteMany({
      where: { studentId, status: "PENDING" },
    }),
    prisma.studentProfile.update({
      where: { id: studentId },
      data: { classId: individualClass.id },
    }),
  ]);

  return individualClass;
}
