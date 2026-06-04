import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimitByRequest } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const limited = rateLimitByRequest(request, "auth:class-students", {
    limit: 20,
    windowMs: 60_000,
  });
  if (limited) return limited;

  const code = new URL(request.url).searchParams.get("code")?.trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ error: "Informe o código da turma" }, { status: 400 });
  }

  const turma = await prisma.class.findFirst({
    where: { accessCode: code },
    include: {
      students: {
        include: { user: true },
        orderBy: { user: { name: "asc" } },
      },
    },
  });

  if (!turma) {
    return NextResponse.json({ error: "Turma não encontrada" }, { status: 404 });
  }

  return NextResponse.json({
    className: turma.name,
    students: turma.students.map((s) => ({
      id: s.id,
      name: s.user.name,
    })),
  });
}
