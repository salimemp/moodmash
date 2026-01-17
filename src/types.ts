// MoodMash Type Definitions
import type { D1Database, R2Bucket } from '@cloudflare/workers-types';

// Environment bindings for Cloudflare Workers
export interface Env {
  DB: D1Database;
  R2_BUCKET?: R2Bucket;
  // API Keys
  GEMINI_API_KEY?: string;
  RESEND_API_KEY?: string;
  FROM_EMAIL?: string;
  // OAuth - Google
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI?: string;
  // OAuth - GitHub
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  GITHUB_REDIRECT_URI?: string;
  // App URL
  APP_URL?: string;
}

// Database types
export interface User {
  id: number;
  email: string;
  name: string | null;
  password_hash: string | null;
  email_verified: boolean;
  avatar_url: string | null;
  oauth_provider: string | null;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: number;
  user_id: number;
  session_token: string;
  expires_at: string;
  created_at: string;
}

export interface MoodEntry {
  id: number;
  user_id: number;
  emotion: string;
  intensity: number;
  notes: string | null;
  logged_at: string;
  created_at: string;
}

export interface OAuthAccount {
  id: number;
  user_id: number;
  provider: 'google' | 'github';
  provider_account_id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VoiceJournal {
  id: number;
  user_id: number;
  mood_entry_id: number | null;
  title: string | null;
  transcript: string | null;
  audio_data: string | null;
  audio_url: string | null;
  duration_seconds: number | null;
  emotion_detected: string | null;
  sentiment_score: number | null;
  created_at: string;
}

export interface EmailVerification {
  id: number;
  user_id: number;
  token: string;
  email: string;
  verified: boolean;
  expires_at: string;
  created_at: string;
}

export interface PasswordReset {
  id: number;
  user_id: number;
  token: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

// API types
export interface CurrentUser {
  id: number;
  email: string;
  name: string | null;
  email_verified: boolean;
  avatar_url: string | null;
}

export interface MoodInput {
  emotion: string;
  intensity: number;
  notes?: string;
  logged_at?: string;
}

export interface AuthInput {
  email: string;
  password: string;
  name?: string;
}

export interface VoiceJournalInput {
  title?: string;
  transcript?: string;
  audio_data?: string;
  duration_seconds?: number;
  mood_entry_id?: number;
}

// AI/Insights types
export interface MoodInsight {
  type: 'trend' | 'pattern' | 'suggestion' | 'correlation';
  title: string;
  description: string;
  data?: Record<string, unknown>;
}

export interface MoodTrend {
  date: string;
  avgIntensity: number;
  dominantEmotion: string;
  count: number;
}

export interface MoodAnalytics {
  totalEntries: number;
  avgIntensity: number;
  emotionDistribution: Record<string, number>;
  weeklyTrends: MoodTrend[];
  insights: MoodInsight[];
}

// OAuth types
export interface OAuthUserInfo {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
}

export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
}

// Export types
export interface ExportData {
  user: {
    email: string;
    name: string | null;
    created_at: string;
  };
  moods: MoodEntry[];
  voiceJournals: VoiceJournal[];
  exportedAt: string;
}

// Context variables
export interface Variables {
  user: CurrentUser | null;
}
