import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import {
  normalizeEmail,
  validateEmail,
  validateName,
} from "@/lib/auth-validators";
import { getStudentIfManageable } from "@/lib/class-auth";
import { moveStudentToIndividualClass } from "@/lib/individual-class";

function requireTeacherOrCoordinator(
  session: Awaited<ReturnType<typeof getSessionFromRequest>>,
) {
  if (
    !session ||
    (session.role !== "TEACHER" && session.role !== "COORDINATOR")
  ) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }
  return null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionFromRequest(request);
  const authError = requireTeacherOrCoordinator(session);
  if (authError) return authError;

  const { id } = await params;
  const student = await getStudentIfManageable(session!, id);
  if (!student) {
    return Response.json({ error: "Aluno não encontrado" }, { status: 404 });
  }

  return Response.json({
    student: {
      id: student.id,
      name: student.user.name,
      email: student.user.email,
      classId: student.classId,
      className: student.class.name,
      xp: student.xp,
      level: student.level,
    },
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionFromRequest(request);
  const authError = requireTeacherOrCoordinator(session);
  if (authError) return authError;

  const { id } = await params;
  const student = await getStudentIfManageable(session!, id);
  if (!student) {
    return Response.json({ error: "Aluno não encontrado" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name : "";
    const email = typeof body.email === "string" ? body.email : "";

    const nameError = validateName(name);
    if (nameError) {
      return Response.json({ error: nameError }, { status: 400 });
    }

    const emailError = validateEmail(email);
    if (emailError) {
      return Response.json({ error: emailError }, { status: 400 });
    }

    const normalizedEmail = normalizeEmail(email);
    const emailTaken = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        NOT: { id: student.user.id },
      },
      select: { id: true },
    });
    if (emailTaken) {
      return Response.json(
        { error: "Este e-mail já está cadastrado" },
        { status: 400 },
      );
    }

    const updated = await prisma.user.update({
      where: { id: student.user.id },
      data: {
        name: name.trim(),
        email: normalizedEmail,
      },
      select: { id: true, name: true, email: true },
    });

    return Response.json({
      student: {
        id: student.id,
        name: updated.name,
        email: updated.email,
        classId: student.classId,
        className: student.class.name,
      },
    });
  } catch (error) {
    console.error("students PUT", error);
    return Response.json({ error: "Erro ao atualizar aluno" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionFromRequest(request);
  const authError = requireTeacherOrCoordinator(session);
  if (authError) return authError;

  const { id } = await params;
  const student = await getStudentIfManageable(session!, id);
  if (!student) {
    return Response.json({ error: "Aluno não encontrado" }, { status: 404 });
  }

  try {
    await moveStudentToIndividualClass(student.id, student.user.name);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("students DELETE", error);
    return Response.json({ error: "Erro ao excluir aluno" }, { status: 500 });
  }
}
