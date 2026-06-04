import { API_URL } from "./config";
import { getCache, setCache } from "./db";
import { isDeviceOffline } from "./network";
import { cachePrivacyStatus, type PrivacyStatus } from "./privacy-cache";
import { clearAuthToken, getAuthToken } from "./session";
import type { ReadingErrorCounts } from "@karaoke/shared";

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T;
  if (!response.ok) {
    if (response.status === 401) {
      await clearAuthToken();
      throw new Error("AUTH_REQUIRED");
    }
    const message =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Erro ao comunicar com o servidor";
    throw new Error(message);
  }
  return data;
}

export type StudentProfile = {
  id: string;
  name: string;
  className: string;
  xp: number;
  level: number;
  comboStreak: number;
  xpProgress: {
    current: number;
    needed: number;
    percent: number;
  };
  recentSessions: Array<{
    id: string;
    textTitle: string;
    accuracyPct: number | null;
    wcpm: number | null;
    startedAt: string;
  }>;
};

export type ReadingTextSummary = {
  id: string;
  title: string;
  difficulty: string;
  gradeHint: string | null;
  wordCount: number;
};

export type ReadingText = ReadingTextSummary & {
  content: string;
};

export async function fetchPrivacyStatus(): Promise<PrivacyStatus> {
  if (await isDeviceOffline()) {
    const cached = await getCache<PrivacyStatus>("privacyStatus");
    if (cached) return cached;
    throw new Error(
      "Você está offline. Abra o app com internet uma vez antes de usar sem conexão.",
    );
  }

  const response = await fetch(`${API_URL}/api/privacy/consent`, {
    headers: await authHeaders(),
  });
  const data = await parseJson<PrivacyStatus>(response);
  await cachePrivacyStatus(data);
  return data;
}

export async function eraseVoiceData() {
  const response = await fetch(`${API_URL}/api/privacy/erase-voice-data`, {
    method: "POST",
    headers: await authHeaders(),
  });
  return parseJson<{ ok: boolean; message?: string }>(response);
}

export async function deleteAccount() {
  const response = await fetch(`${API_URL}/api/account`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(await authHeaders()),
    },
    body: JSON.stringify({ confirm: "ENCERRAR" }),
  });
  return parseJson<{ ok: boolean; message?: string }>(response);
}

export async function submitPrivacyConsent(payload: {
  acceptPrivacy: boolean;
  acceptVoice: boolean;
  guardianConfirmed: boolean;
}) {
  const response = await fetch(`${API_URL}/api/privacy/consent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await authHeaders()),
    },
    body: JSON.stringify(payload),
  });
  return parseJson(response);
}

export async function fetchStudentProfile() {
  if (await isDeviceOffline()) {
    const cached = await getCache<{ student: StudentProfile | null }>("studentProfile");
    if (cached) return cached.student;
    throw new Error("Você está offline e não há dados salvos. Conecte-se à internet.");
  }

  const response = await fetch(`${API_URL}/api/student/me`, {
    headers: await authHeaders(),
  });
  if (response.status === 401) {
    await clearAuthToken();
    throw new Error("AUTH_REQUIRED");
  }
  const data = await parseJson<{ student: StudentProfile | null }>(response);
  await setCache("studentProfile", data);
  return data.student;
}

export async function fetchTexts() {
  if (await isDeviceOffline()) {
    const cached = await getCache<{ texts: ReadingTextSummary[] }>("texts");
    if (cached) return cached.texts;
    throw new Error("Você está offline e não há textos salvos. Conecte-se à internet.");
  }

  const response = await fetch(`${API_URL}/api/texts`);
  const data = await parseJson<{ texts: ReadingTextSummary[] }>(response);
  await setCache("texts", data);
  return data.texts;
}

export async function fetchText(textId: string) {
  const cacheKey = `text_${textId}`;
  if (await isDeviceOffline()) {
    const cached = await getCache<{ text: ReadingText }>(cacheKey);
    if (cached) return cached.text;
    throw new Error("Você está offline e este texto não está salvo. Conecte-se à internet.");
  }

  const response = await fetch(`${API_URL}/api/texts/${textId}`);
  const data = await parseJson<{ text: ReadingText }>(response);
  await setCache(cacheKey, data);
  return data.text;
}

export async function registerAccount(payload: {
  role: "STUDENT" | "TEACHER";
  name: string;
  email: string;
  password: string;
  classCode?: string;
  schoolName?: string;
  className?: string;
}) {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<{
    ok: boolean;
    role: string;
    name: string;
    token: string;
    classCode?: string;
    className?: string;
    error?: string;
  }>(response);
}

export async function alignReading(textId: string, transcript: string) {
  const response = await fetch(`${API_URL}/api/reading/align`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await authHeaders()),
    },
    body: JSON.stringify({ textId, transcript }),
  });
  return parseJson<{
    alignment: {
      omissions: number;
      substitutions: number;
      hesitations: number;
    };
    disclaimer: string;
  }>(response);
}

export async function transcribeAudio(uri: string) {
  const form = new FormData();
  form.append("audio", {
    uri,
    name: "leitura.m4a",
    type: "audio/m4a",
  } as unknown as Blob);

  const response = await fetch(`${API_URL}/api/reading/transcribe`, {
    method: "POST",
    headers: await authHeaders(),
    body: form,
  });
  return parseJson<{ transcript: string; provider: string }>(response);
}

export async function evaluateAudioWithGemini(uri: string, textId: string) {
  const form = new FormData();
  form.append("audio", {
    uri,
    name: "leitura.m4a",
    type: "audio/m4a",
  } as unknown as Blob);
  form.append("textId", textId);

  const response = await fetch(`${API_URL}/api/sessions/evaluate`, {
    method: "POST",
    headers: await authHeaders(),
    body: form,
  });

  return parseJson<{
    success: boolean;
    evaluation: {
      spokenTranscript: string;
      metrics: ReadingErrorCounts & {
        insertions?: number;
        selfCorrections?: number;
      };
      scores: {
        prosody: number;
        fluency: number;
        expression: number;
        pace: number;
        accuracy: number;
      };
      feedback: {
        summary: string;
        strengths: string[];
        improvements: string[];
      };
      errors: Array<{ word: string; type: string }>;
    };
  }>(response);
}

export type ClassJoinRequest = {
  id: string;
  class: {
    name: string;
    school: { name: string };
  };
  type: "CODE_JOIN" | "TEACHER_INVITE";
  status: "PENDING" | "APPROVED" | "REJECTED";
};

export async function fetchStudentClassRequests() {
  if (await isDeviceOffline()) {
    const cached = await getCache<{ requests: ClassJoinRequest[] }>("classRequests");
    if (cached) return cached.requests;
    return [];
  }

  const response = await fetch(`${API_URL}/api/class-requests/student`, {
    headers: await authHeaders(),
  });
  const data = await parseJson<{ requests: ClassJoinRequest[] }>(response);
  await setCache("classRequests", data);
  return data.requests ?? [];
}

export async function requestJoinClass(classCode: string) {
  const response = await fetch(`${API_URL}/api/class-requests/student`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await authHeaders()),
    },
    body: JSON.stringify({ classCode }),
  });
  return parseJson<{ request: ClassJoinRequest }>(response);
}

export async function respondToInvite(requestId: string, action: "ACCEPT" | "REJECT") {
  const response = await fetch(`${API_URL}/api/class-requests/student`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(await authHeaders()),
    },
    body: JSON.stringify({ requestId, action }),
  });
  return parseJson<{ request: ClassJoinRequest }>(response);
}

export type RankingStudent = {
  id: string;
  name: string;
  xp: number;
  level: number;
  comboStreak: number;
  position: number;
};

export async function fetchClassRanking() {
  if (await isDeviceOffline()) {
    const cached = await getCache<{ ranking: RankingStudent[] }>("classRanking");
    if (cached) return cached.ranking;
    throw new Error("Você está offline e não há ranking salvo. Conecte-se à internet.");
  }

  const response = await fetch(`${API_URL}/api/student/ranking`, {
    headers: await authHeaders(),
  });
  const data = await parseJson<{ ranking: RankingStudent[] }>(response);
  await setCache("classRanking", data);
  return data.ranking;
}

/** Baixa o conteúdo completo dos textos para leitura offline. */
export async function prefetchTextsForOffline(texts: ReadingTextSummary[]) {
  if (await isDeviceOffline()) return;
  await Promise.all(
    texts.slice(0, 15).map((item) => fetchText(item.id).catch(() => null)),
  );
}

export async function saveReadingSession(payload: {
  studentId: string;
  textId: string;
  clientSessionId?: string;
  durationSeconds: number;
  speedMultiplier: number;
  omissions: number;
  substitutions: number;
  hesitations: number;
  prosodyScore: number;
  accuracyPct: number;
  wcpm: number;
  score: number;
  xpEarned: number;
  spokenTranscript?: string;
  asrSource?: string;
}) {
  const response = await fetch(`${API_URL}/api/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await authHeaders()),
    },
    body: JSON.stringify(payload),
  });
  return parseJson(response);
}
