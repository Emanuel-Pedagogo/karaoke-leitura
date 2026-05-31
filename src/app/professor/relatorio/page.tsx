import Link from "next/link";
import { requireTeacherSession } from "@/lib/auth-guard";
import { getWeeklyRanking } from "@/lib/gamification";
import { prisma } from "@/lib/prisma";
import { PrintReportButton } from "@/components/print-report-button";
import { startOfWeek } from "@karaoke/shared";

export const dynamic = "force-dynamic";

export default async function RelatorioPage() {
  await requireTeacherSession();

  const turma = await prisma.class.findFirst({
    include: { school: true },
  });

  if (!turma) {
    return <p className="text-muted">Nenhuma turma encontrada.</p>;
  }

  const ranking = await getWeeklyRanking(turma.id);
  const students = await prisma.studentProfile.findMany({
    where: { classId: turma.id },
    include: {
      user: true,
      sessions: {
        where: { completedAt: { not: null } },
        orderBy: { completedAt: "desc" },
      },
    },
  });

  const weekStart = startOfWeek();
  const generatedAt = new Date().toLocaleString("pt-BR");

  return (
    <article className="space-y-6 print:space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div>
          <Link
            href="/professor"
            className="text-sm text-primary hover:underline"
          >
            ← Dashboard
          </Link>
          <h1 className="text-3xl font-bold mt-1">Relatório da turma</h1>
        </div>
        <PrintReportButton />
      </header>

      <section id="relatorio-print" className="space-y-6 text-sm">
        <div className="border-b border-foreground/10 pb-4">
          <h1 className="text-2xl font-bold hidden print:block">
            Karaokê de Leitura — Relatório
          </h1>
          <p>
            <strong>{turma.school.name}</strong> · {turma.name}
          </p>
          <p className="text-muted">
            Semana desde {weekStart.toLocaleDateString("pt-BR")} · Gerado em{" "}
            {generatedAt}
          </p>
        </div>

        <section>
          <h2 className="text-lg font-bold mb-2">Ranking semanal (XP)</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-muted">
                <th className="py-1 pr-3">#</th>
                <th className="py-1 pr-3">Aluno</th>
                <th className="py-1 pr-3">Leituras</th>
                <th className="py-1">XP semana</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r, i) => (
                <tr key={r.studentId} className="border-b border-foreground/5">
                  <td className="py-2 pr-3">{i + 1}</td>
                  <td className="py-2 pr-3">{r.name}</td>
                  <td className="py-2 pr-3">{r.weeklyReadings}</td>
                  <td className="py-2">{r.weeklyXp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">Resumo por aluno</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-muted">
                <th className="py-1 pr-3">Aluno</th>
                <th className="py-1 pr-3">Nível</th>
                <th className="py-1 pr-3">Total leituras</th>
                <th className="py-1 pr-3">Precisão média</th>
                <th className="py-1">WCPM médio</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const n = s.sessions.length;
                const avgAcc =
                  n > 0
                    ? s.sessions.reduce((a, x) => a + (x.accuracyPct ?? 0), 0) / n
                    : 0;
                const avgWcpm =
                  n > 0
                    ? s.sessions.reduce((a, x) => a + (x.wcpm ?? 0), 0) / n
                    : 0;
                return (
                  <tr key={s.id} className="border-b border-foreground/5">
                    <td className="py-2 pr-3">{s.user.name}</td>
                    <td className="py-2 pr-3">{s.level}</td>
                    <td className="py-2 pr-3">{n}</td>
                    <td className="py-2 pr-3">
                      {n ? `${avgAcc.toFixed(1)}%` : "—"}
                    </td>
                    <td className="py-2">{n ? avgWcpm.toFixed(1) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </section>
    </article>
  );
}
