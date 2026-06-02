import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== "STUDENT" || !session.studentId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { id: session.studentId },
      select: { classId: true },
    });

    if (!student?.classId) {
      return NextResponse.json({ error: "Aluno não pertence a uma turma" }, { status: 400 });
    }

    const students = await prisma.studentProfile.findMany({
      where: { classId: student.classId },
      select: {
        id: true,
        xp: true,
        level: true,
        comboStreak: true,
        user: { select: { name: true } },
      },
      orderBy: [
        { xp: "desc" },
        { comboStreak: "desc" },
      ],
    });

    const ranking = students.map((s, index) => ({
      id: s.id,
      name: s.user.name,
      xp: s.xp,
      level: s.level,
      comboStreak: s.comboStreak,
      position: index + 1,
    }));

    return NextResponse.json({ ranking });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao buscar ranking" },
      { status: 500 }
    );
  }
}
