import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <article className="space-y-10">
      <section className="text-center space-y-4 py-8">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Leitura que parece{" "}
          <span className="text-primary">karaokê</span>
        </h1>
        <p className="text-lg text-muted max-w-2xl mx-auto">
          Plataforma educacional gamificada para fluência leitora, com
          acompanhamento pedagógico e avaliação de precisão e WCPM.
        </p>
      </section>

      <section className="grid sm:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-bold mb-2">👩‍🎓 Área do Aluno</h2>
          <p className="text-muted text-sm mb-4">
            Leituras interativas, XP, missões, ranking e conquistas.
          </p>
          <Link
            href="/cadastro"
            className="inline-block px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover"
          >
            Criar conta de aluno
          </Link>
          <Link
            href="/login"
            className="inline-block ml-2 px-4 py-2 rounded-lg border border-primary text-primary hover:bg-primary/10"
          >
            Já tenho conta
          </Link>
        </Card>
        <Card>
          <h2 className="text-xl font-bold mb-2">👨‍🏫 Área do Professor</h2>
          <p className="text-muted text-sm mb-4">
            Dashboard da turma, evolução individual e relatórios.
          </p>
          <Link
            href="/cadastro"
            className="inline-block px-4 py-2 rounded-lg border border-primary text-primary hover:bg-primary/10"
          >
            Criar conta de professor
          </Link>
          <Link
            href="/login"
            className="inline-block ml-2 px-4 py-2 rounded-lg border border-foreground/20 hover:bg-foreground/5"
          >
            Já tenho conta
          </Link>
        </Card>
      </section>

      <section className="grid sm:grid-cols-3 gap-4 text-center text-sm">
        {[
          { icon: "🎯", title: "Fluência", desc: "Ritmo, prosódia e confiança" },
          { icon: "📊", title: "Métricas", desc: "Precisão, WCPM e evolução" },
          { icon: "🏅", title: "Gamificação", desc: "XP, níveis e missões" },
        ].map((item) => (
          <Card key={item.title} className="!p-4">
            <p className="text-2xl mb-1">{item.icon}</p>
            <p className="font-semibold">{item.title}</p>
            <p className="text-muted">{item.desc}</p>
          </Card>
        ))}
      </section>
    </article>
  );
}
