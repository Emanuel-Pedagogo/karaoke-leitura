export type ReadingErrorCounts = {
  omissions: number;
  substitutions: number;
  hesitations: number;
};

export type SessionMetricsInput = ReadingErrorCounts & {
  wordCount: number;
  durationSeconds: number;
  prosodyScore?: number;
  comboMultiplier?: number;
};

export type SessionMetrics = {
  totalErrors: number;
  correctWords: number;
  accuracyPct: number;
  wcpm: number;
  score: number;
  xpEarned: number;
};

const PROSODY_FACTOR: Record<number, number> = {
  1: 0.7,
  2: 0.85,
  3: 1,
  4: 1.15,
  5: 1.3,
};

export function tokenizeText(content: string): string[] {
  return content.split(/\s+/).filter(Boolean);
}

export function calculateSessionMetrics(
  input: SessionMetricsInput,
): SessionMetrics {
  const totalErrors =
    input.omissions + input.substitutions + input.hesitations;
  const correctWords = Math.max(0, input.wordCount - totalErrors);
  const accuracyPct =
    input.wordCount > 0 ? (correctWords / input.wordCount) * 100 : 0;
  const minutes = input.durationSeconds / 60;
  const wcpm = minutes > 0 ? correctWords / minutes : 0;
  const prosodyFactor = PROSODY_FACTOR[input.prosodyScore ?? 3] ?? 1;
  const combo = input.comboMultiplier ?? 1;
  const score = Math.round(
    wcpm * (accuracyPct / 100) * prosodyFactor * combo * 10,
  );
  const xpEarned = Math.max(10, Math.round(score / 2));

  return {
    totalErrors,
    correctWords,
    accuracyPct: Math.round(accuracyPct * 10) / 10,
    wcpm: Math.round(wcpm * 10) / 10,
    score,
    xpEarned,
  };
}

export function levelFromXp(xp: number): number {
  return Math.floor(xp / 500) + 1;
}

export function xpProgressInLevel(xp: number): {
  current: number;
  needed: number;
  percent: number;
} {
  const level = levelFromXp(xp);
  const base = (level - 1) * 500;
  const current = xp - base;
  const needed = 500;
  return {
    current,
    needed,
    percent: Math.min(100, Math.round((current / needed) * 100)),
  };
}
