import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTeacherSession } from "@/lib/auth-guard";
import {
  getMonthlyEvolution,
  getWeeklyEvolution,
} from "@/lib/pedagogy";
import { EvolutionChart } from "@/components/evolution-chart";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function EvolucaoPage() {
  await requireTeacherSession();

  const turma = await prisma.class.findFirst({
    include: { school: true, students: { include: { user: true } } },
  });

  if (!turma) {
    return <p className="text-muted">Nenhuma turma encontrada.</p>;
  }

  const [weekly, monthly] = await Promise.all([
    getWeeklyEvolution(turma.id, 8),
    getMonthlyEvolution(turma.id, 6),
  ]);

  return (
    <article className="space-y-8">
      <header>
        <Link href="/professor" className="text-sm text-primary hover:underline">
          ← Dashboard
        </Link>
        <h1 className="text-3xl font-bold mt-1">Evolução da turma</h1>
        <p className="text-muted text-sm">
          {turma.school.name} · {turma.name}
        </p>
      </header>

      <section className="grid md:grid-cols-2 gap-6">
        <Card>
          <EvolutionChart
            title="Leituras por semana (turma)"
            data={weekly}
            metric="readings"
          />
        </Card>
        <Card>
          <EvolutionChart
            title="Precisão média semanal (%)"
            data={weekly}
            metric="avgAccuracy"
            unit="%"
          />
        </Card>
        <Card>
          <EvolutionChart
            title="WCPM médio semanal"
            data={weekly}
            metric="avgWcpm"
          />
        </Card>
        <Card>
          <EvolutionChart
            title="Leituras por mês (turma)"
            data={monthly}
            metric="readings"
          />
        </Card>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Evolução por aluno</h2>
        <ul className="grid sm:grid-cols-2 gap-2">
          {turma.students.map((s) => (
            <li key={s.id}>
              <Link
                href={`/professor/aluno/${s.id}`}
                className="block rounded-lg border border-foreground/10 px-4 py-3 hover:border-primary"
              >
                {s.user.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
