import * as FileSystem from "expo-file-system";
import { getPendingSessions, removePendingSession } from "./db";
import { evaluateAudioWithGemini, saveReadingSession } from "./api";
import { calculateSessionMetrics } from "@karaoke/shared";
import { fetchText, fetchStudentProfile } from "./api";
import { isDeviceOffline } from "./network";

let isSyncing = false;

export async function syncPendingSessions() {
  if (isSyncing) return;
  
  if (await isDeviceOffline()) return;

  isSyncing = true;
  try {
    const sessions = await getPendingSessions();
    if (sessions.length === 0) {
      isSyncing = false;
      return;
    }

    const student = await fetchStudentProfile();
    if (!student) {
      isSyncing = false;
      return;
    }

    for (const session of sessions) {
      try {
        // Check if file still exists
        const fileInfo = await FileSystem.getInfoAsync(session.audioUri);
        if (!fileInfo.exists) {
          console.warn('Audio file missing for session', session.id);
          await removePendingSession(session.id);
          continue;
        }

        // Evaluate with Gemini
        const result = await evaluateAudioWithGemini(session.audioUri, session.textId);
        
        if (result.success && result.evaluation) {
          const ev = result.evaluation;
          const text = await fetchText(session.textId);
          
          const counts = {
            omissions: ev.metrics?.omissions ?? 0,
            substitutions: ev.metrics?.substitutions ?? 0,
            hesitations: ev.metrics?.hesitations ?? 0,
          };
          
          const metrics = calculateSessionMetrics({
            wordCount: text.wordCount,
            durationSeconds: session.durationSeconds,
            ...counts,
            prosodyScore: ev.scores?.prosody ?? 3,
          });

          await saveReadingSession({
            studentId: student.id,
            textId: session.textId,
            durationSeconds: session.durationSeconds,
            speedMultiplier: session.speedMultiplier,
            ...counts,
            prosodyScore: ev.scores?.prosody ?? 3,
            spokenTranscript: ev.spokenTranscript,
            asrSource: "gemini",
            ...metrics,
          });

          // Cleanup
          await removePendingSession(session.id);
          await FileSystem.deleteAsync(session.audioUri, { idempotent: true });
        }
      } catch (e) {
        console.error('Failed to sync session', session.id, e);
        // We leave it in the DB to try again later, unless it's an unrecoverable error
      }
    }
  } finally {
    isSyncing = false;
  }
}
