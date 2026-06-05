import "server-only";

import { cookies } from "next/headers";
import {
  CLASS_CODE_COOKIE,
  normalizeClassCode,
} from "@/lib/class-session-shared";

export { CLASS_CODE_COOKIE, normalizeClassCode };

export async function getClassCodeFromCookies() {
  const cookieStore = await cookies();
  return cookieStore.get(CLASS_CODE_COOKIE)?.value ?? null;
}

export async function hasClassSession() {
  const code = await getClassCodeFromCookies();
  return !!code;
}

export function classCodeCookieOptions(code: string) {
  return {
    name: CLASS_CODE_COOKIE,
    value: normalizeClassCode(code),
    httpOnly: false,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

export function clearClassCodeCookieOptions() {
  return {
    name: CLASS_CODE_COOKIE,
    value: "",
    httpOnly: false,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}
