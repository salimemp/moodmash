// Database helper functions
import type { D1Database } from '@cloudflare/workers-types';
import type { User, Session, MoodEntry } from '../types';
import { hash, compare } from 'bcryptjs';

// Session duration: 7 days
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

// Generate secure session token
function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// User operations
export async function createUser(
  db: D1Database,
  email: string,
  password: string,
  name?: string
): Promise<User | null> {
  const passwordHash = await hash(password, 10);
  
  try {
    await db.prepare(
      'INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)'
    ).bind(email.toLowerCase(), name || null, passwordHash).run();
    
    const user = await db.prepare(
      'SELECT id, email, name, password_hash, created_at, updated_at FROM users WHERE email = ?'
    ).bind(email.toLowerCase()).first<User>();
    
    return user || null;
  } catch {
    return null; // Email likely already exists
  }
}

export async function getUserByEmail(db: D1Database, email: string): Promise<User | null> {
  const user = await db.prepare(
    'SELECT id, email, name, password_hash, created_at, updated_at FROM users WHERE email = ?'
  ).bind(email.toLowerCase()).first<User>();
  return user || null;
}

export async function getUserById(db: D1Database, id: number): Promise<User | null> {
  const user = await db.prepare(
    'SELECT id, email, name, password_hash, created_at, updated_at FROM users WHERE id = ?'
  ).bind(id).first<User>();
  return user || null;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return compare(password, hash);
}

// Session operations
export async function createSession(db: D1Database, userId: number): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  
  await db.prepare(
    'INSERT INTO sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)'
  ).bind(userId, token, expiresAt).run();
  
  return token;
}

export async function getSession(db: D1Database, token: string): Promise<Session | null> {
  const session = await db.prepare(
    'SELECT id, user_id, session_token, expires_at, created_at FROM sessions WHERE session_token = ?'
  ).bind(token).first<Session>();
  
  if (!session) return null;
  
  // Check if expired
  if (new Date(session.expires_at) < new Date()) {
    await deleteSession(db, token);
    return null;
  }
  
  return session;
}

export async function deleteSession(db: D1Database, token: string): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE session_token = ?').bind(token).run();
}

export async function deleteUserSessions(db: D1Database, userId: number): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run();
}

// Mood operations
export async function createMood(
  db: D1Database,
  userId: number,
  emotion: string,
  intensity: number,
  notes?: string,
  loggedAt?: string
): Promise<MoodEntry | null> {
  const timestamp = loggedAt || new Date().toISOString();
  
  const result = await db.prepare(
    'INSERT INTO mood_entries (user_id, emotion, intensity, notes, logged_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(userId, emotion, intensity, notes || null, timestamp).run();
  
  if (!result.meta.last_row_id) return null;
  
  return getMoodById(db, result.meta.last_row_id as number);
}

export async function getMoodById(db: D1Database, id: number): Promise<MoodEntry | null> {
  const mood = await db.prepare(
    'SELECT id, user_id, emotion, intensity, notes, logged_at, created_at FROM mood_entries WHERE id = ?'
  ).bind(id).first<MoodEntry>();
  return mood || null;
}

export async function getUserMoods(
  db: D1Database,
  userId: number,
  limit = 50,
  offset = 0
): Promise<MoodEntry[]> {
  const result = await db.prepare(
    'SELECT id, user_id, emotion, intensity, notes, logged_at, created_at FROM mood_entries WHERE user_id = ? ORDER BY logged_at DESC LIMIT ? OFFSET ?'
  ).bind(userId, limit, offset).all<MoodEntry>();
  return result.results || [];
}

export async function getUserMoodsByDateRange(
  db: D1Database,
  userId: number,
  startDate: string,
  endDate: string
): Promise<MoodEntry[]> {
  const result = await db.prepare(
    'SELECT id, user_id, emotion, intensity, notes, logged_at, created_at FROM mood_entries WHERE user_id = ? AND logged_at >= ? AND logged_at <= ? ORDER BY logged_at ASC'
  ).bind(userId, startDate, endDate).all<MoodEntry>();
  return result.results || [];
}

export async function deleteMood(db: D1Database, id: number, userId: number): Promise<boolean> {
  const result = await db.prepare(
    'DELETE FROM mood_entries WHERE id = ? AND user_id = ?'
  ).bind(id, userId).run();
  return (result.meta.changes || 0) > 0;
}

export async function getMoodStats(db: D1Database, userId: number): Promise<{
  total: number;
  avgIntensity: number;
  emotionCounts: Record<string, number>;
  last7Days: MoodEntry[];
}> {
  // Get total count
  const countResult = await db.prepare(
    'SELECT COUNT(*) as count FROM mood_entries WHERE user_id = ?'
  ).bind(userId).first<{ count: number }>();
  
  // Get average intensity
  const avgResult = await db.prepare(
    'SELECT AVG(intensity) as avg FROM mood_entries WHERE user_id = ?'
  ).bind(userId).first<{ avg: number | null }>();
  
  // Get emotion counts
  const emotionResult = await db.prepare(
    'SELECT emotion, COUNT(*) as count FROM mood_entries WHERE user_id = ? GROUP BY emotion'
  ).bind(userId).all<{ emotion: string; count: number }>();
  
  const emotionCounts: Record<string, number> = {};
  for (const row of emotionResult.results || []) {
    emotionCounts[row.emotion] = row.count;
  }
  
  // Get last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const last7Days = await getUserMoodsByDateRange(db, userId, sevenDaysAgo, new Date().toISOString());
  
  return {
    total: countResult?.count || 0,
    avgIntensity: avgResult?.avg || 0,
    emotionCounts,
    last7Days
  };
}
