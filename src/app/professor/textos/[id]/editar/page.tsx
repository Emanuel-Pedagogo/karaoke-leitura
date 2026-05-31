import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTeacherSession } from "@/lib/auth-guard";
import { TextForm } from "@/components/text-form";
import { Card } from "@/components/ui/card";

export default async function EditarTextoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireTeacherSession();
  const { id } = await params;
  const text = await prisma.readingText.findUnique({ where: { id } });
  if (!text) notFound();

  return (
    <article className="space-y-6 max-w-2xl">
      <header>
        <Link
          href="/professor/textos"
          className="text-sm text-primary hover:underline"
        >
          ← Textos
        </Link>
        <h1 className="text-2xl font-bold mt-1">Editar texto</h1>
      </header>
      <Card>
        <TextForm
          initial={{
            id: text.id,
            title: text.title,
            content: text.content,
            difficulty: text.difficulty,
            gradeHint: text.gradeHint ?? "",
          }}
        />
      </Card>
    </article>
  );
}
