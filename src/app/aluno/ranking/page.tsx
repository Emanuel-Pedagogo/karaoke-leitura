import Link from "next/link";
import { requireStudentWithPrivacy } from "@/lib/privacy-guard";
import { getWeeklyRanking } from "@/lib/gamification";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { startOfWeek } from "@karaoke/shared";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const { session } = await requireStudentWithPrivacy();
  const student = await prisma.studentProfile.findUnique({
    where: { id: session.studentId },
    select: { classId: true, user: { select: { name: true } } },
  });

  if (!student) {
    return <p className="text-muted">Perfil não encontrado.</p>;
  }

  const ranking = await getWeeklyRanking(student.classId);
  const weekStart = startOfWeek();
  const myIndex = ranking.findIndex((r) => r.studentId === session.studentId);

  return (
    <article className="space-y-6">
      <header>
        <Link href="/aluno" className="text-sm text-primary hover:underline">
          ← Voltar
        </Link>
        <h1 className="text-3xl font-bold mt-1">Ranking semanal</h1>
        <p className="text-muted text-sm">
          Semana desde {weekStart.toLocaleDateString("pt-BR")} · por XP ganho em
          leituras
        </p>
      </header>

      {myIndex >= 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <p className="text-sm">
            Sua posição: <strong>#{myIndex + 1}</strong> ·{" "}
            {ranking[myIndex].weeklyXp} XP esta semana
          </p>
        </Card>
      )}

      <section className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-foreground/10 text-left text-muted">
              <th className="py-2 pr-4">#</th>
              <th className="py-2 pr-4">Aluno</th>
              <th className="py-2 pr-4">Nível</th>
              <th className="py-2 pr-4">Leituras</th>
              <th className="py-2">XP da semana</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((row, i) => (
              <tr
                key={row.studentId}
                className={
                  row.studentId === session.studentId
                    ? "border-b border-primary/20 bg-primary/5 font-medium"
                    : "border-b border-foreground/5"
                }
              >
                <td className="py-3 pr-4">{i + 1}</td>
                <td className="py-3 pr-4">{row.name}</td>
                <td className="py-3 pr-4">{row.level}</td>
                <td className="py-3 pr-4">{row.weeklyReadings}</td>
                <td className="py-3">{row.weeklyXp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </article>
  );
}
