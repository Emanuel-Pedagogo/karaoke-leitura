import Link from "next/link";
import { requireStudentWithPrivacy } from "@/lib/privacy-guard";
import { Card } from "@/components/ui/card";
import { DeleteAccountButton } from "@/components/delete-account-button";
import { EraseVoiceDataButton } from "@/components/erase-voice-data-button";

export default async function MeusDadosPage() {
  const { hasVoiceConsent } = await requireStudentWithPrivacy();

  return (
    <article className="space-y-8 max-w-lg">
      <header>
        <Link href="/aluno" className="text-sm text-primary hover:underline">
          ← Início
        </Link>
        <h1 className="text-3xl font-bold mt-1">Meus dados (LGPD)</h1>
        <p className="text-muted text-sm">
          Exercite seus direitos previstos na Lei 13.709/2018.
        </p>
      </header>

      <Card className="space-y-3 text-sm">
        <h2 className="font-bold">Política de privacidade</h2>
        <p className="text-muted">
          Consulte o que coletamos, por quê e por quanto tempo.
        </p>
        <Link
          href="/privacidade"
          className="text-primary hover:underline"
          target="_blank"
        >
          Ler política completa →
        </Link>
      </Card>

      <Card className="space-y-3 text-sm">
        <h2 className="font-bold">Dados de voz</h2>
        <p className="text-muted">
          Status do microfone:{" "}
          {hasVoiceConsent ? (
            <span className="text-success font-medium">autorizado</span>
          ) : (
            <span className="font-medium">não autorizado</span>
          )}
        </p>
        <p className="text-muted">
          Você pode apagar todas as <strong>transcrições</strong> salvas nas suas
          leituras. Métricas (precisão, palavras por minuto) permanecem para o professor.
        </p>
        <EraseVoiceDataButton />
        {!hasVoiceConsent && (
          <Link
            href="/aluno/consentimento"
            className="text-primary hover:underline text-sm"
          >
            Atualizar consentimentos →
          </Link>
        )}
      </Card>

      <Card className="space-y-3 text-sm border-red-500/20">
        <h2 className="font-bold text-red-800">Encerrar conta</h2>
        <p className="text-muted">
          Exclui permanentemente sua conta, histórico de leituras, XP, conquistas
          e dados de voz. A turma e os textos da escola permanecem.
        </p>
        <DeleteAccountButton redirectTo="/login" />
      </Card>
    </article>
  );
}
