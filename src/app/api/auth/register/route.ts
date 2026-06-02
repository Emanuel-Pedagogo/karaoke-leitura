import {
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth";
import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import { prisma } from "@/lib/prisma";
import { registerUser } from "@/lib/register-user";

export async function OPTIONS() {
  return optionsWithCors();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { role, name, email, password, classCode, schoolName, className } =
      body;

    const result = await registerUser({
      role,
      name,
      email,
      password,
      classCode,
      schoolName,
      className,
    });

    const user = await prisma.user.findUnique({
      where: { id: result.userId },
      include: { student: true, teacher: true },
    });

    if (!user) {
      return jsonWithCors({ error: "Erro ao criar conta" }, { status: 500 });
    }

    const token = await createSessionToken({
      userId: user.id,
      role: user.role,
      studentId: user.student?.id,
      teacherId: user.teacher?.id,
    });

    const response = jsonWithCors({
      ok: true,
      role: result.role,
      name: result.name,
      token,
      classCode: result.classCode,
      className: result.className,
    });
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Erro ao criar conta";
    const status = message.includes("já está cadastrado") ? 409 : 400;
    return jsonWithCors({ error: message }, { status });
  }
}
