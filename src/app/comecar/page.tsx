"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";

function ComecarContent() {
  const params = useSearchParams();
  const tipo = params.get("tipo");

  if (tipo !== "aluno" && tipo !== "professor") {
    return (
      <article className="max-w-md mx-auto text-center space-y-6 py-12">
        <p className="text-muted">Escolha como você vai usar o app.</p>
        <Link
          href="/"
          className="text-primary font-semibold hover:underline"
        >
          ← Voltar ao início
        </Link>
      </article>
    );
  }

  const isAluno = tipo === "aluno";
  const titulo = isAluno ? "Área do aluno" : "Área do professor";
  const descricao = isAluno
    ? "Crie sua conta para ler textos e ganhar pontos."
    : "Crie sua conta para acompanhar a turma e ver o progresso dos alunos.";

  return (
    <article className="max-w-md mx-auto space-y-8 py-8">
      <header className="text-center space-y-2">
        <p className="text-4xl" aria-hidden>
          {isAluno ? "📖" : "👨‍🏫"}
        </p>
        <h1 className="text-2xl font-bold">{titulo}</h1>
        <p className="text-muted text-sm">{descricao}</p>
      </header>

      <Card className="space-y-3 !p-6">
        <Link
          href={`/cadastro?tipo=${tipo}`}
          className="block w-full py-4 rounded-xl bg-primary text-white text-center font-bold hover:bg-primary-hover"
        >
          Criar conta
        </Link>
        <Link
          href={`/entrar?tipo=${tipo}`}
          className="block w-full py-4 rounded-xl border border-foreground/20 text-center font-semibold hover:bg-foreground/5"
        >
          Já tenho conta
        </Link>
      </Card>

      <p className="text-center text-sm">
        <Link href="/" className="text-muted hover:text-primary">
          ← Voltar
        </Link>
      </p>
    </article>
  );
}

export default function ComecarPage() {
  return (
    <Suspense fallback={<p className="text-center text-muted py-12">Carregando…</p>}>
      <ComecarContent />
    </Suspense>
  );
}
