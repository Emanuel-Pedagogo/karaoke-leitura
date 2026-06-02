/** Intervalo base por palavra no karaokê a 1× (ms). */
export const MS_PER_WORD_BASE = 450;

export type TextDifficultyLevel =
  | "INICIANTE"
  | "INTERMEDIARIO"
  | "AVANCADO";

const DEFAULT_SPEED_BY_DIFFICULTY: Record<TextDifficultyLevel, number> = {
  INICIANTE: 0.7,
  INTERMEDIARIO: 1,
  AVANCADO: 1.2,
};

export type KaraokeSpeedSuggestion = {
  speed: number;
  source: "history" | "difficulty" | "default";
  avgWcpm?: number;
};

function clampSpeed(speed: number): number {
  return Math.min(2, Math.max(0.5, Math.round(speed * 10) / 10));
}

/** Média de palavras/min das sessões recentes (ignora zeros). */
export function averageWcpm(
  values: Array<number | null | undefined>,
): number | null {
  const valid = values.filter((v): v is number => v != null && v > 0);
  if (valid.length === 0) return null;
  const sum = valid.reduce((acc, v) => acc + v, 0);
  return Math.round((sum / valid.length) * 10) / 10;
}

/**
 * Sugere o multiplicador do destaque (0,5×–2×) com base na fluência recente
 * ou, na falta de histórico, na dificuldade do texto.
 */
export function suggestKaraokeSpeed(
  recentWcpm: number | null | undefined,
  textDifficulty?: TextDifficultyLevel,
): KaraokeSpeedSuggestion {
  if (recentWcpm != null && recentWcpm > 0) {
    const speed = (MS_PER_WORD_BASE * recentWcpm) / 60_000;
    return {
      speed: clampSpeed(speed),
      source: "history",
      avgWcpm: recentWcpm,
    };
  }

  if (textDifficulty) {
    return {
      speed: DEFAULT_SPEED_BY_DIFFICULTY[textDifficulty],
      source: "difficulty",
    };
  }

  return { speed: 1, source: "default" };
}

export function karaokeSpeedHint(
  suggestion: KaraokeSpeedSuggestion,
): string {
  if (suggestion.source === "history" && suggestion.avgWcpm != null) {
    return `Velocidade sugerida pela sua evolução (média de ${suggestion.avgWcpm} palavras/min). Você pode ajustar no controle abaixo.`;
  }
  if (suggestion.source === "difficulty") {
    return "Velocidade inicial sugerida para este nível de texto. Você pode ajustar no controle abaixo.";
  }
  return "Ajuste a velocidade do destaque conforme sua leitura.";
}
