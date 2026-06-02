import Link from "next/link";
import { requireTeacherSession } from "@/lib/auth-guard";
import { getTeacherClassDashboard } from "@/lib/teacher-class";
import { ClassRequestsManager } from "@/components/class-requests-manager";

export const dynamic = "force-dynamic";

export default async function AlunosDashboardPage() {
  const session = await requireTeacherSession();
  const turma = await getTeacherClassDashboard(session.userId);

  if (!turma) {
    return (
      <article className="space-y-8">
        <h1 className="text-3xl font-bold">Turma não encontrada</h1>
      </article>
    );
  }

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
          Código da turma: <strong className="text-primary">{turma.accessCode}</strong>
        </p>
      </header>

      <ClassRequestsManager classId={turma.id} />
    </article>
  );
}
