"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";

export function PrivacyConsentForm() {
  const router = useRouter();
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptVoice, setAcceptVoice] = useState(false);
  const [guardianConfirmed, setGuardianConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/privacy/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acceptPrivacy,
          acceptVoice,
          guardianConfirmed: acceptVoice ? guardianConfirmed : false,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          await fetch("/api/auth/logout", { method: "POST" });
          window.location.href = "/login";
          return;
        }
        throw new Error(data.error ?? "Erro ao salvar");
      }
      router.push("/aluno");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-lg mx-auto space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Privacidade e consentimento</h1>
        <p className="text-sm text-muted">
          Em conformidade com a LGPD (Lei 13.709/2018). A escola é a controladora
          dos dados; esta plataforma trata dados apenas para fins educacionais.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <label className="flex gap-3 items-start cursor-pointer">
          <input
            type="checkbox"
            required
            checked={acceptPrivacy}
            onChange={(e) => setAcceptPrivacy(e.target.checked)}
            className="mt-1 accent-primary"
          />
          <span>
            Li e aceito a{" "}
            <Link
              href="/privacidade"
              target="_blank"
              className="text-primary underline"
            >
              Política de Privacidade
            </Link>{" "}
            (dados de conta, desempenho em leituras, XP e turma).
          </span>
        </label>

        <label className="flex gap-3 items-start cursor-pointer">
          <input
            type="checkbox"
            checked={acceptVoice}
            onChange={(e) => {
              setAcceptVoice(e.target.checked);
              if (!e.target.checked) setGuardianConfirmed(false);
            }}
            className="mt-1 accent-primary"
          />
          <span>
            <strong>Opcional:</strong> autorizo o uso do microfone para transcrição
            e análise automática da leitura em voz alta. O áudio não é armazenado no
            servidor; apenas texto transcrito e métricas.
          </span>
        </label>

        {acceptVoice && (
          <label className="flex gap-3 items-start cursor-pointer ml-6 border-l-2 border-primary/30 pl-4">
            <input
              type="checkbox"
              required={acceptVoice}
              checked={guardianConfirmed}
              onChange={(e) => setGuardianConfirmed(e.target.checked)}
              className="mt-1 accent-primary"
            />
            <span>
              Sou o aluno maior de 16 anos com capacidade civil, <strong>ou</strong>{" "}
              sou responsável legal / autorizo o tratamento de voz do menor sob minha
              tutela.
            </span>
          </label>
        )}

        {error && <p className="text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading || !acceptPrivacy}
          className="w-full py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-60"
        >
          {loading ? "Salvando…" : "Continuar"}
        </button>

        <p className="text-xs text-muted">
          Sem aceitar a política base, não é possível usar o app. Você pode recusar
          o microfone e avaliar leituras manualmente.
        </p>
      </form>
    </Card>
  );
}
