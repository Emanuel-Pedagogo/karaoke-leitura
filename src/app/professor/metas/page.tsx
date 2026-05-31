import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTeacherSession } from "@/lib/auth-guard";
import { getClassGoalProgress } from "@/lib/pedagogy";
import { ClassGoalForm } from "@/components/class-goal-form";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function MetasPage() {
  await requireTeacherSession();

  const turma = await prisma.class.findFirst({
    include: { school: true, goal: true },
  });

  if (!turma) {
    return <p className="text-muted">Nenhuma turma encontrada.</p>;
  }

  const progress = await getClassGoalProgress(turma.id);

  return (
    <article className="space-y-8">
      <header>
        <Link href="/professor" className="text-sm text-primary hover:underline">
          ← Dashboard
        </Link>
        <h1 className="text-3xl font-bold mt-1">Metas pedagógicas</h1>
        <p className="text-muted text-sm">
          {turma.school.name} · {turma.name}
        </p>
      </header>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card>
          <h2 className="font-bold mb-4">Definir meta da turma</h2>
          <ClassGoalForm
            classId={turma.id}
            initial={
              turma.goal
                ? {
                    title: turma.goal.title,
                    targetWeeklyReadings: turma.goal.targetWeeklyReadings,
                    minAccuracyPct: turma.goal.minAccuracyPct,
                    minWcpm: turma.goal.minWcpm,
                  }
                : undefined
            }
          />
        </Card>

        <Card>
          <h2 className="font-bold mb-4">Progresso esta semana</h2>
          {progress.goal ? (
            <ul className="space-y-3 text-sm">
              <li>
                <strong>{progress.goal.title}</strong>
              </li>
              <li>
                Meta: {progress.goal.targetWeeklyReadings} leitura(s) por aluno
                / semana
              </li>
              {progress.goal.minAccuracyPct != null && (
                <li>Precisão mínima: {progress.goal.minAccuracyPct}%</li>
              )}
              <li>
                Alunos no ritmo: {progress.onTrack}/{progress.studentCount} (
                {progress.percent}%)
              </li>
              <li>Leituras na turma esta semana: {progress.totalWeeklyReadings}</li>
              <li className="mt-2 h-3 bg-foreground/10 rounded-full overflow-hidden">
                <span
                  className="block h-full bg-primary rounded-full"
                  style={{ width: `${progress.percent}%` }}
                />
              </li>
            </ul>
          ) : (
            <p className="text-muted text-sm">
              Salve uma meta para acompanhar o progresso da turma.
            </p>
          )}
        </Card>
      </div>
    </article>
  );
}
