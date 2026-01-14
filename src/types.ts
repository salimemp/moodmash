// MoodMash Type Definitions
// TypeScript Strict Mode Compatible

export type Emotion = 
  | 'happy' 
  | 'sad' 
  | 'anxious' 
  | 'calm' 
  | 'energetic' 
  | 'tired' 
  | 'angry' 
  | 'peaceful'
  | 'stressed'
  | 'neutral';

export type Weather = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'clear';

export type SocialInteraction = 'alone' | 'friends' | 'family' | 'colleagues';

export type ActivityCategory = 'meditation' | 'exercise' | 'journaling' | 'social' | 'creative';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface MoodEntry {
  id?: number;
  user_id?: number;
  emotion: Emotion;
  intensity: number; // 1-5
  notes?: string;
  note?: string; // Alias for notes
  weather?: Weather;
  sleep_hours?: number;
  activities?: string[]; // Stored as JSON in DB
  social_interaction?: SocialInteraction;
  logged_at: string; // ISO datetime
  created_at?: string;
  photo_url?: string; // Optional photo attachment
}

export interface WellnessActivity {
  id?: number;
  title: string;
  description: string;
  category: ActivityCategory;
  duration_minutes?: number;
  difficulty: Difficulty;
  target_emotions: Emotion[]; // Stored as JSON in DB
  created_at?: string;
}

export interface MoodPattern {
  id?: number;
  user_id: number;
  pattern_type: 'daily' | 'weekly' | 'monthly' | 'seasonal';
  pattern_data: Record<string, unknown>; // JSON data - typed properly
  confidence_score?: number;
  detected_at?: string;
}

export interface MoodStats {
  total_entries: number;
  most_common_emotion: Emotion;
  average_intensity: number;
  mood_distribution: Record<Emotion, number>;
  recent_trend: 'improving' | 'declining' | 'stable';
  insights: string[];
}

export interface Bindings {
  DB: import('@cloudflare/workers-types').D1Database;
  R2?: import('@cloudflare/workers-types').R2Bucket;
  KV?: import('@cloudflare/workers-types').KVNamespace;
  SENTRY_DSN?: string;
  ENVIRONMENT?: string;
  RELEASE_VERSION?: string;
  
  // OAuth Configuration
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  BASE_URL?: string;
  
  // Email Service
  RESEND_API_KEY?: string;
  
  // AI API Keys
  GEMINI_API_KEY?: string;
  
  // Security
  TURNSTILE_SECRET_KEY?: string;
  TURNSTILE_SITE_KEY?: string;
  
  // Grafana Cloud Monitoring
  GRAFANA_PROMETHEUS_URL?: string;
  GRAFANA_PROMETHEUS_USER?: string;
  GRAFANA_PROMETHEUS_TOKEN?: string;
  GRAFANA_LOKI_URL?: string;
  GRAFANA_LOKI_USER?: string;
  GRAFANA_LOKI_TOKEN?: string;
  GRAFANA_STACK_URL?: string;
}

// Session type
export interface Session {
  userId: number;
  email: string;
  username: string;
  name: string | null;
  avatar_url: string | null;
  isPremium?: boolean;
  is_verified?: boolean;
  created_at?: string;
}

// Subscription info (generic)
export interface SubscriptionInfo {
  id?: number;
  user_id?: number;
  plan?: string;
  plan_name?: string;
  status?: 'active' | 'cancelled' | 'expired' | 'trialing' | 'trial';
  start_date?: string;
  end_date?: string;
  features?: string[];
}

// Context Variables - uses generic types to be flexible
export interface Variables {
  user_id?: number;
  session?: Session;
  subscription?: SubscriptionInfo | null;
  isPremium?: boolean;
}

// Turnstile Verification
export interface TurnstileVerificationResult {
  success: boolean;
  error?: string;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

// Database row types
export interface UserRow {
  id: number;
  email: string;
  username: string;
  password_hash: string | null;
  name: string | null;
  avatar_url: string | null;
  is_active: number;
  is_verified: number;
  created_at: string;
  updated_at: string;
}

export interface SessionRow {
  id: number;
  session_token: string;
  user_id: number;
  expires_at: string;
  last_activity_at: string;
  created_at: string;
}

export interface MoodEntryRow {
  id: number;
  user_id: number;
  emotion: string;
  intensity: number;
  notes: string | null;
  weather: string | null;
  sleep_hours: number | null;
  activities: string | null; // JSON string
  social_interaction: string | null;
  photo_url: string | null;
  logged_at: string;
  created_at: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

// Password validation result (matches password-validator.ts)
export interface PasswordValidationResult {
  valid: boolean;
  isValid?: boolean; // Alias for backward compatibility
  errors: string[];
  feedback?: string[];
  strength: 'weak' | 'medium' | 'strong' | 'very_strong';
  score: number;
}

// Email verification token
export interface EmailVerificationToken {
  token: string;
  email: string;
  expiresAt: Date;
}

// Generic error type for catch blocks
export interface AppError extends Error {
  code?: string;
  statusCode?: number;
}

// Helper type for handling unknown errors
export function isAppError(error: unknown): error is AppError {
  return error instanceof Error;
}

export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }
  return String(error);
}
