import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTeacherSession } from "@/lib/auth-guard";
import { getStudentEvolution } from "@/lib/pedagogy";
import { EvolutionChart } from "@/components/evolution-chart";
import { Card } from "@/components/ui/card";

export default async function AlunoDetalhePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  await requireTeacherSession();
  const { studentId } = await params;
  const data = await getStudentEvolution(studentId);

  if (!data) notFound();

  const { student, sessions, weekly, totalSessions } = data;

  return (
    <article className="space-y-8">
      <header>
        <Link
          href="/professor/evolucao"
          className="text-sm text-primary hover:underline"
        >
          ← Evolução da turma
        </Link>
        <h1 className="text-3xl font-bold mt-1">{student.user.name}</h1>
        <p className="text-muted text-sm">
          {student.class.name} · Nível {student.level} · {student.xp} XP
        </p>
      </header>

      <section className="grid md:grid-cols-3 gap-4">
        <Card className="!p-4 text-center">
          <p className="text-xs text-muted uppercase">Leituras (total)</p>
          <p className="text-3xl font-bold">{totalSessions}</p>
        </Card>
        <Card className="!p-4 text-center">
          <p className="text-xs text-muted uppercase">Combo</p>
          <p className="text-3xl font-bold text-accent">{student.comboStreak}🔥</p>
        </Card>
        <Card className="!p-4 text-center">
          <p className="text-xs text-muted uppercase">Última leitura</p>
          <p className="text-lg font-bold">
            {sessions[0]?.completedAt
              ? new Date(sessions[0].completedAt!).toLocaleDateString("pt-BR")
              : "—"}
          </p>
        </Card>
      </section>

      <Card>
        <EvolutionChart
          title="Leituras por semana"
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

      <section>
        <h2 className="text-xl font-bold mb-4">Histórico recente</h2>
        <ul className="space-y-2 text-sm">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="flex justify-between border-b border-foreground/10 py-2"
            >
              <span>{s.text.title}</span>
              <span className="text-muted tabular-nums">
                {s.completedAt
                  ? new Date(s.completedAt).toLocaleDateString("pt-BR")
                  : "—"}{" "}
                · {s.accuracyPct != null ? `${s.accuracyPct}%` : "—"} ·{" "}
                {s.wcpm != null ? `${s.wcpm} WCPM` : "—"}
              </span>
            </li>
          ))}
          {sessions.length === 0 && (
            <p className="text-muted">Nenhuma leitura registrada.</p>
          )}
        </ul>
      </section>
    </article>
  );
}
