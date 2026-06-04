import * as FileSystem from "expo-file-system";
import { addPendingSession } from "./db";

const PENDING_DIR = `${FileSystem.documentDirectory}pending-readings/`;

export async function persistPendingReading(params: {
  uri: string;
  textId: string;
  durationSeconds: number;
  speedMultiplier: number;
}): Promise<void> {
  await FileSystem.makeDirectoryAsync(PENDING_DIR, { intermediates: true });

  const dest = `${PENDING_DIR}session_${Date.now()}.m4a`;
  await FileSystem.copyAsync({ from: params.uri, to: dest });

  await addPendingSession({
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    textId: params.textId,
    audioUri: dest,
    durationSeconds: Math.max(1, params.durationSeconds),
    speedMultiplier: params.speedMultiplier,
    createdAt: Date.now(),
  });
}
