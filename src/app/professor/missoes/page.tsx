import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTeacherSession } from "@/lib/auth-guard";
import { Card } from "@/components/ui/card";
import { MissionForm } from "@/components/mission-form";

export const dynamic = "force-dynamic";

export default async function ProfessorMissoesPage() {
  await requireTeacherSession();

  const missions = await prisma.mission.findMany({
    orderBy: { activeFrom: "desc" },
    include: { class: true, progress: true },
  });

  return (
    <article className="space-y-8">
      <header>
        <Link href="/professor" className="text-sm text-primary hover:underline">
          ← Dashboard
        </Link>
        <h1 className="text-3xl font-bold mt-1">Missões da turma</h1>
        <p className="text-muted text-sm">
          Crie desafios personalizados para os alunos.
        </p>
      </header>

      <section className="grid lg:grid-cols-2 gap-8">
        <Card>
          <h2 className="font-bold mb-4">Nova missão</h2>
          <MissionForm />
        </Card>

        <div className="space-y-3">
          <h2 className="font-bold">Missões ativas e anteriores</h2>
          {missions.map((m) => (
            <Card key={m.id}>
              <p className="font-semibold">{m.title}</p>
              <p className="text-sm text-muted">{m.description}</p>
              <p className="text-xs text-muted mt-2">
                Meta: {m.targetCount} leitura(s)
                {m.minAccuracy != null ? ` · ≥${m.minAccuracy}% precisão` : ""}
                · +{m.xpReward} XP · {m.progress.filter((p) => p.done).length}/
                {m.progress.length} concluíram
              </p>
            </Card>
          ))}
          {missions.length === 0 && (
            <p className="text-muted text-sm">Nenhuma missão além do seed.</p>
          )}
        </div>
      </section>
    </article>
  );
}
