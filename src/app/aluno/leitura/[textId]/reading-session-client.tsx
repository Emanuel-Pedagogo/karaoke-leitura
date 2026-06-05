"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { KaraokeReader } from "@/components/karaoke-reader";
import { AiReadingEvaluation } from "@/components/ai-reading-evaluation";
import { Card } from "@/components/ui/card";
import { comboMultiplierFromStreak } from "@karaoke/shared";
import { ReadingResultFeedback } from "@/components/reading-result-feedback";
import { useSpeechRecording } from "@/hooks/use-speech-recording";
import { calculateSessionMetrics } from "@/lib/reading-metrics";
import type { GeminiEvaluationResult } from "@/lib/gemini";
import {
  karaokeSpeedHint,
  METRIC_WCPM_SHORT,
  type KaraokeSpeedSuggestion,
} from "@karaoke/shared";

type TextData = {
  id: string;
  title: string;
  content: string;
  wordCount: number;
};

type GamificationResult = {
  unlockedAchievements: Array<{
    title: string;
    icon: string;
    description: string;
  }>;
  missionsCompleted: Array<{ title: string; xpReward: number }>;
  leveledUp: boolean;
  level?: number;
  comboStreak: number;
};

type Props = {
  text: TextData;
  studentId?: string;
  studentName: string;
  comboStreak?: number;
  hasVoiceConsent?: boolean;
  initialSpeed?: number;
  speedHint?: KaraokeSpeedSuggestion;
  classSession?: boolean;
};

function createClientSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

type Phase = "ready" | "countdown" | "reading" | "analyzing" | "done";

export function ReadingSessionClient({
  text,
  studentId,
  studentName,
  comboStreak = 0,
  hasVoiceConsent = false,
  initialSpeed = 1,
  speedHint,
  classSession = false,
}: Props) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [countdown, setCountdown] = useState(3);
  const [speed, setSpeed] = useState(initialSpeed);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingActive, setRecordingActive] = useState(false);
  const [attemptKey, setAttemptKey] = useState(0);
  const [analysisAudio, setAnalysisAudio] = useState<Blob | null>(null);
  const [aiEvaluation, setAiEvaluation] = useState<GeminiEvaluationResult | null>(
    null,
  );
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ReturnType<
    typeof calculateSessionMetrics
  > | null>(null);
  const [gamification, setGamification] = useState<GamificationResult | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const startRef = useRef<number | null>(null);
  const durationRef = useRef(0);
  const finishStartedRef = useRef(false);
  const clientSessionIdRef = useRef(createClientSessionId());

  const speech = useSpeechRecording(recordingActive && hasVoiceConsent);

  useEffect(() => {
    if (phase !== "analyzing") return;
    if (speech.audioBlob) {
      setAnalysisAudio(speech.audioBlob);
      return;
    }
    const timeout = window.setTimeout(() => {
      if (!speech.audioBlob) {
        setAnalysisError(
          "Não foi possível capturar o áudio. Tente ler até o fim e fale a última palavra.",
        );
      }
    }, 4000);
    return () => window.clearTimeout(timeout);
  }, [phase, speech.audioBlob]);

  const beginReading = useCallback(() => {
    startRef.current = Date.now();
    finishStartedRef.current = false;
    setAnalysisError(null);
    setAiEvaluation(null);
    setAnalysisAudio(null);
    speech.reset();
    setRecordingActive(true);
    setPhase("reading");
    setIsPlaying(true);
  }, [speech]);

  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      beginReading();
      return;
    }
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [beginReading, countdown, phase]);

  const handleStart = () => {
    if (!hasVoiceConsent) return;
    finishStartedRef.current = false;
    setAnalysisError(null);
    setAiEvaluation(null);
    setAnalysisAudio(null);
    setCountdown(3);
    setPhase("countdown");
  };

  const handleComplete = useCallback(() => {
    setIsPlaying(false);
    if (startRef.current) {
      durationRef.current = Math.round((Date.now() - startRef.current) / 1000);
    }
    window.setTimeout(() => {
      setRecordingActive(false);
      setPhase("analyzing");
    }, 400);
  }, []);

  const saveSession = useCallback(
    async (evaluation: GeminiEvaluationResult) => {
      if (finishStartedRef.current) return;
      finishStartedRef.current = true;
      setSaving(true);

      const counts = {
        omissions: evaluation.metrics.omissions,
        substitutions: evaluation.metrics.substitutions,
        hesitations: evaluation.metrics.hesitations,
      };
      const prosodyScore = evaluation.scores.prosody;
      const duration = Math.max(1, durationRef.current);
      const result = calculateSessionMetrics({
        wordCount: text.wordCount,
        durationSeconds: duration,
        ...counts,
        prosodyScore,
        comboMultiplier: comboMultiplierFromStreak(comboStreak),
      });
      setMetrics(result);
      setPhase("done");

      if (studentId) {
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId,
            clientSessionId: clientSessionIdRef.current,
            textId: text.id,
            durationSeconds: duration,
            speedMultiplier: speed,
            ...counts,
            prosodyScore,
            spokenTranscript: evaluation.spokenTranscript,
            asrSource: "gemini",
            ...result,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setGamification({
            unlockedAchievements: data.unlockedAchievements ?? [],
            missionsCompleted: data.missionsCompleted ?? [],
            leveledUp: data.leveledUp ?? false,
            level: data.level,
            comboStreak: data.comboStreak ?? comboStreak,
          });
        }
      }
      setSaving(false);
    },
    [comboStreak, speed, studentId, text.id, text.wordCount],
  );

  const handleAiSuccess = useCallback(
    (evaluation: GeminiEvaluationResult) => {
      setAiEvaluation(evaluation);
      void saveSession(evaluation);
    },
    [saveSession],
  );

  const handleTryAgain = () => {
    finishStartedRef.current = false;
    speech.reset();
    setPhase("ready");
    setCountdown(3);
    setIsPlaying(false);
    setRecordingActive(false);
    setMetrics(null);
    setGamification(null);
    setAiEvaluation(null);
    setAnalysisError(null);
    setAnalysisAudio(null);
    setSaving(false);
    setAttemptKey((k) => k + 1);
    durationRef.current = 0;
    startRef.current = null;
    clientSessionIdRef.current = createClientSessionId();
  };

  const nextStudentHref = `/aluno/trocar-aluno?returnTo=${encodeURIComponent(`/aluno/leitura/${text.id}`)}`;

  return (
    <article className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <aside>
          <Link href="/aluno" className="text-sm text-primary hover:underline">
            ← Voltar
          </Link>
          <h1 className="text-2xl font-bold mt-1">{text.title}</h1>
          <p className="text-sm text-muted">{studentName}</p>
        </aside>
        {(phase === "ready" || phase === "countdown" || phase === "reading") && (
          <label className="text-sm shrink-0 max-w-[11rem]">
            Velocidade: {speed.toFixed(1)}×
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="block w-full mt-1 accent-primary"
            />
          </label>
        )}
      </header>

      <Card className="min-h-[200px] flex flex-col items-center justify-center gap-2">
        {phase === "countdown" ? (
          <div className="flex flex-col items-center gap-1 mb-2">
            <p className="text-5xl font-bold text-primary tabular-nums">
              {countdown}
            </p>
            <p className="text-sm text-muted text-center">
              Prepare-se para ler em voz alta
            </p>
          </div>
        ) : null}
        {phase === "reading" && recordingActive && (
          <p className="text-xs text-primary animate-pulse">
            Gravando sua leitura…
          </p>
        )}
        <KaraokeReader
          key={attemptKey}
          content={text.content}
          speed={speed}
          isPlaying={phase === "reading" && isPlaying}
          runKey={attemptKey}
          onComplete={handleComplete}
        />
      </Card>

      {phase === "ready" && (
        <div className="space-y-4">
          {speedHint && (
            <p className="text-sm text-muted">{karaokeSpeedHint(speedHint)}</p>
          )}
          {hasVoiceConsent ? (
            <p className="text-sm text-muted">
              Leia em voz alta: o microfone grava e a IA avalia automaticamente
              ao terminar.
            </p>
          ) : (
            <p className="text-sm text-muted">
              Para ler com avaliação por IA,{" "}
              <Link
                href={`/aluno/consentimento?voz=1&returnTo=${encodeURIComponent(`/aluno/leitura/${text.id}`)}`}
                className="text-primary underline"
              >
                autorize o microfone na privacidade
              </Link>
              .
            </p>
          )}
          <button
            type="button"
            onClick={handleStart}
            disabled={!hasVoiceConsent}
            className="w-full py-4 rounded-xl bg-primary text-white text-lg font-bold hover:bg-primary-hover disabled:opacity-50"
          >
            Iniciar leitura
          </button>
        </div>
      )}

      {phase === "analyzing" && !analysisAudio && !analysisError && (
        <Card className="p-6 text-center text-sm text-muted">
          Finalizando gravação…
        </Card>
      )}

      {phase === "analyzing" && analysisAudio && !analysisError && (
        <AiReadingEvaluation
          key={attemptKey}
          textId={text.id}
          attemptKey={attemptKey}
          audioBlob={analysisAudio}
          onSuccess={handleAiSuccess}
          onError={setAnalysisError}
        />
      )}

      {phase === "analyzing" && analysisError && (
        <button
          type="button"
          onClick={handleTryAgain}
          className="w-full py-3 rounded-xl border border-primary text-primary font-semibold"
        >
          Tentar novamente
        </button>
      )}

      {phase === "done" && metrics && (
        <Card className="text-center space-y-4 border-success/30 bg-success/5">
          {saving ? (
            <p className="text-sm text-muted">Salvando resultado…</p>
          ) : (
            <>
              <p className="text-4xl">🎉</p>
              <h2 className="text-2xl font-bold">Leitura concluída!</h2>
              <ul className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <li>
                  <p className="text-muted">Precisão</p>
                  <p className="text-2xl font-bold">{metrics.accuracyPct}%</p>
                </li>
                <li>
                  <p className="text-muted">{METRIC_WCPM_SHORT}</p>
                  <p className="text-2xl font-bold">{metrics.wcpm}</p>
                </li>
                <li>
                  <p className="text-muted">Pontuação</p>
                  <p className="text-2xl font-bold text-accent">{metrics.score}</p>
                </li>
                <li>
                  <p className="text-muted">XP ganho</p>
                  <p className="text-2xl font-bold text-primary">
                    +{metrics.xpEarned}
                  </p>
                </li>
              </ul>
              {aiEvaluation && (
                <div className="text-left text-sm space-y-2 border-t pt-4">
                  <p>{aiEvaluation.feedback.summary}</p>
                  {aiEvaluation.feedback.strengths.length > 0 && (
                    <p>
                      <span className="font-semibold">Fortes: </span>
                      {aiEvaluation.feedback.strengths.join(" · ")}
                    </p>
                  )}
                </div>
              )}
              {gamification && (
                <ReadingResultFeedback
                  unlockedAchievements={gamification.unlockedAchievements}
                  missionsCompleted={gamification.missionsCompleted}
                  leveledUp={gamification.leveledUp}
                  newLevel={gamification.level}
                  comboStreak={gamification.comboStreak}
                />
              )}
              <div className="flex flex-col gap-3 justify-center">
                {classSession ? (
                  <Link
                    href={nextStudentHref}
                    className="inline-block w-full py-4 rounded-xl bg-primary text-white text-lg font-bold text-center hover:bg-primary-hover"
                  >
                    Próximo aluno
                  </Link>
                ) : null}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    type="button"
                    onClick={handleTryAgain}
                    className="px-6 py-2 rounded-lg border border-primary text-primary font-medium"
                  >
                    Tentar novamente
                  </button>
                  <Link
                    href="/aluno"
                    className={`inline-block px-6 py-2 rounded-lg text-center ${
                      classSession
                        ? "border border-primary text-primary font-medium"
                        : "bg-primary text-white"
                    }`}
                  >
                    Voltar ao início
                  </Link>
                </div>
              </div>
            </>
          )}
        </Card>
      )}
    </article>
  );
}
