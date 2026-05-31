import { tokenizeText } from "./reading-metrics";

export type AlignmentResult = {
  omissions: number;
  substitutions: number;
  hesitations: number;
  matchedWords: number;
  expectedWords: number;
  spokenWords: number;
};

/** Normaliza palavra para comparação (minúscula, sem pontuação). */
export function normalizeWord(word: string) {
  return word
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

function tokenizeNormalized(content: string) {
  return tokenizeText(content)
    .map(normalizeWord)
    .filter(Boolean);
}

/**
 * Alinha texto falado ao texto esperado e estima erros de leitura oral.
 * Heurística pedagógica (não substitui avaliação humana).
 */
export function alignReadingToText(
  expectedContent: string,
  spokenTranscript: string,
): AlignmentResult {
  const expected = tokenizeNormalized(expectedContent);
  const spoken = tokenizeNormalized(spokenTranscript);

  if (expected.length === 0) {
    return {
      omissions: 0,
      substitutions: 0,
      hesitations: 0,
      matchedWords: 0,
      expectedWords: 0,
      spokenWords: spoken.length,
    };
  }

  let omissions = 0;
  let substitutions = 0;
  let hesitations = 0;
  let matched = 0;
  let j = 0;

  for (let i = 0; i < expected.length; i++) {
    const target = expected[i];

    if (j >= spoken.length) {
      omissions++;
      continue;
    }

    if (spoken[j] === target) {
      matched++;
      j++;
      continue;
    }

    if (j + 1 < spoken.length && spoken[j + 1] === target) {
      hesitations++;
      j++;
      i--;
      continue;
    }

    if (i + 1 < expected.length && expected[i + 1] === spoken[j]) {
      omissions++;
      continue;
    }

    substitutions++;
    j++;
  }

  hesitations += Math.max(0, spoken.length - j);

  return {
    omissions,
    substitutions,
    hesitations,
    matchedWords: matched,
    expectedWords: expected.length,
    spokenWords: spoken.length,
  };
}
