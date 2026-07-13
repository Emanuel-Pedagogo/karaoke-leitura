import Link from "next/link";
import { requireTeacherSession } from "@/lib/auth-guard";
import { getTeacherClassWithStudents } from "@/lib/teacher-class";
import { ClassRequestsManager } from "@/components/class-requests-manager";
import { RemoveStudentButton } from "@/components/remove-student-button";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AlunosDashboardPage() {
  const session = await requireTeacherSession();
  const turma = await getTeacherClassWithStudents(session.userId);

  if (!turma) {
    return (
      <article className="space-y-8">
        <h1 className="text-3xl font-bold">Turma não encontrada</h1>
      </article>
    );
  }

  const students = [...turma.students].sort((a, b) =>
    a.user.name.localeCompare(b.user.name, "pt-BR"),
  );

  return (
    <article className="space-y-8 max-w-4xl">
      <header>
        <Link
          href="/professor"
          className="text-sm text-primary hover:underline"
        >
          ← Dashboard
        </Link>
        <h1 className="text-3xl font-bold mt-2">Gerenciar Alunos</h1>
        <p className="text-muted">
          {turma.school.name} · {turma.name}
        </p>
        <p className="text-sm mt-2">
          Código da turma:{" "}
          <strong className="text-primary">{turma.accessCode}</strong>
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">
          Alunos na turma ({students.length})
        </h2>
        {students.length > 0 ? (
          <ul className="space-y-3">
            {students.map((student) => (
              <li key={student.id}>
                <Card className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <Link
                      href={`/professor/aluno/${student.id}`}
                      className="font-semibold hover:text-primary"
                    >
                      {student.user.name}
                    </Link>
                    <p className="text-sm text-muted">{student.user.email}</p>
                    <p className="text-xs text-muted mt-1">
                      Nível {student.level} · {student.xp} XP
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/professor/aluno/${student.id}/editar`}
                      className="text-sm px-3 py-1 rounded border border-primary text-primary hover:bg-primary/10"
                    >
                      Editar
                    </Link>
                    <RemoveStudentButton
                      studentId={student.id}
                      studentName={student.user.name}
                    />
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted text-sm">
            Nenhum aluno matriculado ainda. Use convites ou o código da turma
            abaixo.
          </p>
        )}
      </section>

      <ClassRequestsManager classId={turma.id} />
    </article>
  );
}
