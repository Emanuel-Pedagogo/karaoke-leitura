import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

async function resolveTeacherId(session: {
  userId: string;
  teacherId?: string;
}) {
  if (session.teacherId) return session.teacherId;
  const teacher = await prisma.teacherProfile.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });
  return teacher?.id ?? null;
}

export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== "TEACHER") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const teacherId = await resolveTeacherId(session);
    if (!teacherId) {
      return NextResponse.json({ error: "Perfil de professor não encontrado" }, { status: 401 });
    }

    const classes = await prisma.class.findMany({
      where: { teacherId },
      select: { id: true },
    });
    const classIds = classes.map((c) => c.id);

    const requests = await prisma.classJoinRequest.findMany({
      where: {
        classId: { in: classIds },
        status: "PENDING",
      },
      include: {
        student: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
        class: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao buscar solicitações" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== "TEACHER") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const teacherId = await resolveTeacherId(session);
    if (!teacherId) {
      return NextResponse.json({ error: "Perfil de professor não encontrado" }, { status: 401 });
    }

    const { requestId, action } = await request.json();
    if (!requestId || !["ACCEPT", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const joinRequest = await prisma.classJoinRequest.findUnique({
      where: { id: requestId },
      include: { class: true },
    });

    if (!joinRequest || joinRequest.class.teacherId !== teacherId) {
      return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });
    }

    if (joinRequest.status !== "PENDING" || joinRequest.type !== "CODE_JOIN") {
      return NextResponse.json({ error: "Solicitação inválida para esta ação" }, { status: 400 });
    }

    const newStatus = action === "ACCEPT" ? "APPROVED" : "REJECTED";

    const updatedRequest = await prisma.classJoinRequest.update({
      where: { id: requestId },
      data: { status: newStatus },
    });

    if (newStatus === "APPROVED") {
      await prisma.studentProfile.update({
        where: { id: joinRequest.studentId },
        data: { classId: joinRequest.classId },
      });
    }

    return NextResponse.json({ request: updatedRequest });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao atualizar solicitação" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== "TEACHER") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const teacherId = await resolveTeacherId(session);
    if (!teacherId) {
      return NextResponse.json({ error: "Perfil de professor não encontrado" }, { status: 401 });
    }

    const { email, classId } = await request.json();
    if (!email || !classId) {
      return NextResponse.json({ error: "Email e Turma são obrigatórios" }, { status: 400 });
    }

    const targetClass = await prisma.class.findFirst({
      where: { id: classId, teacherId },
    });

    if (!targetClass) {
      return NextResponse.json({ error: "Turma não encontrada" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { student: true },
    });

    if (!user || user.role !== "STUDENT" || !user.student) {
      return NextResponse.json({ error: "Aluno não encontrado com este e-mail" }, { status: 404 });
    }

    if (user.student.classId === targetClass.id) {
      return NextResponse.json({ error: "O aluno já está nesta turma" }, { status: 400 });
    }

    const existingRequest = await prisma.classJoinRequest.findFirst({
      where: {
        studentId: user.student.id,
        classId: targetClass.id,
        status: "PENDING",
      },
    });

    if (existingRequest) {
      return NextResponse.json({ error: "Já existe uma solicitação ou convite pendente para este aluno" }, { status: 400 });
    }

    const joinRequest = await prisma.classJoinRequest.upsert({
      where: {
        studentId_classId: {
          studentId: user.student.id,
          classId: targetClass.id,
        },
      },
      update: {
        status: "PENDING",
        type: "TEACHER_INVITE",
      },
      create: {
        studentId: user.student.id,
        classId: targetClass.id,
        type: "TEACHER_INVITE",
        status: "PENDING",
      },
    });

    return NextResponse.json({ request: joinRequest, studentName: user.name });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao enviar convite" },
      { status: 500 }
    );
  }
}
