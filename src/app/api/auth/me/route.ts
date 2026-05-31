import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookies, getSessionFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  const session =
    (await getSessionFromRequest(request)) ?? (await getSessionFromCookies());
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true },
  });

  return NextResponse.json({
    user,
    studentId: session.studentId,
    teacherId: session.teacherId,
  });
}
