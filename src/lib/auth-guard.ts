import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { getSessionFromCookies, type SessionPayload } from "@/lib/auth";

export async function requireSession(roles?: UserRole[]) {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect("/login");
  }
  if (roles && !roles.includes(session.role)) {
    redirect("/login");
  }
  return session;
}

export async function requireStudentSession() {
  const session = await requireSession(["STUDENT"]);
  if (!session.studentId) {
    redirect("/login");
  }
  return session as SessionPayload & { studentId: string };
}

export async function requireTeacherSession() {
  return requireSession(["TEACHER", "COORDINATOR"]);
}

export async function requireCoordinatorSession() {
  return requireSession(["COORDINATOR"]);
}
