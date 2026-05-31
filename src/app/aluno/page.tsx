import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { xpProgressInLevel } from "@/lib/reading-metrics";
import { requireStudentWithPrivacy } from "@/lib/privacy-guard";
import { suggestTextsForStudent } from "@/lib/reading-assistant";
import {
  getActiveMissionsForStudent,
  getStudentAchievements,
} from "@/lib/student-data";
import { Card } from "@/components/ui/card";
import { DIFFICULTY_LABELS, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AlunoHomePage() {
  const { session } = await requireStudentWithPrivacy();
  const student = await prisma.studentProfile.findUnique({
    where: { id: session.studentId },
    include: {
      user: true,
      class: true,
      sessions: { orderBy: { startedAt: "desc" }, take: 5, include: { text: true } },
    },
  });

  if (!student) {
    return <p className="text-muted">Perfil não encontrado.</p>;
  }

  const [texts, missions, achievements, suggestions] = await Promise.all([
    prisma.readingText.findMany({ orderBy: { difficulty: "asc" } }),
    getActiveMissionsForStudent(student.id, student.classId),
    getStudentAchievements(student.id),
    suggestTextsForStudent(student.id),
  ]);

  const xp = student.xp;
  const progress = xpProgressInLevel(xp);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <article className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Olá, {student.user.name}! 👋</h1>
          <p className="text-muted">{student.class.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/aluno/assistente"
            className="text-sm px-4 py-2 rounded-lg border border-primary text-primary hover:bg-primary/10"
          >
            🤖 Assistente
          </Link>
          <Link
            href="/aluno/ranking"
            className="text-sm px-4 py-2 rounded-lg border border-primary text-primary hover:bg-primary/10"
          >
            🏆 Ranking
          </Link>
          <Link
            href="/aluno/dados"
            className="text-sm px-4 py-2 rounded-lg border border-foreground/20 hover:bg-foreground/5"
          >
            🔒 Meus dados
          </Link>
        </div>
      </header>

      <section className="grid sm:grid-cols-3 gap-4">
        <Card className="!p-4 text-center">
          <p className="text-xs text-muted uppercase">Nível</p>
          <p className="text-3xl font-bold text-primary">{student.level}</p>
        </Card>
        <Card className="!p-4 text-center">
          <p className="text-xs text-muted uppercase">XP</p>
          <p className="text-3xl font-bold">{xp}</p>
          <p className="text-xs text-muted mt-1">
            {progress.current}/{progress.needed} para próximo nível
          </p>
          <p className="mt-2 h-2 bg-foreground/10 rounded-full overflow-hidden">
            <span
              className="block h-full bg-primary rounded-full"
              style={{ width: `${progress.percent}%` }}
            />
          </p>
        </Card>
        <Card className="!p-4 text-center">
          <p className="text-xs text-muted uppercase">Combo</p>
          <p className="text-3xl font-bold text-accent">{student.comboStreak}🔥</p>
        </Card>
      </section>

      {missions.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4">Missões</h2>
          <ul className="grid gap-3">
            {missions.map((m) => (
              <li key={m.id}>
                <Card className={cn(m.done && "border-success/40 bg-success/5")}>
                  <p className="font-semibold">{m.title}</p>
                  <p className="text-sm text-muted">{m.description}</p>
                  <p className="text-sm mt-2">
                    Progresso: {m.completed}/{m.targetCount}
                    {m.done ? " ✅" : ""}
                    {!m.done && (
                      <span className="text-muted"> · +{m.xpReward} XP</span>
                    )}
                  </p>
                  <p className="mt-2 h-2 bg-foreground/10 rounded-full overflow-hidden">
                    <span
                      className="block h-full bg-primary rounded-full"
                      style={{
                        width: `${Math.min(100, (m.completed / m.targetCount) * 100)}%`,
                      }}
                    />
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-xl font-bold mb-4">
          Conquistas ({unlockedCount}/{achievements.length})
        </h2>
        <ul className="grid sm:grid-cols-3 gap-3">
          {achievements.map((a) => (
            <li key={a.id}>
              <Card
                className={cn(
                  "!p-4 text-center",
                  !a.unlocked && "opacity-50 grayscale",
                )}
              >
                <p className="text-3xl">{a.icon}</p>
                <p className="font-semibold text-sm mt-1">{a.title}</p>
                <p className="text-xs text-muted">{a.description}</p>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {suggestions.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4">Sugeridos para você (IA)</h2>
          <ul className="grid gap-3">
            {suggestions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/aluno/leitura/${s.id}`}
                  className={cn(
                    "block rounded-xl border border-primary/30 bg-primary/5 p-4",
                    "hover:border-primary hover:shadow-md transition-all",
                  )}
                >
                  <p className="font-semibold">{s.title}</p>
                  <p className="text-sm text-muted">
                    {s.difficultyLabel} · {s.reason}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-xl font-bold mb-4">Todos os textos</h2>
        <ul className="grid gap-3">
          {texts.map((text) => (
            <li key={text.id}>
              <Link
                href={`/aluno/leitura/${text.id}`}
                className={cn(
                  "block rounded-xl border border-foreground/10 bg-card p-4",
                  "hover:border-primary hover:shadow-md transition-all",
                )}
              >
                <p className="font-semibold">{text.title}</p>
                <p className="text-sm text-muted">
                  {DIFFICULTY_LABELS[text.difficulty]} · {text.wordCount} palavras
                  {text.gradeHint ? ` · ${text.gradeHint}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {student.sessions.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4">Histórico recente</h2>
          <ul className="space-y-2 text-sm">
            {student.sessions.map((s) => (
              <li
                key={s.id}
                className="flex justify-between border-b border-foreground/10 py-2"
              >
                <span>{s.text.title}</span>
                <span className="text-muted tabular-nums">
                  {s.accuracyPct != null ? `${s.accuracyPct}%` : "—"} ·{" "}
                  {s.wcpm != null ? `${s.wcpm} WCPM` : "—"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
