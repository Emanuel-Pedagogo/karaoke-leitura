import * as FileSystem from "expo-file-system";
import {
  getPendingSessions,
  markPendingSessionAttempt,
  removePendingSession,
  storePendingEvaluation,
} from "./db";
import { evaluateAudioWithGemini, saveReadingSession } from "./api";
import {
  calculateSessionMetrics,
  comboMultiplierFromStreak,
  type ReadingErrorCounts,
} from "@karaoke/shared";
import { fetchText, fetchStudentProfile } from "./api";
import { isDeviceOffline } from "./network";

let isSyncing = false;
let syncAgain = false;

type PendingEvaluation = {
  spokenTranscript?: string;
  metrics?: Partial<ReadingErrorCounts>;
  scores?: { prosody?: number };
};

function parsePendingEvaluation(value: string | null): PendingEvaluation | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as PendingEvaluation;
  } catch {
    return null;
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erro ao sincronizar leitura";
}

export async function syncPendingSessions() {
  if (isSyncing) {
    syncAgain = true;
    return;
  }

  if (await isDeviceOffline()) return;

  isSyncing = true;
  try {
    const sessions = await getPendingSessions();
    if (sessions.length === 0) return;

    const student = await fetchStudentProfile();
    if (!student) return;

    for (const session of sessions) {
      try {
        if (!session.studentId) {
          await markPendingSessionAttempt(
            session.id,
            "Leitura pendente sem aluno identificado. Troque para o aluno correto antes de sincronizar.",
          );
          continue;
        }

        if (session.studentId !== student.id) {
          await markPendingSessionAttempt(
            session.id,
            "Leitura pendente pertence a outro aluno. Troque para o aluno correto antes de sincronizar.",
          );
          continue;
        }

        let evaluation = parsePendingEvaluation(session.evaluatedPayload);

        if (!evaluation) {
          const fileInfo = await FileSystem.getInfoAsync(session.audioUri);
          if (!fileInfo.exists) {
            console.warn("Audio file missing for session", session.id);
            await removePendingSession(session.id);
            continue;
          }

          const result = await evaluateAudioWithGemini(
            session.audioUri,
            session.textId,
          );

          if (!result.success || !result.evaluation) {
            await markPendingSessionAttempt(
              session.id,
              "A avaliação por IA não retornou resultado.",
            );
            continue;
          }

          evaluation = result.evaluation;
          await storePendingEvaluation(session.id, evaluation);
        }

        const text = await fetchText(session.textId);
        const counts = {
          omissions: evaluation.metrics?.omissions ?? 0,
          substitutions: evaluation.metrics?.substitutions ?? 0,
          hesitations: evaluation.metrics?.hesitations ?? 0,
        };

        const metrics = calculateSessionMetrics({
          wordCount: text.wordCount,
          durationSeconds: session.durationSeconds,
          ...counts,
          prosodyScore: evaluation.scores?.prosody ?? 3,
          comboMultiplier: comboMultiplierFromStreak(student.comboStreak),
        });

        await saveReadingSession({
          studentId: student.id,
          clientSessionId: session.clientSessionId ?? session.id,
          textId: session.textId,
          durationSeconds: session.durationSeconds,
          speedMultiplier: session.speedMultiplier,
          ...counts,
          prosodyScore: evaluation.scores?.prosody ?? 3,
          spokenTranscript: evaluation.spokenTranscript,
          asrSource: "gemini",
          ...metrics,
        });

        await removePendingSession(session.id);
        await FileSystem.deleteAsync(session.audioUri, { idempotent: true });
      } catch (e) {
        console.error("Failed to sync session", session.id, e);
        await markPendingSessionAttempt(session.id, errorMessage(e));
      }
    }
  } finally {
    isSyncing = false;
    if (syncAgain) {
      syncAgain = false;
      await syncPendingSessions();
    }
  }
}
