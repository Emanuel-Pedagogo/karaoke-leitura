import { cookies } from "next/headers";

export const CLASS_CODE_COOKIE = "karaoke_class_code";

export function normalizeClassCode(code: string) {
  return code.trim().toUpperCase();
}

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
