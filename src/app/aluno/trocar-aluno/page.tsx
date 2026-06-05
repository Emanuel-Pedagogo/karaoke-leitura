import { requireStudentSession } from "@/lib/auth-guard";
import { getClassCodeFromCookies } from "@/lib/class-session";
import { normalizeClassCode } from "@/lib/class-session-shared";
import { prisma } from "@/lib/prisma";
import { TrocarAlunoClient } from "./trocar-aluno-client";

export const dynamic = "force-dynamic";

export default async function TrocarAlunoPage() {
  const session = await requireStudentSession();
  const classCode = await getClassCodeFromCookies();

  if (!classCode) {
    return (
      <TrocarAlunoClient
        classCode={null}
        className=""
        students={[]}
        currentStudentId={session.studentId}
      />
    );
  }

  const turma = await prisma.class.findFirst({
    where: { accessCode: normalizeClassCode(classCode) },
    include: {
      students: {
        include: { user: true },
        orderBy: { user: { name: "asc" } },
      },
    },
  });

  const students =
    turma?.students.map((s) => ({
      id: s.id,
      name: s.user.name,
    })) ?? [];

  return (
    <TrocarAlunoClient
      classCode={classCode}
      className={turma?.name ?? ""}
      students={students}
      currentStudentId={session.studentId}
      initialError={
        turma
          ? null
          : "Não foi possível buscar alunos da turma. Verifique a conexão."
      }
    />
  );
}
