import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth-session";

const PUBLIC_PATHS = ["/", "/login", "/entrar", "/comecar", "/cadastro", "/privacidade"];

async function getSession(request: NextRequest) {
  const token =
    request.cookies.get(SESSION_COOKIE)?.value ??
    (request.headers.get("authorization")?.startsWith("Bearer ")
      ? request.headers.get("authorization")!.slice(7)
      : null);
  if (!token) return null;
  return await verifySessionToken(token);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const session = await getSession(request);

  if (pathname.startsWith("/aluno")) {
    if (!session || session.role !== "STUDENT" || !session.studentId) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/coordenador")) {
    if (!session || session.role !== "COORDINATOR") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/professor")) {
    if (
      !session ||
      (session.role !== "TEACHER" && session.role !== "COORDINATOR")
    ) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/api/student/me") {
    if (!session || session.role !== "STUDENT" || !session.studentId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (
    (pathname === "/api/sessions" && request.method === "POST") ||
    pathname === "/api/sessions/evaluate" ||
    pathname === "/api/reading/align" ||
    pathname === "/api/reading/transcribe" ||
    pathname === "/api/assistant" ||
    pathname === "/api/texts/suggest" ||
    pathname.startsWith("/api/class-requests/student") ||
    pathname.startsWith("/api/privacy")
  ) {
    if (!session || session.role !== "STUDENT" || !session.studentId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (
    (pathname.startsWith("/api/texts") && request.method !== "GET") ||
    (pathname === "/api/missions" && request.method === "POST") ||
    pathname.startsWith("/api/class-requests/teacher") ||
    (pathname === "/api/class-goals" && request.method === "PUT")
  ) {
    if (
      !session ||
      (session.role !== "TEACHER" && session.role !== "COORDINATOR")
    ) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/aluno/:path*",
    "/professor/:path*",
    "/api/student/me",
    "/api/student/ranking",
    "/api/sessions",
    "/api/sessions/evaluate",
    "/api/reading/align",
    "/api/reading/transcribe",
    "/api/assistant",
    "/api/texts/suggest",
    "/api/texts",
    "/api/texts/:path*",
    "/api/missions",
    "/coordenador/:path*",
    "/api/class-goals",
    "/api/privacy/:path*",
    "/api/class-requests/:path*",
  ],
};
