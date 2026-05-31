import { tokenizeText } from "@/lib/reading-metrics";
import type { TextDifficulty } from "@prisma/client";

export function countWords(content: string) {
  return tokenizeText(content).length;
}

export const TEXT_DIFFICULTIES: TextDifficulty[] = [
  "INICIANTE",
  "INTERMEDIARIO",
  "AVANCADO",
];
