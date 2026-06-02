import Link from "next/link";

export default function HomePage() {
  return (
    <article className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <p className="text-5xl mb-4" aria-hidden>
        🎤
      </p>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight max-w-lg">
        Karaokê de Leitura
      </h1>
      <p className="text-lg text-muted mt-3 max-w-md">
        Leia em voz alta, ganhe pontos e evolua — de um jeito divertido.
      </p>

      <div className="mt-10 w-full max-w-sm flex flex-col gap-3">
        <Link
          href="/comecar?tipo=aluno"
          className="w-full py-4 px-6 rounded-2xl bg-primary text-white text-lg font-bold hover:bg-primary-hover shadow-sm transition-colors"
        >
          Sou aluno
        </Link>
        <Link
          href="/comecar?tipo=professor"
          className="w-full py-4 px-6 rounded-2xl border-2 border-primary text-primary text-lg font-bold hover:bg-primary/5 transition-colors"
        >
          Sou professor
        </Link>
      </div>

      <p className="mt-8 text-sm text-muted">
        Já tem conta?{" "}
        <Link href="/entrar" className="text-primary font-semibold hover:underline">
          Entrar
        </Link>
      </p>
    </article>
  );
}
