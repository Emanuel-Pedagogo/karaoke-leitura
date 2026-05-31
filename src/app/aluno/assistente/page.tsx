import Link from "next/link";
import { requireStudentWithPrivacy } from "@/lib/privacy-guard";
import { getStudentAssistantTips } from "@/lib/reading-assistant";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AssistentePage() {
  const { session } = await requireStudentWithPrivacy();
  const { tips, studentName, avgAccuracy, avgWcpm } =
    await getStudentAssistantTips(session.studentId);

  return (
    <article className="space-y-8">
      <header>
        <Link href="/aluno" className="text-sm text-primary hover:underline">
          ← Início
        </Link>
        <h1 className="text-3xl font-bold mt-1">Assistente de leitura</h1>
        <p className="text-muted text-sm">
          Dicas personalizadas para {studentName}
          {avgAccuracy != null && (
            <>
              {" "}
              · precisão média {avgAccuracy.toFixed(0)}%
              {avgWcpm != null ? ` · WCPM ${avgWcpm.toFixed(0)}` : ""}
            </>
          )}
        </p>
      </header>

      <ul className="grid gap-4">
        {tips.map((tip) => (
          <li key={tip.title}>
            <Card>
              <p className="text-2xl mb-2">{tip.icon}</p>
              <h2 className="font-bold">{tip.title}</h2>
              <p className="text-sm text-muted mt-1">{tip.message}</p>
            </Card>
          </li>
        ))}
      </ul>

      <Card className="bg-primary/5 border-primary/20 text-sm">
        <p>
          Este assistente usa seu histórico de leituras. Com o microfone ativado,
          a correção automática compara sua fala ao texto. Em breve: chat com IA
          se o professor configurar integração avançada.
        </p>
      </Card>
    </article>
  );
}
