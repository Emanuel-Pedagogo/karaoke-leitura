"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";

type Alignment = {
  omissions: number;
  substitutions: number;
  hesitations: number;
};

type Props = {
  textId: string;
  transcript: string;
  listening: boolean;
  speechError: string | null;
  audioBlob: Blob | null;
  onApplySuggestion: (counts: Alignment) => void;
};

export function VoiceAnalysisPanel({
  textId,
  transcript,
  listening,
  speechError,
  audioBlob,
  onApplySuggestion,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastAlignment, setLastAlignment] = useState<Alignment | null>(null);

  async function runAnalysis() {
    setLoading(true);
    setMessage(null);
    try {
      let finalTranscript = transcript.trim();

      if (!finalTranscript && audioBlob) {
        const form = new FormData();
        form.append("audio", audioBlob, "leitura.webm");
        const tr = await fetch("/api/reading/transcribe", {
          method: "POST",
          body: form,
        });
        const trData = await tr.json();
        if (tr.ok && trData.transcript) {
          finalTranscript = trData.transcript;
          setMessage(`Transcrição (Whisper): "${finalTranscript.slice(0, 80)}…"`);
        } else if (!tr.ok) {
          throw new Error(trData.error ?? trData.hint ?? "Transcrição falhou");
        }
      }

      if (!finalTranscript) {
        throw new Error(
          "Nenhuma fala detectada. Leia em voz alta ou configure OPENAI_API_KEY.",
        );
      }

      const res = await fetch("/api/reading/align", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textId, transcript: finalTranscript }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro na análise");

      setLastAlignment(data.alignment);
      setMessage(data.disclaimer);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro na análise");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-primary/20 bg-primary/5 space-y-3">
      <h3 className="font-semibold text-sm">🎤 Análise por voz (IA)</h3>
      {listening && (
        <p className="text-xs text-primary animate-pulse">Ouvindo… fale o texto em voz alta.</p>
      )}
      {speechError && <p className="text-xs text-red-600">{speechError}</p>}
      {transcript && (
        <p className="text-xs text-muted max-h-20 overflow-y-auto">
          Ouvido: {transcript}
        </p>
      )}
      <button
        type="button"
        onClick={() => void runAnalysis()}
        disabled={loading}
        className="w-full py-2 rounded-lg border border-primary text-primary text-sm hover:bg-primary/10 disabled:opacity-60"
      >
        {loading ? "Analisando…" : "Analisar leitura automaticamente"}
      </button>
      {lastAlignment && (
        <div className="text-xs space-y-2">
          <p>
            Sugestão: {lastAlignment.omissions} omissões ·{" "}
            {lastAlignment.substitutions} substituições ·{" "}
            {lastAlignment.hesitations} hesitações
          </p>
          <button
            type="button"
            onClick={() => onApplySuggestion(lastAlignment)}
            className="w-full py-2 rounded-lg bg-primary text-white text-sm"
          >
            Usar sugestão nos contadores
          </button>
        </div>
      )}
      {message && <p className="text-xs text-muted">{message}</p>}
    </Card>
  );
}
