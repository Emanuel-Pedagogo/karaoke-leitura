"use client";

import { FormEvent, useState } from "react";
import {
  PILOT_FEEDBACK_CATEGORIES,
  PILOT_INTERNET_QUALITY,
  PILOT_TRI_STATE,
  type PilotFeedbackCategory,
  type PilotInternetQuality,
  type PilotTriState,
} from "@karaoke/shared";
import { Card } from "@/components/ui/card";

type PilotFeedbackFormProps = {
  source: "WEB" | "MOBILE";
  appVersion?: string;
  screen?: string;
  onSuccess?: () => void;
};

export function PilotFeedbackForm({
  source,
  appVersion,
  screen,
  onSuccess,
}: PilotFeedbackFormProps) {
  const [category, setCategory] = useState<PilotFeedbackCategory | "">("");
  const [internetQuality, setInternetQuality] = useState<
    PilotInternetQuality | ""
  >("");
  const [aiWorked, setAiWorked] = useState<PilotTriState | "">("");
  const [readingWorked, setReadingWorked] = useState<PilotTriState | "">("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/pilot-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          category,
          message,
          internetQuality: internetQuality || undefined,
          aiWorked: aiWorked || undefined,
          readingWorked: readingWorked || undefined,
          appVersion,
          screen,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Não foi possível enviar");
      }
      setSent(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <Card className="text-center space-y-3 !p-6 border-success/30 bg-success/5">
        <p className="text-2xl">✓</p>
        <p className="font-semibold">
          Obrigado! Seu feedback ajuda a melhorar o piloto.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 text-sm">
        <label className="block">
          Categoria
          <select
            required
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as PilotFeedbackCategory)
            }
            className="mt-1 w-full rounded-lg border border-foreground/20 px-3 py-2 bg-background"
          >
            <option value="">Selecione…</option>
            {PILOT_FEEDBACK_CATEGORIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          Como estava a internet?
          <select
            value={internetQuality}
            onChange={(e) =>
              setInternetQuality(e.target.value as PilotInternetQuality | "")
            }
            className="mt-1 w-full rounded-lg border border-foreground/20 px-3 py-2 bg-background"
          >
            <option value="">Não informado</option>
            {PILOT_INTERNET_QUALITY.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="space-y-2">
          <legend className="font-medium">A IA funcionou?</legend>
          <div className="flex flex-wrap gap-3">
            {PILOT_TRI_STATE.map((item) => (
              <label key={item.value} className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="aiWorked"
                  value={item.value}
                  checked={aiWorked === item.value}
                  onChange={() => setAiWorked(item.value)}
                />
                {item.label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="font-medium">A leitura funcionou?</legend>
          <div className="flex flex-wrap gap-3">
            {PILOT_TRI_STATE.map((item) => (
              <label key={item.value} className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="readingWorked"
                  value={item.value}
                  checked={readingWorked === item.value}
                  onChange={() => setReadingWorked(item.value)}
                />
                {item.label}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block">
          Conte o que aconteceu
          <textarea
            required
            minLength={10}
            maxLength={2000}
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ex.: o login demorou, a contagem apareceu mas o microfone não gravou…"
            className="mt-1 w-full rounded-lg border border-foreground/20 px-3 py-2 bg-background resize-y"
          />
        </label>

        {appVersion ? (
          <p className="text-xs text-muted">Versão: {appVersion}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading || !category}
          className="w-full py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-60"
        >
          {loading ? "Enviando…" : "Enviar feedback"}
        </button>

        {error ? <p className="text-red-600 text-center">{error}</p> : null}
      </form>
    </Card>
  );
}
