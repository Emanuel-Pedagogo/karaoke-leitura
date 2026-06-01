import { GoogleGenAI } from "@google/genai";
import { ReadingErrorCounts } from "@karaoke/shared";

// Garantir que a key esteja disponível (você precisará configurar GEMINI_API_KEY no .env e Vercel)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export type GeminiEvaluationResult = {
  spokenTranscript: string;
  errors: {
    word: string;
    index: number;
    type: "OMISSAO" | "SUBSTITUICAO" | "HESITACAO";
  }[];
  metrics: ReadingErrorCounts;
};

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
Você é um especialista em avaliação de fluência de leitura infantil.
Ouça o áudio da criança lendo o texto abaixo e compare com o gabarito.

GABARITO:
"${referenceText}"

Sua tarefa é retornar estritamente um objeto JSON com a seguinte estrutura:
{
  "spokenTranscript": "a transcrição exata do que a criança falou, incluindo hesitações e erros",
  "errors": [
    {
      "word": "a palavra do gabarito que a criança errou",
      "index": [posição numérica da palavra no gabarito, começando de 0],
      "type": "OMISSAO" | "SUBSTITUICAO" | "HESITACAO"
    }
  ],
  "metrics": {
    "omissions": [quantidade total de omissões],
    "substitutions": [quantidade total de substituições],
    "hesitations": [quantidade total de hesitações]
  }
}

Regras:
- OMISSAO: A criança pulou a palavra do gabarito.
- SUBSTITUICAO: A criança leu outra palavra no lugar ou errou a pronúncia gravemente.
- HESITACAO: A criança gaguejou, demorou muito para ler a palavra, ou repetiu sílabas ("pa-pa-palavra").
- Retorne APENAS o JSON válido, sem formatação markdown (\`\`\`json) e sem explicações.
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

    const parsedResult = JSON.parse(resultText) as GeminiEvaluationResult;
    return parsedResult;
  } catch (error) {
    console.error("Erro ao avaliar com Gemini:", error);
    throw error;
  }
}
