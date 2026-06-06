import Link from "next/link";
import { PilotFeedbackForm } from "@/components/pilot-feedback-form";
import { appVersionLabel } from "@/lib/app-version";

export default function FeedbackPage() {
  return (
    <article className="max-w-md mx-auto space-y-6 py-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Feedback do piloto</h1>
        <p className="text-sm text-muted">
          Ajude a melhorar o Karaokê de Leitura durante o piloto fechado.
          Leva menos de 2 minutos.
        </p>
      </header>

      <PilotFeedbackForm source="WEB" appVersion={appVersionLabel()} screen="/feedback" />

      <p className="text-center text-sm">
        <Link href="/" className="text-muted hover:text-primary">
          ← Voltar ao início
        </Link>
      </p>
    </article>
  );
}
