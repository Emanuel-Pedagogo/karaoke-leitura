import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTeacherSession } from "@/lib/auth-guard";
import { getSessionFromCookies } from "@/lib/auth";
import { getStudentIfManageable } from "@/lib/class-auth";
import { getStudentEvolution } from "@/lib/pedagogy";
import { EvolutionChart } from "@/components/evolution-chart";
import { RemoveStudentButton } from "@/components/remove-student-button";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AlunoDetalhePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  await requireTeacherSession();
  const session = await getSessionFromCookies();
  if (!session) notFound();

  const { studentId } = await params;
  const managed = await getStudentIfManageable(session, studentId);
  if (!managed) notFound();

  const data = await getStudentEvolution(studentId);
  if (!data) notFound();

  const { student, sessions, weekly, totalSessions } = data;

  return (
    <article className="space-y-8">
      <header>
        <Link
          href="/professor/alunos"
          className="text-sm text-primary hover:underline"
        >
          ← Alunos
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4 mt-1">
          <div>
            <h1 className="text-3xl font-bold">{student.user.name}</h1>
            <p className="text-muted text-sm">
              {student.class.name} · Nível {student.level} · {student.xp} XP
            </p>
            <p className="text-muted text-sm">{student.user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/professor/aluno/${studentId}/editar`}
              className="text-sm px-3 py-1 rounded border border-primary text-primary hover:bg-primary/10"
            >
              Editar
            </Link>
            <RemoveStudentButton
              studentId={studentId}
              studentName={student.user.name}
            />
          </div>
        </div>
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
                {s.wcpm != null ? `${s.wcpm} palavras/min` : "—"}
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
