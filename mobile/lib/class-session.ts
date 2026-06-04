import { API_URL } from "./config";
import { clearCache } from "./db";
import { setAuthToken } from "./session";
import * as SecureStore from "expo-secure-store";

const CLASS_CODE_KEY = "karaoke_class_code";

export type ClassStudent = { id: string; name: string };

export type ClassStudentsResponse = {
  className: string;
  students: ClassStudent[];
};

export async function getClassCode(): Promise<string | null> {
  return SecureStore.getItemAsync(CLASS_CODE_KEY);
}

export async function setClassCode(code: string) {
  await SecureStore.setItemAsync(CLASS_CODE_KEY, code.trim().toUpperCase());
}

export async function clearClassCode() {
  await SecureStore.deleteItemAsync(CLASS_CODE_KEY);
}

export async function hasClassSession(): Promise<boolean> {
  const code = await getClassCode();
  return !!code;
}

export async function fetchClassStudents(
  classCode: string,
): Promise<ClassStudentsResponse> {
  const res = await fetch(
    `${API_URL}/api/auth/class-students?code=${encodeURIComponent(classCode.trim().toUpperCase())}`,
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Turma não encontrada");
  }
  return data as ClassStudentsResponse;
}

/** Troca o aluno ativo sem logout — reutiliza login-class. */
export async function switchToStudent(
  classCode: string,
  studentId: string,
): Promise<{ name: string }> {
  const res = await fetch(`${API_URL}/api/auth/login-class`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      classCode: classCode.trim().toUpperCase(),
      studentId,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.token) {
    throw new Error(data.error ?? "Não foi possível trocar de aluno");
  }
  await setAuthToken(data.token);
  await clearCache();
  return { name: data.name as string };
}
