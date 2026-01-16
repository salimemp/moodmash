// MoodMash Type Definitions
import type { D1Database } from '@cloudflare/workers-types';

// Environment bindings for Cloudflare Workers
export interface Env {
  DB: D1Database;
}

// Database types
export interface User {
  id: number;
  email: string;
  name: string | null;
  password_hash: string;
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

// API types
export interface CurrentUser {
  id: number;
  email: string;
  name: string | null;
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

// Context variables
export interface Variables {
  user: CurrentUser | null;
}
