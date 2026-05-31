import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTeacherSession } from "@/lib/auth-guard";
import { Card } from "@/components/ui/card";
import { DIFFICULTY_LABELS } from "@/lib/utils";
import { DeleteTextButton } from "@/components/delete-text-button";

export const dynamic = "force-dynamic";

export default async function ProfessorTextosPage() {
  await requireTeacherSession();
  const texts = await prisma.readingText.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <article className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/professor"
            className="text-sm text-primary hover:underline"
          >
            ← Dashboard
          </Link>
          <h1 className="text-3xl font-bold mt-1">Textos de leitura</h1>
          <p className="text-muted text-sm">
            Crie e edite os textos usados pelos alunos.
          </p>
        </div>
        <Link
          href="/professor/textos/novo"
          className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover"
        >
          + Novo texto
        </Link>
      </header>

      <ul className="space-y-3">
        {texts.map((text) => (
          <li key={text.id}>
            <Card className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-semibold">{text.title}</p>
                <p className="text-sm text-muted">
                  {DIFFICULTY_LABELS[text.difficulty]} · {text.wordCount}{" "}
                  palavras
                  {text.gradeHint ? ` · ${text.gradeHint}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/professor/textos/${text.id}/editar`}
                  className="text-sm px-3 py-1 rounded border border-primary text-primary hover:bg-primary/10"
                >
                  Editar
                </Link>
                <DeleteTextButton textId={text.id} title={text.title} />
              </div>
            </Card>
          </li>
        ))}
      </ul>

      {texts.length === 0 && (
        <p className="text-muted text-sm">Nenhum texto cadastrado ainda.</p>
      )}
    </article>
  );
}
