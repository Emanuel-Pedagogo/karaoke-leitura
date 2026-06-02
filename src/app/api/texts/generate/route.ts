import { TextDifficulty } from "@prisma/client";
import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import { getSessionFromRequest } from "@/lib/auth";
import {
  generateReadingText,
  generateReadingTextFromPrompt,
} from "@/lib/gemini-text";
import { countWords, TEXT_DIFFICULTIES } from "@/lib/text-utils";

export async function OPTIONS() {
  return optionsWithCors();
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (
      !session ||
      (session.role !== "TEACHER" && session.role !== "COORDINATOR")
    ) {
      return jsonWithCors({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const prompt =
      typeof body.prompt === "string" ? body.prompt.trim() : "";
    const topic = typeof body.topic === "string" ? body.topic.trim() : "";
    const difficulty = body.difficulty as TextDifficulty | undefined;

    let draft;
    if (prompt) {
      draft = await generateReadingTextFromPrompt(prompt);
    } else if (topic && difficulty) {
      if (!TEXT_DIFFICULTIES.includes(difficulty)) {
        return jsonWithCors({ error: "Dificuldade inválida" }, { status: 400 });
      }
      draft = await generateReadingText(topic, difficulty);
    } else {
      return jsonWithCors(
        {
          error:
            'Informe um pedido em texto livre (ex.: "texto sobre peixes amazônicos, nível iniciante") ou tema + dificuldade.',
        },
        { status: 400 },
      );
    }

    return jsonWithCors({
      draft: {
        ...draft,
        wordCount: countWords(draft.content),
      },
    });
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Erro ao gerar texto";
    return jsonWithCors({ error: message }, { status: 500 });
  }
}
