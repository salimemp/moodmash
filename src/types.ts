// MoodMash Type Definitions

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
  weather?: Weather;
  sleep_hours?: number;
  activities?: string[]; // Stored as JSON in DB
  social_interaction?: SocialInteraction;
  logged_at: string; // ISO datetime
  created_at?: string;
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
  pattern_data: any; // JSON data
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
}

// Context Variables
export interface Variables {
  user_id?: number;
  session?: Session;
  subscription?: any;
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
