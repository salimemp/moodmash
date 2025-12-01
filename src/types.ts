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
  DB: D1Database;
  SENTRY_DSN?: string;
  ENVIRONMENT?: string;
  RELEASE_VERSION?: string;
  
  // Grafana Cloud Monitoring
  GRAFANA_PROMETHEUS_URL?: string;
  GRAFANA_PROMETHEUS_USER?: string;
  GRAFANA_PROMETHEUS_TOKEN?: string;
  GRAFANA_LOKI_URL?: string;
  GRAFANA_LOKI_USER?: string;
  GRAFANA_LOKI_TOKEN?: string;
  GRAFANA_STACK_URL?: string;
}
