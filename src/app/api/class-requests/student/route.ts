import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== "STUDENT" || !session.studentId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const requests = await prisma.classJoinRequest.findMany({
      where: {
        studentId: session.studentId,
        status: "PENDING",
      },
      include: {
        class: {
          include: {
            school: true,
          },
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

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== "STUDENT" || !session.studentId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { classCode } = await request.json();
    if (!classCode) {
      return NextResponse.json({ error: "Código da turma é obrigatório" }, { status: 400 });
    }

    const targetClass = await prisma.class.findFirst({
      where: { accessCode: classCode.trim().toUpperCase() },
    });

    if (!targetClass) {
      return NextResponse.json({ error: "Código da turma inválido" }, { status: 404 });
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { id: session.studentId },
    });

    if (studentProfile?.classId === targetClass.id) {
      return NextResponse.json({ error: "Você já está nesta turma" }, { status: 400 });
    }

    const existingRequest = await prisma.classJoinRequest.findFirst({
      where: {
        studentId: session.studentId,
        classId: targetClass.id,
        status: "PENDING",
      },
    });

    if (existingRequest) {
      return NextResponse.json({ error: "Você já possui uma solicitação pendente para esta turma" }, { status: 400 });
    }

    const joinRequest = await prisma.classJoinRequest.upsert({
      where: {
        studentId_classId: {
          studentId: session.studentId,
          classId: targetClass.id,
        },
      },
      update: {
        status: "PENDING",
        type: "CODE_JOIN",
      },
      create: {
        studentId: session.studentId,
        classId: targetClass.id,
        type: "CODE_JOIN",
        status: "PENDING",
      },
    });

    return NextResponse.json({ request: joinRequest });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao criar solicitação" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== "STUDENT" || !session.studentId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { requestId, action } = await request.json();
    if (!requestId || !["ACCEPT", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const joinRequest = await prisma.classJoinRequest.findUnique({
      where: { id: requestId },
    });

    if (!joinRequest || joinRequest.studentId !== session.studentId) {
      return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });
    }

    if (joinRequest.status !== "PENDING" || joinRequest.type !== "TEACHER_INVITE") {
      return NextResponse.json({ error: "Solicitação inválida para esta ação" }, { status: 400 });
    }

    const newStatus = action === "ACCEPT" ? "APPROVED" : "REJECTED";

    const updatedRequest = await prisma.classJoinRequest.update({
      where: { id: requestId },
      data: { status: newStatus },
    });

    if (newStatus === "APPROVED") {
      await prisma.studentProfile.update({
        where: { id: session.studentId },
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
