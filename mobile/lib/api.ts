import { API_URL } from "./config";
import { clearAuthToken, getAuthToken } from "./session";
import type { ReadingErrorCounts } from "@karaoke/shared";

async function authHeaders() {
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

export async function fetchPrivacyStatus() {
  const response = await fetch(`${API_URL}/api/privacy/consent`, {
    headers: await authHeaders(),
  });
  return parseJson<{
    needsPrivacy: boolean;
    hasVoiceConsent: boolean;
  }>(response);
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
  const response = await fetch(`${API_URL}/api/student/me`, {
    headers: await authHeaders(),
  });
  if (response.status === 401) {
    await clearAuthToken();
    throw new Error("AUTH_REQUIRED");
  }
  const data = await parseJson<{ student: StudentProfile | null }>(response);
  return data.student;
}

export async function fetchTexts() {
  const response = await fetch(`${API_URL}/api/texts`);
  const data = await parseJson<{ texts: ReadingTextSummary[] }>(response);
  return data.texts;
}

export async function fetchText(textId: string) {
  const response = await fetch(`${API_URL}/api/texts/${textId}`);
  const data = await parseJson<{ text: ReadingText }>(response);
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
      metrics: ReadingErrorCounts;
      errors: Array<{ word: string; type: string }>;
    };
  }>(response);
}

export async function saveReadingSession(payload: {
  studentId: string;
  textId: string;
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
