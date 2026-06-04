import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb() {
  if (db) return db;
  db = await SQLite.openDatabaseAsync("karaoke.db");
  await initDb(db);
  return db;
}

async function ensureColumn(
  database: SQLite.SQLiteDatabase,
  table: string,
  column: string,
  definition: string,
) {
  const columns = await database.getAllAsync<{ name: string }>(
    "PRAGMA table_info(" + table + ")",
  );
  if (!columns.some((item: { name: string }) => item.name === column)) {
    await database.execAsync(
      "ALTER TABLE " + table + " ADD COLUMN " + column + " " + definition,
    );
  }
}

async function initDb(database: SQLite.SQLiteDatabase) {
  await database.execAsync(
    "PRAGMA journal_mode = WAL;" +
      "CREATE TABLE IF NOT EXISTS api_cache (" +
      "key TEXT PRIMARY KEY," +
      "value TEXT NOT NULL," +
      "updatedAt INTEGER NOT NULL" +
      ");" +
      "CREATE TABLE IF NOT EXISTS pending_sessions (" +
      "id TEXT PRIMARY KEY," +
      "studentId TEXT," +
      "clientSessionId TEXT," +
      "textId TEXT NOT NULL," +
      "audioUri TEXT NOT NULL," +
      "durationSeconds INTEGER NOT NULL," +
      "speedMultiplier REAL NOT NULL," +
      "evaluatedPayload TEXT," +
      "attemptCount INTEGER NOT NULL DEFAULT 0," +
      "lastError TEXT," +
      "createdAt INTEGER NOT NULL" +
      ");",
  );

  await ensureColumn(database, "pending_sessions", "studentId", "TEXT");
  await ensureColumn(database, "pending_sessions", "clientSessionId", "TEXT");
  await ensureColumn(database, "pending_sessions", "evaluatedPayload", "TEXT");
  await ensureColumn(
    database,
    "pending_sessions",
    "attemptCount",
    "INTEGER NOT NULL DEFAULT 0",
  );
  await ensureColumn(database, "pending_sessions", "lastError", "TEXT");
}

export async function setCache(key: string, value: unknown) {
  try {
    const database = await getDb();
    await database.runAsync(
      "INSERT OR REPLACE INTO api_cache (key, value, updatedAt) VALUES (?, ?, ?)",
      [key, JSON.stringify(value), Date.now()],
    );
  } catch (e) {
    console.warn("Failed to set cache", e);
  }
}

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const database = await getDb();
    const result = await database.getFirstAsync<{ value: string }>(
      "SELECT value FROM api_cache WHERE key = ?",
      [key],
    );
    if (result) {
      return JSON.parse(result.value) as T;
    }
  } catch (e) {
    console.warn("Failed to get cache", e);
  }
  return null;
}

export async function removeCache(key: string) {
  try {
    const database = await getDb();
    await database.runAsync("DELETE FROM api_cache WHERE key = ?", [key]);
  } catch (e) {
    console.warn("Failed to remove cache", e);
  }
}

export async function clearCache() {
  try {
    const database = await getDb();
    await database.runAsync("DELETE FROM api_cache");
  } catch (e) {
    console.warn("Failed to clear cache", e);
  }
}

export type PendingSession = {
  id: string;
  studentId: string | null;
  clientSessionId: string | null;
  textId: string;
  audioUri: string;
  durationSeconds: number;
  speedMultiplier: number;
  evaluatedPayload: string | null;
  attemptCount: number;
  lastError: string | null;
  createdAt: number;
};

export async function addPendingSession(session: PendingSession) {
  const database = await getDb();
  await database.runAsync(
    "INSERT INTO pending_sessions (" +
      "id, studentId, clientSessionId, textId, audioUri, durationSeconds, " +
      "speedMultiplier, evaluatedPayload, attemptCount, lastError, createdAt" +
      ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      session.id,
      session.studentId,
      session.clientSessionId,
      session.textId,
      session.audioUri,
      session.durationSeconds,
      session.speedMultiplier,
      session.evaluatedPayload,
      session.attemptCount,
      session.lastError,
      session.createdAt,
    ],
  );
}

export async function getPendingSessions(): Promise<PendingSession[]> {
  const database = await getDb();
  return await database.getAllAsync<PendingSession>(
    "SELECT * FROM pending_sessions ORDER BY createdAt ASC",
  );
}

export async function markPendingSessionAttempt(id: string, error: string) {
  const database = await getDb();
  await database.runAsync(
    "UPDATE pending_sessions SET attemptCount = attemptCount + 1, lastError = ? WHERE id = ?",
    [error, id],
  );
}

export async function storePendingEvaluation(id: string, evaluatedPayload: unknown) {
  const database = await getDb();
  await database.runAsync(
    "UPDATE pending_sessions SET evaluatedPayload = ?, lastError = NULL WHERE id = ?",
    [JSON.stringify(evaluatedPayload), id],
  );
}

export async function removePendingSession(id: string) {
  const database = await getDb();
  await database.runAsync("DELETE FROM pending_sessions WHERE id = ?", [id]);
}

export async function clearPendingSessions() {
  const database = await getDb();
  await database.runAsync("DELETE FROM pending_sessions");
}
