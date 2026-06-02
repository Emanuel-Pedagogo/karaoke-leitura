import { MS_PER_WORD_BASE } from "./karaoke-speed";

/** Pausa extra (ms) após a palavra, conforme pontuação no fim do token. */
export function punctuationPauseMs(word: string): number {
  const trimmed = word.trim();
  if (!trimmed) return 0;

  const last = trimmed.at(-1) ?? "";
  const endsWith = (chars: string) => chars.includes(last);

  if (endsWith(".!?…") || trimmed.endsWith("...")) {
    return 550;
  }
  if (endsWith(";:")) {
    return 320;
  }
  if (endsWith(",")) {
    return 200;
  }
  if (endsWith("—") || endsWith("-")) {
    return 150;
  }
  return 0;
}

/** Tempo até destacar a próxima palavra (leitura + pausa de pontuação). */
export function delayBeforeNextWordMs(
  word: string,
  speed: number,
  baseMs: number = MS_PER_WORD_BASE,
): number {
  const safeSpeed = Math.max(0.5, speed);
  const wordMs = baseMs / safeSpeed;
  const pauseMs = punctuationPauseMs(word) / safeSpeed;
  return Math.round(wordMs + pauseMs);
}

export function delayAfterLastWordMs(
  word: string,
  speed: number,
  baseMs: number = MS_PER_WORD_BASE,
): number {
  return delayBeforeNextWordMs(word, speed, baseMs);
}
