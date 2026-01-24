// MoodMash Type Definitions
import type { D1Database, R2Bucket } from '@cloudflare/workers-types';

// Environment bindings for Cloudflare Workers
export interface Env {
  // Database
  DB: D1Database;
  
  // R2 Storage Buckets
  R2_BUCKET?: R2Bucket;       // Legacy single bucket (deprecated)
  ASSETS?: R2Bucket;          // Static assets, meditation audio, yoga videos
  USER_UPLOADS?: R2Bucket;    // User profile pictures, voice recordings
  BACKUPS?: R2Bucket;         // Database backups, export files
  
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
  
  // Cloudflare Turnstile
  TURNSTILE_SECRET_KEY?: string;
  
  // Error Tracking
  SENTRY_DSN?: string;
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

// Phase 3 Social Types
export interface UserProfile {
  id: number;
  user_id: number;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  profile_visibility: 'public' | 'friends' | 'private';
  mood_visibility: 'public' | 'friends' | 'private';
  allow_friend_requests: boolean;
  show_mood_history: boolean;
  created_at: string;
  updated_at: string;
}

export interface Friendship {
  id: number;
  user_id: number;
  friend_id: number;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: number;
  name: string;
  description: string | null;
  privacy: 'public' | 'private';
  avatar_url: string | null;
  created_by: number;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: number;
  group_id: number;
  user_id: number;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
}

export interface GroupPost {
  id: number;
  group_id: number;
  user_id: number;
  content: string;
  mood_entry_id: number | null;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

export interface SharedMood {
  id: number;
  mood_id: number;
  user_id: number;
  shared_with: 'public' | 'friends' | 'group';
  group_id: number | null;
  caption: string | null;
  privacy: 'public' | 'friends' | 'private';
  like_count: number;
  comment_count: number;
  created_at: string;
}

export interface Activity {
  id: number;
  user_id: number;
  type: string;
  actor_id: number | null;
  target_type: string | null;
  target_id: number | null;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface Reaction {
  id: number;
  target_type: 'shared_mood' | 'group_post' | 'comment';
  target_id: number;
  user_id: number;
  type: 'like' | 'love' | 'support' | 'hug' | 'celebrate';
  created_at: string;
}

export interface Comment {
  id: number;
  target_type: 'shared_mood' | 'group_post';
  target_id: number;
  user_id: number;
  content: string;
  parent_id: number | null;
  like_count: number;
  created_at: string;
  updated_at: string;
}

// Context variables
export interface Variables {
  user: CurrentUser | null;
  userId: string;
}

// Bindings is an alias for Env (for API routes)
export type Bindings = Env;
