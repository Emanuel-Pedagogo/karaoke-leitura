import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "E-mail e senha são obrigatórios" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
      include: { student: true, teacher: true },
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos" },
        { status: 401 },
      );
    }

    const token = await createSessionToken({
      userId: user.id,
      role: user.role,
      studentId: user.student?.id,
      teacherId: user.teacher?.id,
    });

    const response = NextResponse.json({
      ok: true,
      role: user.role,
      name: user.name,
      token,
    });
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao entrar" }, { status: 500 });
  }
}
