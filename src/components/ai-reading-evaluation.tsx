"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import type { GeminiEvaluationResult } from "@/lib/gemini";

const SCORE_LABELS: Record<keyof GeminiEvaluationResult["scores"], string> = {
  prosody: "Prosódia",
  fluency: "Fluência",
  expression: "Expressão",
  pace: "Ritmo",
  accuracy: "Precisão",
};

type Props = {
  textId: string;
  audioBlob: Blob | null;
  attemptKey: number;
  onSuccess: (evaluation: GeminiEvaluationResult) => void;
  onError: (message: string) => void;
};

export function AiReadingEvaluation({
  textId,
  audioBlob,
  attemptKey,
  onSuccess,
  onError,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [evaluation, setEvaluation] = useState<GeminiEvaluationResult | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const ranRef = useRef(false);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  useEffect(() => {
    ranRef.current = false;
    setEvaluation(null);
    setError(null);
    setLoading(true);
  }, [attemptKey]);

  useEffect(() => {
    if (ranRef.current || !audioBlob) {
      if (!audioBlob) {
        setLoading(false);
        setError("Nenhum áudio gravado. Tente ler em voz alta novamente.");
        onErrorRef.current("Nenhum áudio gravado.");
      }
      return;
    }
    ranRef.current = true;

    async function run() {
      if (!audioBlob) return;
      try {
        const form = new FormData();
        form.append("audio", audioBlob, "leitura.webm");
        form.append("textId", textId);
        const res = await fetch("/api/sessions/evaluate", {
          method: "POST",
          body: form,
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok || !data.evaluation) {
          throw new Error(data.error ?? "Erro na análise com IA");
        }
        const ev = data.evaluation as GeminiEvaluationResult;
        setEvaluation(ev);
        onSuccessRef.current(ev);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Erro na análise com IA";
        setError(msg);
        onErrorRef.current(msg);
      } finally {
        setLoading(false);
      }
    }

    void run();
  }, [audioBlob, textId, attemptKey]);

  if (loading) {
    return (
      <Card className="border-primary/20 bg-primary/5 p-6 text-center space-y-2">
        <p className="text-sm font-medium">Analisando sua leitura com IA…</p>
        <p className="text-xs text-muted">Isso pode levar alguns segundos.</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 p-4 space-y-2">
        <p className="text-sm text-red-700">{error}</p>
      </Card>
    );
  }

  if (!evaluation) return null;

  const { metrics, scores, feedback, errors } = evaluation;

  return (
    <Card className="border-primary/20 bg-primary/5 space-y-4 p-4">
      <h3 className="font-semibold">Avaliação da IA</h3>
      <p className="text-sm">{feedback.summary}</p>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
        {(Object.keys(SCORE_LABELS) as Array<keyof typeof SCORE_LABELS>).map(
          (key) => (
            <div key={key} className="rounded-lg bg-white/60 dark:bg-black/20 p-2">
              <p className="text-muted">{SCORE_LABELS[key]}</p>
              <p className="text-lg font-bold">{scores[key]}/5</p>
            </div>
          ),
        )}
      </div>

      <div className="text-xs grid grid-cols-2 sm:grid-cols-3 gap-2">
        <span>Omissões: {metrics.omissions}</span>
        <span>Substituições: {metrics.substitutions}</span>
        <span>Hesitações: {metrics.hesitations}</span>
        {(metrics.insertions ?? 0) > 0 && (
          <span>Inserções: {metrics.insertions}</span>
        )}
        {(metrics.selfCorrections ?? 0) > 0 && (
          <span>Autocorreções: {metrics.selfCorrections}</span>
        )}
        <span>Erros detalhados: {errors.length}</span>
      </div>

      {feedback.strengths.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-success">Pontos fortes</p>
          <ul className="text-xs list-disc pl-4 mt-1 space-y-0.5">
            {feedback.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {feedback.improvements.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-accent">Para praticar</p>
          <ul className="text-xs list-disc pl-4 mt-1 space-y-0.5">
            {feedback.improvements.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {evaluation.spokenTranscript && (
        <p className="text-xs text-muted border-t pt-2">
          Ouvido: {evaluation.spokenTranscript.slice(0, 160)}
          {evaluation.spokenTranscript.length > 160 ? "…" : ""}
        </p>
      )}
    </Card>
  );
}
