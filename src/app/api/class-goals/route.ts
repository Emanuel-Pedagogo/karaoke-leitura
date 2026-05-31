import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function PUT(request: Request) {
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
      classId,
      title,
      targetWeeklyReadings,
      minAccuracyPct,
      minWcpm,
    } = body;

    if (!classId) {
      return Response.json({ error: "Turma obrigatória" }, { status: 400 });
    }

    const goal = await prisma.classGoal.upsert({
      where: { classId },
      create: {
        classId,
        title: title?.trim() ?? "Meta da turma",
        targetWeeklyReadings: Math.max(1, Number(targetWeeklyReadings) || 2),
        minAccuracyPct: minAccuracyPct != null ? Number(minAccuracyPct) : null,
        minWcpm: minWcpm != null && minWcpm !== "" ? Number(minWcpm) : null,
      },
      update: {
        title: title?.trim() ?? "Meta da turma",
        targetWeeklyReadings: Math.max(1, Number(targetWeeklyReadings) || 2),
        minAccuracyPct: minAccuracyPct != null ? Number(minAccuracyPct) : null,
        minWcpm: minWcpm != null && minWcpm !== "" ? Number(minWcpm) : null,
      },
    });

    return Response.json({ goal });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Erro ao salvar meta" }, { status: 500 });
  }
}
