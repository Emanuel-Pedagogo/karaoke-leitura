import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCoordinatorSession } from "@/lib/auth-guard";
import { getSchoolOverview } from "@/lib/pedagogy";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function CoordenadorPage() {
  const session = await requireCoordinatorSession();

  const coordinator = await prisma.coordinatorProfile.findFirst({
    where: { userId: session.userId },
    include: { school: true, user: true },
  });

  if (!coordinator) {
    return <p className="text-muted">Perfil de coordenador não encontrado.</p>;
  }

  const overview = await getSchoolOverview(coordinator.schoolId);

  if (!overview) {
    return <p className="text-muted">Escola não encontrada.</p>;
  }

  return (
    <article className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Visão da escola</h1>
        <p className="text-muted">
          {overview.schoolName} · {coordinator.user.name}
        </p>
      </header>

      <section className="grid sm:grid-cols-3 gap-4">
        <Card className="!p-4 text-center">
          <p className="text-xs text-muted uppercase">Turmas</p>
          <p className="text-3xl font-bold">{overview.classes.length}</p>
        </Card>
        <Card className="!p-4 text-center">
          <p className="text-xs text-muted uppercase">Alunos (total)</p>
          <p className="text-3xl font-bold">{overview.totalStudents}</p>
        </Card>
        <Card className="!p-4 text-center">
          <p className="text-xs text-muted uppercase">Leituras esta semana</p>
          <p className="text-3xl font-bold text-primary">
            {overview.totalReadingsWeek}
          </p>
        </Card>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Turmas</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-foreground/10 text-left text-muted">
                <th className="py-2 pr-4">Turma</th>
                <th className="py-2 pr-4">Série</th>
                <th className="py-2 pr-4">Alunos</th>
                <th className="py-2 pr-4">Leituras (semana)</th>
                <th className="py-2 pr-4">Meta semanal</th>
                <th className="py-2">Total leituras</th>
              </tr>
            </thead>
            <tbody>
              {overview.classes.map((c) => (
                <tr key={c.id} className="border-b border-foreground/5">
                  <td className="py-3 pr-4 font-medium">{c.name}</td>
                  <td className="py-3 pr-4">{c.grade ?? "—"}</td>
                  <td className="py-3 pr-4">{c.studentCount}</td>
                  <td className="py-3 pr-4">{c.readingsWeek}</td>
                  <td className="py-3 pr-4">
                    {c.goal
                      ? `${c.goal.targetWeeklyReadings}/aluno`
                      : "—"}
                  </td>
                  <td className="py-3">{c.totalReadings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {overview.classes.length === 0 && (
          <p className="text-muted text-sm mt-2">Nenhuma turma cadastrada.</p>
        )}
      </section>

      <p className="text-sm text-muted">
        Professores gerenciam turmas em{" "}
        <Link href="/professor" className="text-primary hover:underline">
          /professor
        </Link>
        . Coordenadores têm visão agregada de todas as turmas da escola.
      </p>
    </article>
  );
}
