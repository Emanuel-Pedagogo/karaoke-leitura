import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

async function canManageClass(session: NonNullable<Awaited<ReturnType<typeof getSessionFromRequest>>>, classId: string) {
  if (session.role === "TEACHER") {
    if (!session.teacherId) return false;
    const ownedClass = await prisma.class.findFirst({
      where: { id: classId, teacherId: session.teacherId },
      select: { id: true },
    });
    return Boolean(ownedClass);
  }

  if (session.role === "COORDINATOR") {
    const coordinatedClass = await prisma.class.findFirst({
      where: {
        id: classId,
        school: {
          coordinators: {
            some: { userId: session.userId },
          },
        },
      },
      select: { id: true },
    });
    return Boolean(coordinatedClass);
  }

  return false;
}

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

    if (!(await canManageClass(session, classId))) {
      return Response.json({ error: "Turma não autorizada" }, { status: 403 });
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
