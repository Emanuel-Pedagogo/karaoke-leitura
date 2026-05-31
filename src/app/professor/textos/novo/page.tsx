import Link from "next/link";
import { requireTeacherSession } from "@/lib/auth-guard";
import { TextForm } from "@/components/text-form";
import { Card } from "@/components/ui/card";

export default async function NovoTextoPage() {
  await requireTeacherSession();

  return (
    <article className="space-y-6 max-w-2xl">
      <header>
        <Link
          href="/professor/textos"
          className="text-sm text-primary hover:underline"
        >
          ← Textos
        </Link>
        <h1 className="text-2xl font-bold mt-1">Novo texto</h1>
      </header>
      <Card>
        <TextForm />
      </Card>
    </article>
  );
}
