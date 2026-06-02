import Link from "next/link";
import { requireTeacherSession } from "@/lib/auth-guard";
import { Card } from "@/components/ui/card";
import { DeleteAccountButton } from "@/components/delete-account-button";

export default async function ProfessorContaPage() {
  await requireTeacherSession();

  return (
    <article className="space-y-8 max-w-lg">
      <header>
        <Link href="/professor" className="text-sm text-primary hover:underline">
          ← Dashboard
        </Link>
        <h1 className="text-3xl font-bold mt-1">Minha conta</h1>
        <p className="text-muted text-sm">
          Encerramento de conta e exclusão de dados pessoais.
        </p>
      </header>

      <Card className="space-y-3 text-sm border-red-500/20">
        <h2 className="font-bold text-red-800">Encerrar conta</h2>
        <p className="text-muted">
          Sua conta de professor será excluída. As turmas que você lidera
          ficarão sem professor vinculado até outro docente assumir. Os dados
          dos alunos não são apagados.
        </p>
        <DeleteAccountButton redirectTo="/login" />
      </Card>
    </article>
  );
}
