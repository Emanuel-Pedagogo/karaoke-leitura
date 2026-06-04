import * as FileSystem from "expo-file-system";
import { addPendingSession, clearPendingSessions } from "./db";

const PENDING_DIR = FileSystem.documentDirectory + "pending-readings/";

export function createClientSessionId() {
  return Date.now() + "_" + Math.random().toString(36).slice(2, 12);
}

export async function persistPendingReading(params: {
  uri: string;
  studentId?: string;
  clientSessionId?: string;
  textId: string;
  durationSeconds: number;
  speedMultiplier: number;
  evaluatedPayload?: unknown;
}): Promise<string> {
  await FileSystem.makeDirectoryAsync(PENDING_DIR, { intermediates: true });

  const clientSessionId = params.clientSessionId ?? createClientSessionId();
  const dest = PENDING_DIR + "session_" + clientSessionId + ".m4a";
  await FileSystem.copyAsync({ from: params.uri, to: dest });

  await addPendingSession({
    id: clientSessionId,
    studentId: params.studentId ?? null,
    clientSessionId,
    textId: params.textId,
    audioUri: dest,
    durationSeconds: Math.max(1, params.durationSeconds),
    speedMultiplier: params.speedMultiplier,
    evaluatedPayload: params.evaluatedPayload
      ? JSON.stringify(params.evaluatedPayload)
      : null,
    attemptCount: 0,
    lastError: null,
    createdAt: Date.now(),
  });

  return clientSessionId;
}

export async function clearPendingReadings() {
  await clearPendingSessions();
  await FileSystem.deleteAsync(PENDING_DIR, { idempotent: true });
}
