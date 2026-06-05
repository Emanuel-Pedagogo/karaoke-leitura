import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { clearClassCodeCookieOptions } from "@/lib/class-session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  response.cookies.set(clearClassCodeCookieOptions());
  return response;
}
