import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { getTeacherClass } from "@/lib/teacher-class";

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (
    !session ||
    (session.role !== "TEACHER" && session.role !== "COORDINATOR")
  ) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      title,
      description,
      targetCount,
      minAccuracy,
      xpReward,
      activeUntil,
    } = body;

    if (!title?.trim() || !description?.trim()) {
      return Response.json(
        { error: "Título e descrição são obrigatórios" },
        { status: 400 },
      );
    }

    const turma = await getTeacherClass(session.userId);
    if (!turma) {
      return Response.json({ error: "Nenhuma turma cadastrada" }, { status: 400 });
    }

    const mission = await prisma.mission.create({
      data: {
        classId: turma.id,
        title: title.trim(),
        description: description.trim(),
        targetCount: Math.max(1, Number(targetCount) || 1),
        minAccuracy: minAccuracy != null ? Number(minAccuracy) : null,
        xpReward: Math.max(1, Number(xpReward) || 50),
        activeUntil: activeUntil ? new Date(activeUntil) : null,
      },
    });

    return Response.json({ mission }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Erro ao criar missão" }, { status: 500 });
  }
}
