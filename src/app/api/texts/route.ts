import { TextDifficulty } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import { countWords, TEXT_DIFFICULTIES } from "@/lib/text-utils";

export async function OPTIONS() {
  return optionsWithCors();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, content, difficulty, gradeHint } = body;

    if (!title?.trim() || !content?.trim()) {
      return jsonWithCors(
        { error: "Título e texto são obrigatórios" },
        { status: 400 },
      );
    }

    if (!TEXT_DIFFICULTIES.includes(difficulty)) {
      return jsonWithCors({ error: "Dificuldade inválida" }, { status: 400 });
    }

    const text = await prisma.readingText.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        difficulty: difficulty as TextDifficulty,
        gradeHint: gradeHint?.trim() || null,
        wordCount: countWords(content),
      },
    });

    return jsonWithCors({ text }, { status: 201 });
  } catch (error) {
    console.error(error);
    return jsonWithCors({ error: "Erro ao criar texto" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const texts = await prisma.readingText.findMany({
      orderBy: { difficulty: "asc" },
      select: {
        id: true,
        title: true,
        difficulty: true,
        gradeHint: true,
        wordCount: true,
      },
    });

    return jsonWithCors({ texts });
  } catch (error) {
    console.error(error);
    return jsonWithCors({ error: "Erro ao buscar textos" }, { status: 500 });
  }
}
