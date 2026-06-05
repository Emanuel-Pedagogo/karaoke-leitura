import { CLASS_CODE_COOKIE, normalizeClassCode } from "@/lib/class-session";

export function getClassCodeClient(): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${CLASS_CODE_COOKIE}=`;
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  if (!match) return null;
  const value = match.slice(prefix.length);
  return value ? decodeURIComponent(value) : null;
}

export function hasClassSessionClient() {
  return !!getClassCodeClient();
}

export async function switchToStudent(classCode: string, studentId: string) {
  const res = await fetch("/api/auth/login-class", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      classCode: normalizeClassCode(classCode),
      studentId,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.name) {
    throw new Error(data.error ?? "Não foi possível trocar de aluno");
  }
  return { name: data.name as string };
}
