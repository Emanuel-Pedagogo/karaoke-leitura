import { TextDifficulty } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import { getSessionFromRequest } from "@/lib/auth";
import { countWords, TEXT_DIFFICULTIES } from "@/lib/text-utils";

export async function OPTIONS() {
  return optionsWithCors();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const text = await prisma.readingText.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        difficulty: true,
        gradeHint: true,
        wordCount: true,
      },
    });

    if (!text) {
      return jsonWithCors({ error: "Texto não encontrado" }, { status: 404 });
    }

    return jsonWithCors({ text });
  } catch (error) {
    console.error(error);
    return jsonWithCors({ error: "Erro ao buscar texto" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionFromRequest(request);
    if (
      !session ||
      (session.role !== "TEACHER" && session.role !== "COORDINATOR")
    ) {
      return jsonWithCors({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
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

    const text = await prisma.readingText.update({
      where: { id },
      data: {
        title: title.trim(),
        content: content.trim(),
        difficulty: difficulty as TextDifficulty,
        gradeHint: gradeHint?.trim() || null,
        wordCount: countWords(content),
      },
    });

    return jsonWithCors({ text });
  } catch (error) {
    console.error(error);
    return jsonWithCors({ error: "Erro ao atualizar texto" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionFromRequest(request);
    if (
      !session ||
      (session.role !== "TEACHER" && session.role !== "COORDINATOR")
    ) {
      return jsonWithCors({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.readingText.delete({ where: { id } });
    return jsonWithCors({ ok: true });
  } catch (error) {
    console.error(error);
    return jsonWithCors({ error: "Erro ao excluir texto" }, { status: 500 });
  }
}
