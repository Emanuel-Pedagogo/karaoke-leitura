import type { UserRole } from "@prisma/client";

export const SESSION_COOKIE = "karaoke_session";

export type SessionPayload = {
  userId: string;
  role: UserRole;
  studentId?: string;
  teacherId?: string;
};

type JwtPayload = SessionPayload & {
  exp: number;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET não configurado no .env");
  }
  return secret;
}

function base64UrlEncodeBytes(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlEncodeText(value: string) {
  return base64UrlEncodeBytes(new TextEncoder().encode(value));
}

function base64UrlDecode(value: string) {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

async function importHmacKey() {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function signHmac(message: string) {
  const key = await importHmacKey();
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return base64UrlEncodeBytes(new Uint8Array(signature));
}

function signaturesMatch(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function createSessionToken(payload: SessionPayload) {
  const jwtPayload: JwtPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
  };
  const header = base64UrlEncodeText(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  );
  const body = base64UrlEncodeText(JSON.stringify(jwtPayload));
  const signature = await signHmac(`${header}.${body}`);
  return `${header}.${body}.${signature}`;
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  const expected = await signHmac(`${header}.${body}`);
  if (!signaturesMatch(signature, expected)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(body)) as JwtPayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now() / 1000) {
      return null;
    }
    if (typeof payload.userId !== "string" || typeof payload.role !== "string") {
      return null;
    }
    return {
      userId: payload.userId,
      role: payload.role,
      studentId: payload.studentId,
      teacherId: payload.teacherId,
    };
  } catch {
    return null;
  }
}
