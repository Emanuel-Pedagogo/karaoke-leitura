import Link from "next/link";
import { requireTeacherSession } from "@/lib/auth-guard";
import {
  getClassGoalProgress,
  getParticipationAlerts,
} from "@/lib/pedagogy";
import { getTeacherClassDashboard } from "@/lib/teacher-class";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ProfessorDashboardPage() {
  const session = await requireTeacherSession();

  const turma = await getTeacherClassDashboard(session.userId);

  const students = turma?.students ?? [];
  const classId = turma?.id ?? "";

  const [goalProgress, alerts] = classId
    ? await Promise.all([
        getClassGoalProgress(classId),
        getParticipationAlerts(classId),
      ])
    : [null, []];

  const ranking = [...students]
    .map((s) => ({
      id: s.id,
      name: s.user.name,
      xp: s.xp,
      level: s.level,
      readings: s.sessions.length,
      avgAccuracy:
        s.sessions.length > 0
          ? s.sessions.reduce((a, x) => a + (x.accuracyPct ?? 0), 0) /
            s.sessions.length
          : 0,
      avgWcpm:
        s.sessions.length > 0
          ? s.sessions.reduce((a, x) => a + (x.wcpm ?? 0), 0) / s.sessions.length
          : 0,
    }))
    .sort((a, b) => b.xp - a.xp);

  return (
    <article className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard da turma</h1>
          <p className="text-muted">
            {turma?.school.name} · {turma?.name ?? "—"}
          </p>
          {turma?.accessCode ? (
            <p className="text-sm mt-2">
              Código da turma para alunos:{" "}
              <strong className="text-primary">{turma.accessCode}</strong>
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/professor/alunos"
            className="px-4 py-2 rounded-lg border border-primary text-primary hover:bg-primary/10 text-sm"
          >
            Alunos/Convites
          </Link>
          <Link
            href="/professor/metas"
            className="px-4 py-2 rounded-lg border border-primary text-primary hover:bg-primary/10 text-sm"
          >
            Metas
          </Link>
          <Link
            href="/professor/evolucao"
            className="px-4 py-2 rounded-lg border border-primary text-primary hover:bg-primary/10 text-sm"
          >
            Evolução
          </Link>
          <Link
            href="/professor/textos"
            className="px-4 py-2 rounded-lg border border-primary text-primary hover:bg-primary/10 text-sm"
          >
            Textos
          </Link>
          <Link
            href="/professor/missoes"
            className="px-4 py-2 rounded-lg border border-primary text-primary hover:bg-primary/10 text-sm"
          >
            Missões
          </Link>
          <Link
            href="/professor/relatorio"
            className="px-4 py-2 rounded-lg border border-primary text-primary hover:bg-primary/10 text-sm"
          >
            Relatório
          </Link>
          <Link
            href="/professor/conta"
            className="px-4 py-2 rounded-lg border border-foreground/20 text-sm hover:bg-foreground/5"
          >
            Minha conta
          </Link>
        </div>
      </header>

      <section className="grid sm:grid-cols-4 gap-4">
        <Card className="!p-4 text-center">
          <p className="text-xs text-muted uppercase">Alunos</p>
          <p className="text-3xl font-bold">{students.length}</p>
        </Card>
        <Card className="!p-4 text-center">
          <p className="text-xs text-muted uppercase">Leituras (total)</p>
          <p className="text-3xl font-bold">
            {students.reduce((n, s) => n + s.sessions.length, 0)}
          </p>
        </Card>
        <Card className="!p-4 text-center">
          <p className="text-xs text-muted uppercase">Meta semanal</p>
          <p className="text-3xl font-bold text-primary">
            {goalProgress?.percent ?? 0}%
          </p>
          <p className="text-xs text-muted mt-1">alunos no ritmo</p>
        </Card>
        <Card className="!p-4 text-center">
          <p className="text-xs text-muted uppercase">Alertas</p>
          <p className="text-3xl font-bold text-accent">{alerts.length}</p>
        </Card>
      </section>

      <Card className="border-foreground/20 text-sm">
        <h2 className="font-semibold mb-2">🔒 LGPD — papel da escola</h2>
        <p className="text-muted">
          A instituição é a <strong>controladora</strong> dos dados dos alunos.
          Obtenha autorização dos responsáveis, mantenha a{" "}
          <a href="/privacidade" className="text-primary underline" target="_blank">
            política de privacidade
          </a>{" "}
          disponível e oriente o uso opcional do microfone.
        </p>
      </Card>

      {goalProgress?.goal && (
        <Card className="border-primary/20 bg-primary/5">
          <h2 className="font-semibold mb-2">{goalProgress.goal.title}</h2>
          <p className="text-sm text-muted">
            {goalProgress.onTrack}/{goalProgress.studentCount} alunos com{" "}
            {goalProgress.goal.targetWeeklyReadings}+ leituras esta semana ·{" "}
            <Link href="/professor/metas" className="text-primary hover:underline">
              Editar meta
            </Link>
          </p>
        </Card>
      )}

      {alerts.length > 0 && (
        <Card className="border-accent/40 bg-accent/5">
          <h2 className="font-semibold mb-2">⚠️ Alertas de participação</h2>
          <ul className="space-y-2 text-sm">
            {alerts.map((a) => (
              <li key={`${a.studentId}-${a.type}`} className="flex flex-wrap gap-2 justify-between">
                <Link
                  href={`/professor/aluno/${a.studentId}`}
                  className="font-medium text-primary hover:underline"
                >
                  {a.studentName}
                </Link>
                <span className="text-muted">{a.message}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <section>
        <h2 className="text-xl font-bold mb-4">Ranking da turma</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-foreground/10 text-left text-muted">
                <th className="py-2 pr-4">#</th>
                <th className="py-2 pr-4">Aluno</th>
                <th className="py-2 pr-4">Nível</th>
                <th className="py-2 pr-4">XP</th>
                <th className="py-2 pr-4">Leituras</th>
                <th className="py-2 pr-4">Precisão média</th>
                <th className="py-2">Palavras/min (média)</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((s, i) => (
                <tr key={s.id} className="border-b border-foreground/5">
                  <td className="py-3 pr-4">{i + 1}</td>
                  <td className="py-3 pr-4">
                    <Link
                      href={`/professor/aluno/${s.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {s.name}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">{s.level}</td>
                  <td className="py-3 pr-4">{s.xp}</td>
                  <td className="py-3 pr-4">{s.readings}</td>
                  <td className="py-3 pr-4">
                    {s.readings ? `${s.avgAccuracy.toFixed(1)}%` : "—"}
                  </td>
                  <td className="py-3">
                    {s.readings ? s.avgWcpm.toFixed(1) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </article>
  );
}
