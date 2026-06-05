import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, sessionCookieOptions } from "@/lib/auth";
import { classCodeCookieOptions } from "@/lib/class-session";
import { rateLimitByRequest } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const limited = rateLimitByRequest(request, "auth:login-class", {
      limit: 20,
      windowMs: 60_000,
    });
    if (limited) return limited;

    const { classCode, studentId } = await request.json();
    if (!classCode || !studentId) {
      return NextResponse.json(
        { error: "Código da turma e aluno são obrigatórios" },
        { status: 400 },
      );
    }

    const turma = await prisma.class.findFirst({
      where: {
        accessCode: String(classCode).trim().toUpperCase(),
      },
    });

    if (!turma) {
      return NextResponse.json(
        { error: "Código da turma inválido" },
        { status: 401 },
      );
    }

    const student = await prisma.studentProfile.findFirst({
      where: { id: studentId, classId: turma.id },
      include: { user: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 401 });
    }

    const token = await createSessionToken({
      userId: student.userId,
      role: "STUDENT",
      studentId: student.id,
    });

    const response = NextResponse.json({
      ok: true,
      role: "STUDENT",
      name: student.user.name,
      token,
    });
    response.cookies.set(sessionCookieOptions(token));
    response.cookies.set(classCodeCookieOptions(String(classCode)));
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao entrar" }, { status: 500 });
  }
}
