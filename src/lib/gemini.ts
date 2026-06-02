import { GoogleGenAI } from "@google/genai";
import { ReadingErrorCounts } from "@karaoke/shared";

// Garantir que a key esteja disponível (você precisará configurar GEMINI_API_KEY no .env e Vercel)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export type GeminiReadingScores = {
  /** Prosódia: entonação, pausas nos pontos certos, não monotonia */
  prosody: number;
  /** Fluência: ritmo contínuo, poucas interrupções */
  fluency: number;
  /** Expressividade: emoção e ênfase adequadas ao texto */
  expression: number;
  /** Ritmo: velocidade compatível com compreensão */
  pace: number;
  /** Precisão geral da leitura em relação ao gabarito */
  accuracy: number;
};

export type GeminiReadingFeedback = {
  summary: string;
  strengths: string[];
  improvements: string[];
};

export type GeminiEvaluationResult = {
  spokenTranscript: string;
  errors: {
    word: string;
    index: number;
    type: "OMISSAO" | "SUBSTITUICAO" | "HESITACAO";
  }[];
  metrics: ReadingErrorCounts & {
    insertions?: number;
    selfCorrections?: number;
  };
  scores: GeminiReadingScores;
  feedback: GeminiReadingFeedback;
};

function clampScore(value: unknown, fallback = 3): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(5, Math.max(1, Math.round(n)));
}

function normalizeEvaluation(
  parsed: Partial<GeminiEvaluationResult>,
): GeminiEvaluationResult {
  const scores = parsed.scores ?? ({} as Partial<GeminiReadingScores>);
  const feedback = parsed.feedback ?? ({} as Partial<GeminiReadingFeedback>);

  return {
    spokenTranscript: parsed.spokenTranscript?.trim() ?? "",
    errors: Array.isArray(parsed.errors) ? parsed.errors : [],
    metrics: {
      omissions: parsed.metrics?.omissions ?? 0,
      substitutions: parsed.metrics?.substitutions ?? 0,
      hesitations: parsed.metrics?.hesitations ?? 0,
      insertions: parsed.metrics?.insertions ?? 0,
      selfCorrections: parsed.metrics?.selfCorrections ?? 0,
    },
    scores: {
      prosody: clampScore(scores.prosody),
      fluency: clampScore(scores.fluency),
      expression: clampScore(scores.expression),
      pace: clampScore(scores.pace),
      accuracy: clampScore(scores.accuracy),
    },
    feedback: {
      summary:
        feedback.summary?.trim() ||
        "Leitura analisada. Veja os pontos fortes e o que praticar.",
      strengths: Array.isArray(feedback.strengths)
        ? feedback.strengths.filter(Boolean).slice(0, 5)
        : [],
      improvements: Array.isArray(feedback.improvements)
        ? feedback.improvements.filter(Boolean).slice(0, 5)
        : [],
    },
  };
}

/**
 * Envia o áudio gravado e o texto de referência para o Gemini avaliar.
 */
export async function evaluateReadingWithGemini(
  audioBuffer: Buffer,
  mimeType: string,
  referenceText: string
): Promise<GeminiEvaluationResult> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY não configurada no servidor.");
  }

  // O prompt que instrui o Gemini a atuar como um avaliador de fluência de leitura
  const prompt = `
Você é um especialista em avaliação de fluência de leitura em português do Brasil (ensino fundamental).
Ouça o áudio da criança lendo o texto abaixo e compare com o gabarito palavra a palavra.

GABARITO:
"${referenceText}"

Retorne APENAS um JSON válido (sem markdown) nesta estrutura:
{
  "spokenTranscript": "transcrição do que foi falado, incluindo erros e hesitações",
  "errors": [
    { "word": "palavra do gabarito", "index": 0, "type": "OMISSAO" | "SUBSTITUICAO" | "HESITACAO" }
  ],
  "metrics": {
    "omissions": 0,
    "substitutions": 0,
    "hesitations": 0,
    "insertions": 0,
    "selfCorrections": 0
  },
  "scores": {
    "prosody": 1,
    "fluency": 1,
    "expression": 1,
    "pace": 1,
    "accuracy": 1
  },
  "feedback": {
    "summary": "2-3 frases para a criança, tom encorajador",
    "strengths": ["até 3 pontos fortes observados"],
    "improvements": ["até 3 dicas práticas para a próxima leitura"]
  }
}

Regras de erros:
- OMISSAO: pulou palavra do gabarito.
- SUBSTITUICAO: leu palavra errada ou pronúncia que impede compreensão.
- HESITACAO: gagueira, repetição de sílaba ou pausa longa na palavra.
- insertions: palavras extras não presentes no gabarito.
- selfCorrections: errou e corrigiu sozinha em seguida.

Scores (inteiros de 1 a 5):
- prosody: entonação e pausas nos pontuação.
- fluency: leitura contínua, sem travamentos frequentes.
- expression: emoção e ênfase coerentes com o texto.
- pace: velocidade adequada (nem muito rápido nem muito lento).
- accuracy: fidelidade ao texto escrito.

Seja rigoroso nos contadores e generoso no tom do feedback.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: audioBuffer.toString("base64"),
                mimeType: mimeType,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Gemini retornou uma resposta vazia.");
    }

    const parsedResult = JSON.parse(resultText) as Partial<GeminiEvaluationResult>;
    return normalizeEvaluation(parsedResult);
  } catch (error) {
    console.error("Erro ao avaliar com Gemini:", error);
    throw new Error(formatGeminiError(error));
  }
}

/** Concatena mensagem + cause para detectar erros de rede/SSL. */
export function geminiErrorChain(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; depth < 6 && current != null; depth++) {
    if (current instanceof Error) {
      parts.push(current.message);
      const code = (current as NodeJS.ErrnoException).code;
      if (code) parts.push(code);
      current = current.cause;
    } else {
      parts.push(String(current));
      break;
    }
  }
  return parts.join(" ");
}

/** Mensagem amigável para o app (evita JSON cru na tela). */
export function formatGeminiError(error: unknown): string {
  const raw = geminiErrorChain(error);

  if (
    raw.includes("API_KEY_INVALID") ||
    raw.includes("API key not valid") ||
    raw.includes("GEMINI_API_KEY não configurada")
  ) {
    return "Chave do Gemini inválida ou ausente no servidor. Configure GEMINI_API_KEY no .env (local) ou na Vercel e faça redeploy.";
  }

  if (
    raw.includes("UNABLE_TO_VERIFY") ||
    raw.includes("unable to verify the first certificate") ||
    raw.includes("CERT_")
  ) {
    return (
      "Falha de certificado SSL ao conectar ao Gemini (comum no Windows). " +
      "Pare o servidor (Ctrl+C) e rode de novo: npm run dev. " +
      "O script já usa --use-system-ca. Se ainda falhar, defina NODE_OPTIONS=--use-system-ca no terminal antes de npm run dev."
    );
  }

  if (raw.includes("fetch failed") && raw.length < 120) {
    return "Não foi possível conectar à API do Gemini. Verifique internet, GEMINI_API_KEY e reinicie com npm run dev.";
  }

  if (raw.length > 200) {
    return "Erro ao conectar com o Gemini. Verifique GEMINI_API_KEY e a conexão com a internet.";
  }

  return raw.includes("fetch failed")
    ? "Não foi possível conectar à API do Gemini. Verifique GEMINI_API_KEY e reinicie o servidor (npm run dev)."
    : raw;
}
