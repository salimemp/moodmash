// MoodMash Type Definitions
// TypeScript Strict Mode Compatible - Phase 4: 100% Type Safety

import type { D1Database, R2Bucket, KVNamespace, D1Result } from '@cloudflare/workers-types';
import type { Context } from 'hono';

// ============================================================================
// Core Emotion & Activity Types
// ============================================================================

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

// ============================================================================
// Database Types - Generic types for D1 operations
// ============================================================================

/** Type alias for D1 database */
export type D1DatabaseType = D1Database;

/** Generic database result type */
export type D1ResultType<T = Record<string, unknown>> = D1Result<T>;

/** Type for SQL parameter values */
export type SqlParamValue = string | number | boolean | null | Uint8Array;

/** Type for SQL parameter array */
export type SqlParams = SqlParamValue[];

/** Generic database row type */
export interface DatabaseRow {
  [key: string]: SqlParamValue | undefined;
}

/** Database query configuration */
export interface QueryConfig {
  sql: string;
  params?: SqlParams;
}

// ============================================================================
// Cache Types
// ============================================================================

export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheResult<T> {
  result: T;
}

// ============================================================================
// Request/Response Payload Types
// ============================================================================

/** Generic JSON body type */
export type JsonBody = Record<string, unknown>;

/** Request body with optional fields */
export interface RequestBodyBase {
  [key: string]: unknown;
}

/** Search filters input */
export interface SearchFiltersInput {
  startDate?: string;
  endDate?: string;
  emotions?: string[];
  minIntensity?: number;
  maxIntensity?: number;
  weather?: string;
  socialInteraction?: string;
}

// ============================================================================
// Calendar Export Types
// ============================================================================

export interface CalendarMoodEntry {
  id: number;
  emotion: string;
  intensity: number;
  notes?: string | null;
  logged_at: string;
  weather?: string | null;
  activities?: string | null;
}

// ============================================================================
// Data Export Types
// ============================================================================

export interface ExportUserData {
  id: number;
  username: string;
  email: string;
  name?: string | null;
  created_at: string;
}

export interface ExportMoodEntry {
  id: number;
  emotion: string;
  intensity: number;
  notes?: string | null;
  weather?: string | null;
  sleep_hours?: number | null;
  activities?: string | null;
  social_interaction?: string | null;
  logged_at: string;
  created_at: string;
}

export interface ExportActivity {
  id: number;
  name: string;
  category: string;
  duration_minutes?: number;
  completed_at: string;
}

export interface ExportInsights {
  averageIntensity: number;
  mostFrequentEmotion: string;
  totalEntries: number;
  daysTracked: number;
}

export interface ExportDataInput {
  user: ExportUserData;
  moodEntries: ExportMoodEntry[];
  activities?: ExportActivity[];
  insights?: ExportInsights;
}

// ============================================================================
// Notification Types
// ============================================================================

export interface NotificationOptions {
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

// ============================================================================
// Monitoring & Analytics Types
// ============================================================================

export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  labels?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export interface LokiStream {
  stream: Record<string, string>;
  values: [string, string][];
}

export interface LokiPushPayload {
  streams: LokiStream[];
}

export interface AnalyticsEvent {
  event: string;
  timestamp: string;
  userId?: number;
  sessionId?: string;
  requestBody?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface MetricsContext {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
}

// ============================================================================
// Authentication & OAuth Types
// ============================================================================

export interface OAuthEnv {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  BASE_URL?: string;
}

export interface CredentialRow {
  id: number;
  credential_id: string;
  public_key: string;
  name?: string | null;
  created_at: string;
}

export interface BackupCodeRow {
  id: number;
  code_hash: string;
  used: number;
  created_at: string;
}

// ============================================================================
// Email Service Types
// ============================================================================

export interface EmailResponse {
  id?: string;
  message?: string;
  error?: string;
}

// ============================================================================
// Geolocation Types
// ============================================================================

export interface GeolocationInfo {
  city?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

// ============================================================================
// Media Types
// ============================================================================

export interface MediaFile {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface MediaRow {
  id: string;
  user_id: number;
  filename: string;
  content_type: string;
  size: number;
  r2_key: string;
  created_at: string;
}

// ============================================================================
// Secret Management Types
// ============================================================================

export interface SecretRow {
  name: string;
  value: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Research & Compliance Types
// ============================================================================

export interface ResearchConsent {
  userId: number;
  consentType: string;
  consentGiven: boolean;
  consentVersion: string;
}

export interface AnonymizedMood {
  week_offset: number;
  emotion: string;
  intensity: number;
  weather?: string | null;
}

export interface AnonymizedMetric {
  week_offset: number;
  metric_type: string;
  value: number;
}

export interface AnonymizedData {
  anonymousId: string;
  dataType: string;
  data: AnonymizedMood[] | AnonymizedMetric[];
  createdAt: string;
}

export interface ResearchExport {
  studyName: string;
  dataTypes: string[];
  dateRange?: { start: string; end: string };
}

export interface AuditLog {
  action: string;
  userId?: number;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
}

export interface SecurityEvent {
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ipAddress?: string;
  userId?: number;
  details?: Record<string, unknown>;
}

export interface FailedLogin {
  email: string;
  ipAddress: string;
  reason: string;
}

export interface RateLimitHit {
  ipAddress: string;
  endpoint: string;
  limit: number;
  period: number;
}

export interface SecurityAlert {
  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: Record<string, unknown>;
}

export interface ComplianceCheckItem {
  category: string;
  requirement: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable';
  lastChecked: string;
  notes?: string;
}

export interface ComplianceStatus {
  overall: boolean;
  checks: ComplianceCheckItem[];
  lastAudit?: string;
}

export interface DashboardStats {
  totalEvents: number;
  criticalAlerts: number;
  failedLogins: number;
  rateLimitHits: number;
  recentEvents: SecurityEvent[];
}

// ============================================================================
// Subscription Types
// ============================================================================

export interface PlanRow {
  id: number;
  name: string;
  price: number;
  features: string;
  created_at: string;
}

export interface SubscriptionResult {
  success: boolean;
  subscriptionId?: number;
  error?: string;
}

// ============================================================================
// AI/Gemini Types
// ============================================================================

export interface ForecastContext {
  currentTime?: string;
  dayOfWeek?: string;
  weather?: string;
  recentActivities?: string[];
}

export interface ForecastResult {
  predictedMood: Emotion;
  confidence: number;
  factors: string[];
  recommendations: string[];
}

// ============================================================================
// Performance Types
// ============================================================================

/** Navigator connection info (experimental API) */
export interface NavigatorConnection {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

/** Extended Navigator type with experimental APIs */
export interface ExtendedNavigator extends Navigator {
  connection?: NavigatorConnection;
  deviceMemory?: number;
  userLanguage?: string;
}

/** Function type for debounce/throttle/memoize */
export type AnyFunction = (...args: unknown[]) => unknown;

/** Generic callback function type */
export type CallbackFunction<T = void> = () => T;

// ============================================================================
// Query Builder Types
// ============================================================================

export interface WhereCondition {
  field: string;
  operator: string;
  value: SqlParamValue;
}

export interface QueryBuildResult {
  sql: string;
  params: SqlParams;
}

export interface FilterClauseResult {
  clause: string;
  params: SqlParams;
}

// ============================================================================
// Mood Reminder Types
// ============================================================================

export interface ReminderData {
  type: string;
  userId?: number;
  message?: string;
}

// ============================================================================
// CCPA Types
// ============================================================================

export interface CcpaCategory {
  category: string;
  description: string;
  data_collected: string;
}

export interface UserDataExport {
  user: Record<string, unknown>;
  moods?: Record<string, unknown>[];
  activities?: Record<string, unknown>[];
  settings?: Record<string, unknown>;
  exportedAt: string;
}

// ============================================================================
// Hono Context Types
// ============================================================================

/** Typed Hono context */
export type HonoContext = Context<{ Bindings: Bindings; Variables: Variables }>;

/** Middleware next function */
export type MiddlewareNext = () => Promise<void>;

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
  DB: D1Database;
  R2?: R2Bucket;
  KV?: KVNamespace;
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
  monitoring?: import('./lib/monitoring').GrafanaMonitoring;
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
