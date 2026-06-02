import { GoogleGenAI } from "@google/genai";
import type { TextDifficulty } from "@prisma/client";
import { formatGeminiError } from "@/lib/gemini";
import { TEXT_DIFFICULTIES } from "@/lib/text-utils";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export type GeneratedReadingText = {
  title: string;
  content: string;
  difficulty: TextDifficulty;
  gradeHint: string | null;
};

const DIFFICULTY_SPECS: Record<
  TextDifficulty,
  { words: string; style: string; grade: string }
> = {
  INICIANTE: {
    words: "entre 50 e 80 palavras",
    style:
      "frases curtas (5 a 8 palavras), vocabulário simples e concreto, sem termos técnicos",
    grade: "1º ou 2º ano",
  },
  INTERMEDIARIO: {
    words: "entre 90 e 130 palavras",
    style:
      "frases médias, alguns conectivos (porque, mas, então), vocabulário acessível",
    grade: "3º ao 5º ano",
  },
  AVANCADO: {
    words: "entre 130 e 200 palavras",
    style:
      "períodos compostos, vocabulário mais rico, mantendo clareza para leitura em voz alta",
    grade: "6º ano ou mais",
  },
};

function buildJsonPrompt(extra: string): string {
  return `${extra}

Retorne APENAS um JSON válido (sem markdown) neste formato:
{
  "title": "título curto e atrativo",
  "content": "texto corrido em português do Brasil, apenas parágrafos simples separados por espaço (sem listas nem títulos no corpo)",
  "difficulty": "INICIANTE" | "INTERMEDIARIO" | "AVANCADO",
  "gradeHint": "ex: 3-4 ou null"
}

Regras gerais:
- Conteúdo adequado para crianças em contexto escolar.
- Sem emojis, hashtags ou formatação markdown.
- O campo content deve ser texto puro para leitura em voz alta.`;
}

function parseGeneratedJson(raw: string): GeneratedReadingText {
  const parsed = JSON.parse(raw) as {
    title?: string;
    content?: string;
    difficulty?: string;
    gradeHint?: string | null;
  };

  const title = parsed.title?.trim();
  const content = parsed.content?.trim();
  const difficulty = parsed.difficulty as TextDifficulty;

  if (!title || !content) {
    throw new Error("O Gemini não retornou título ou conteúdo válidos.");
  }
  if (!TEXT_DIFFICULTIES.includes(difficulty)) {
    throw new Error("Dificuldade gerada inválida.");
  }

  return {
    title,
    content,
    difficulty,
    gradeHint: parsed.gradeHint?.trim() || null,
  };
}

async function callGemini(prompt: string): Promise<GeneratedReadingText> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY não configurada no servidor.");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Gemini retornou uma resposta vazia.");
    }
    return parseGeneratedJson(resultText);
  } catch (error) {
    console.error("Erro ao gerar texto com Gemini:", error);
    throw new Error(formatGeminiError(error));
  }
}

/** Gera texto a partir de tema + nível explícitos. */
export async function generateReadingText(
  topic: string,
  difficulty: TextDifficulty,
): Promise<GeneratedReadingText> {
  const spec = DIFFICULTY_SPECS[difficulty];
  const prompt = buildJsonPrompt(`Você cria textos curtos para prática de leitura em voz alta no ensino fundamental brasileiro.

Tema: ${topic}
Nível: ${difficulty}
Tamanho: ${spec.words}
Estilo: ${spec.style}
Série sugerida: ${spec.grade}`);

  return callGemini(prompt);
}

/**
 * Interpreta um pedido em linguagem natural (ex.: "texto sobre peixes amazônicos, nível iniciante").
 */
export async function generateReadingTextFromPrompt(
  userPrompt: string,
): Promise<GeneratedReadingText> {
  const prompt = buildJsonPrompt(`Você cria textos curtos para prática de leitura em voz alta no ensino fundamental brasileiro.

Pedido do professor:
"${userPrompt}"

Interprete o pedido: extraia o tema e o nível (iniciante → INICIANTE, intermediário → INTERMEDIARIO, avançado → AVANCADO).
Se o nível não estiver claro, use INICIANTE.
Ajuste tamanho e complexidade ao nível:
- INICIANTE: ${DIFFICULTY_SPECS.INICIANTE.words}, ${DIFFICULTY_SPECS.INICIANTE.style}
- INTERMEDIARIO: ${DIFFICULTY_SPECS.INTERMEDIARIO.words}, ${DIFFICULTY_SPECS.INTERMEDIARIO.style}
- AVANCADO: ${DIFFICULTY_SPECS.AVANCADO.words}, ${DIFFICULTY_SPECS.AVANCADO.style}`);

  return callGemini(prompt);
}
