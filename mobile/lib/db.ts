import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb() {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('karaoke.db');
  await initDb(db);
  return db;
}

async function initDb(database: SQLite.SQLiteDatabase) {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS api_cache (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pending_sessions (
      id TEXT PRIMARY KEY,
      textId TEXT NOT NULL,
      audioUri TEXT NOT NULL,
      durationSeconds INTEGER NOT NULL,
      speedMultiplier REAL NOT NULL,
      createdAt INTEGER NOT NULL
    );
  `);
}

export async function setCache(key: string, value: any) {
  try {
    const database = await getDb();
    await database.runAsync(
      'INSERT OR REPLACE INTO api_cache (key, value, updatedAt) VALUES (?, ?, ?)',
      [key, JSON.stringify(value), Date.now()]
    );
  } catch (e) {
    console.warn('Failed to set cache', e);
  }
}

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const database = await getDb();
    const result = await database.getFirstAsync<{ value: string }>(
      'SELECT value FROM api_cache WHERE key = ?',
      [key]
    );
    if (result) {
      return JSON.parse(result.value) as T;
    }
  } catch (e) {
    console.warn('Failed to get cache', e);
  }
  return null;
}

export async function removeCache(key: string) {
  try {
    const database = await getDb();
    await database.runAsync('DELETE FROM api_cache WHERE key = ?', [key]);
  } catch (e) {
    console.warn('Failed to remove cache', e);
  }
}

export type PendingSession = {
  id: string;
  textId: string;
  audioUri: string;
  durationSeconds: number;
  speedMultiplier: number;
  createdAt: number;
};

export async function addPendingSession(session: PendingSession) {
  const database = await getDb();
  await database.runAsync(
    'INSERT INTO pending_sessions (id, textId, audioUri, durationSeconds, speedMultiplier, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
    [
      session.id,
      session.textId,
      session.audioUri,
      session.durationSeconds,
      session.speedMultiplier,
      session.createdAt,
    ]
  );
}

export async function getPendingSessions(): Promise<PendingSession[]> {
  const database = await getDb();
  return await database.getAllAsync<PendingSession>('SELECT * FROM pending_sessions ORDER BY createdAt ASC');
}

export async function removePendingSession(id: string) {
  const database = await getDb();
  await database.runAsync('DELETE FROM pending_sessions WHERE id = ?', [id]);
}
