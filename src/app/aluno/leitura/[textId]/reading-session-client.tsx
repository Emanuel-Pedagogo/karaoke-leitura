"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { KaraokeReader } from "@/components/karaoke-reader";
import { ManualEvaluationPanel } from "@/components/manual-evaluation-panel";
import { Card } from "@/components/ui/card";
import { comboMultiplierFromStreak } from "@karaoke/shared";
import { ReadingResultFeedback } from "@/components/reading-result-feedback";
import { VoiceAnalysisPanel } from "@/components/voice-analysis-panel";
import { useSpeechRecording } from "@/hooks/use-speech-recording";
import { calculateSessionMetrics } from "@/lib/reading-metrics";

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
};

type Phase = "ready" | "reading" | "evaluate" | "done";

export function ReadingSessionClient({
  text,
  studentId,
  studentName,
  comboStreak = 0,
  hasVoiceConsent = false,
}: Props) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [speed, setSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [counts, setCounts] = useState({
    omissions: 0,
    substitutions: 0,
    hesitations: 0,
  });
  const [prosody, setProsody] = useState(3);
  const [metrics, setMetrics] = useState<ReturnType<
    typeof calculateSessionMetrics
  > | null>(null);
  const [gamification, setGamification] = useState<GamificationResult | null>(
    null,
  );
  const [voiceMode, setVoiceMode] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState("");
  const startRef = useRef<number | null>(null);
  const durationRef = useRef(0);

  const speech = useSpeechRecording(phase === "reading" && voiceMode);

  const handleStart = () => {
    startRef.current = Date.now();
    setPhase("reading");
    setIsPlaying(true);
  };

  const handleComplete = useCallback(() => {
    setIsPlaying(false);
    if (startRef.current) {
      durationRef.current = Math.round((Date.now() - startRef.current) / 1000);
    }
    setPhase("evaluate");
  }, []);

  const handleFinish = async () => {
    const duration = Math.max(1, durationRef.current);
    const result = calculateSessionMetrics({
      wordCount: text.wordCount,
      durationSeconds: duration,
      ...counts,
      prosodyScore: prosody,
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
          textId: text.id,
          durationSeconds: duration,
          speedMultiplier: speed,
          ...counts,
          prosodyScore: prosody,
          spokenTranscript: hasVoiceConsent
            ? spokenTranscript || speech.transcript || undefined
            : undefined,
          asrSource:
            hasVoiceConsent && speech.transcript ? "browser" : undefined,
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
  };

  useEffect(() => {
    if (phase !== "reading") setIsPlaying(false);
  }, [phase]);

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
        {phase === "reading" && (
          <label className="text-sm shrink-0">
            Velocidade: {speed.toFixed(1)}×
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="block w-28 mt-1 accent-primary"
            />
          </label>
        )}
      </header>

      <Card className="min-h-[200px] flex items-center justify-center">
        <KaraokeReader
          content={text.content}
          speed={speed}
          isPlaying={isPlaying}
          onComplete={handleComplete}
        />
      </Card>

      {phase === "ready" && (
        <div className="space-y-4">
          {hasVoiceConsent ? (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={voiceMode}
                onChange={(e) => setVoiceMode(e.target.checked)}
                className="accent-primary"
              />
              Usar microfone e análise automática (IA)
            </label>
          ) : (
            <p className="text-sm text-muted">
              Microfone desativado.{" "}
              <Link href="/aluno/consentimento" className="text-primary underline">
                Autorizar na privacidade
              </Link>{" "}
              ou use avaliação manual.
            </p>
          )}
          <button
            type="button"
            onClick={handleStart}
            className="w-full py-4 rounded-xl bg-primary text-white text-lg font-bold hover:bg-primary-hover"
          >
            ▶ Iniciar leitura
          </button>
        </div>
      )}

      {phase === "evaluate" && (
        <Card className="space-y-4">
          {voiceMode && (
            <VoiceAnalysisPanel
              textId={text.id}
              transcript={speech.transcript}
              listening={speech.listening}
              speechError={speech.error}
              audioBlob={speech.audioBlob}
              onApplySuggestion={(a) => {
                setCounts({
                  omissions: a.omissions,
                  substitutions: a.substitutions,
                  hesitations: a.hesitations,
                });
                setSpokenTranscript(speech.transcript);
              }}
            />
          )}
          <ManualEvaluationPanel
            counts={counts}
            prosodyScore={prosody}
            onChange={(c, p) => {
              setCounts(c);
              setProsody(p);
            }}
          />
          <button
            type="button"
            onClick={handleFinish}
            className="mt-6 w-full py-3 rounded-xl bg-success text-white font-bold"
          >
            Concluir e ver resultado
          </button>
        </Card>
      )}

      {phase === "done" && metrics && (
        <Card className="text-center space-y-4 border-success/30 bg-success/5">
          <p className="text-4xl">🎉</p>
          <h2 className="text-2xl font-bold">Leitura concluída!</h2>
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <li>
              <p className="text-muted">Precisão</p>
              <p className="text-2xl font-bold">{metrics.accuracyPct}%</p>
            </li>
            <li>
              <p className="text-muted">WCPM</p>
              <p className="text-2xl font-bold">{metrics.wcpm}</p>
            </li>
            <li>
              <p className="text-muted">Pontuação</p>
              <p className="text-2xl font-bold text-accent">{metrics.score}</p>
            </li>
            <li>
              <p className="text-muted">XP ganho</p>
              <p className="text-2xl font-bold text-primary">+{metrics.xpEarned}</p>
            </li>
          </ul>
          {gamification && (
            <ReadingResultFeedback
              unlockedAchievements={gamification.unlockedAchievements}
              missionsCompleted={gamification.missionsCompleted}
              leveledUp={gamification.leveledUp}
              newLevel={gamification.level}
              comboStreak={gamification.comboStreak}
            />
          )}
          <Link
            href="/aluno"
            className="inline-block px-6 py-2 rounded-lg bg-primary text-white"
          >
            Voltar ao início
          </Link>
        </Card>
      )}
    </article>
  );
}
