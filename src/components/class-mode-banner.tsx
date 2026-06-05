import Link from "next/link";

type ClassModeBannerProps = {
  studentName: string;
};

export function ClassModeBanner({ studentName }: ClassModeBannerProps) {
  return (
    <section
      className="rounded-xl border-2 border-primary bg-primary/5 p-4 space-y-2"
      aria-label="Modo sala ativo"
    >
      <p className="font-bold text-primary text-lg">Modo sala ativo</p>
      <p className="text-sm text-foreground/80">
        Este dispositivo está sendo usado por vários alunos da turma.
      </p>
      <p className="text-sm font-semibold">Aluno atual: {studentName}</p>
      <Link
        href="/aluno/trocar-aluno"
        className="block w-full py-3 rounded-lg bg-primary text-white text-center font-bold hover:bg-primary-hover transition-colors"
      >
        Trocar aluno / Próximo aluno
      </Link>
    </section>
  );
}
