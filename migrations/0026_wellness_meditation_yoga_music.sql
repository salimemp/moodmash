-- Phase 7: Wellness & Mindfulness Features Migration
-- Meditation, Yoga, and Music Therapy Systems

-- =====================================================
-- MEDITATION TABLES
-- =====================================================

-- Meditation sessions library
CREATE TABLE IF NOT EXISTS meditation_sessions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    title TEXT NOT NULL,
    title_key TEXT, -- i18n key
    description TEXT,
    description_key TEXT,
    category TEXT NOT NULL, -- stress_relief, sleep, anxiety, focus, mindfulness, breathing, body_scan, loving_kindness, morning, evening
    duration INTEGER NOT NULL, -- in seconds
    difficulty TEXT DEFAULT 'beginner', -- beginner, intermediate, advanced
    audio_url TEXT,
    script TEXT, -- meditation script content
    script_key TEXT, -- i18n key for script
    background_sound TEXT, -- nature, rain, ocean, forest, white_noise, silence
    instructor TEXT DEFAULT 'AI Guide',
    image_url TEXT,
    tags TEXT, -- JSON array of tags
    is_premium INTEGER DEFAULT 0,
    play_count INTEGER DEFAULT 0,
    rating REAL DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- User meditation progress
CREATE TABLE IF NOT EXISTS meditation_progress (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL REFERENCES meditation_sessions(id) ON DELETE CASCADE,
    started_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    duration INTEGER, -- actual duration in seconds
    mood_before INTEGER, -- 1-10
    mood_after INTEGER, -- 1-10
    notes TEXT,
    is_completed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Meditation favorites
CREATE TABLE IF NOT EXISTS meditation_favorites (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL REFERENCES meditation_sessions(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, session_id)
);

-- Meditation streaks
CREATE TABLE IF NOT EXISTS meditation_streaks (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_session_date TEXT,
    total_sessions INTEGER DEFAULT 0,
    total_minutes INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Meditation journal
CREATE TABLE IF NOT EXISTS meditation_journal (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id TEXT REFERENCES meditation_sessions(id) ON DELETE SET NULL,
    entry_date TEXT DEFAULT (date('now')),
    reflection TEXT,
    insights TEXT,
    mood_before INTEGER,
    mood_after INTEGER,
    tags TEXT, -- JSON array
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Meditation reminders
CREATE TABLE IF NOT EXISTS meditation_reminders (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reminder_time TEXT NOT NULL, -- HH:MM format
    days_of_week TEXT DEFAULT '["mon","tue","wed","thu","fri","sat","sun"]', -- JSON array
    is_enabled INTEGER DEFAULT 1,
    notification_type TEXT DEFAULT 'push', -- push, email, both
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- =====================================================
-- YOGA TABLES
-- =====================================================

-- Yoga poses library
CREATE TABLE IF NOT EXISTS yoga_poses (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    name_key TEXT, -- i18n key
    sanskrit_name TEXT,
    description TEXT,
    description_key TEXT,
    benefits TEXT, -- JSON array
    benefits_key TEXT,
    instructions TEXT, -- JSON array of steps
    instructions_key TEXT,
    precautions TEXT, -- JSON array
    precautions_key TEXT,
    image_url TEXT,
    video_url TEXT,
    difficulty TEXT DEFAULT 'beginner', -- beginner, intermediate, advanced
    category TEXT NOT NULL, -- standing, seated, balancing, backbends, forward_bends, twists, inversions, restorative, core
    duration INTEGER DEFAULT 30, -- recommended hold time in seconds
    muscle_groups TEXT, -- JSON array
    chakras TEXT, -- JSON array
    is_premium INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Yoga routines
CREATE TABLE IF NOT EXISTS yoga_routines (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    title TEXT NOT NULL,
    title_key TEXT,
    description TEXT,
    description_key TEXT,
    category TEXT NOT NULL, -- morning, evening, stress_relief, flexibility, strength, back_pain, sleep, anxiety, beginner, intermediate, advanced
    duration INTEGER NOT NULL, -- in seconds
    difficulty TEXT DEFAULT 'beginner',
    image_url TEXT,
    video_url TEXT,
    instructor TEXT DEFAULT 'AI Guide',
    pose_count INTEGER DEFAULT 0,
    tags TEXT, -- JSON array
    is_premium INTEGER DEFAULT 0,
    is_custom INTEGER DEFAULT 0,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    play_count INTEGER DEFAULT 0,
    rating REAL DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Yoga routine poses (junction table)
CREATE TABLE IF NOT EXISTS yoga_routine_poses (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    routine_id TEXT NOT NULL REFERENCES yoga_routines(id) ON DELETE CASCADE,
    pose_id TEXT NOT NULL REFERENCES yoga_poses(id) ON DELETE CASCADE,
    pose_order INTEGER NOT NULL,
    duration INTEGER DEFAULT 30, -- hold time in seconds
    repetitions INTEGER DEFAULT 1,
    side TEXT, -- left, right, both, none
    instructions TEXT, -- specific instructions for this pose in routine
    transition_note TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- User yoga progress
CREATE TABLE IF NOT EXISTS yoga_progress (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    routine_id TEXT REFERENCES yoga_routines(id) ON DELETE SET NULL,
    pose_id TEXT REFERENCES yoga_poses(id) ON DELETE SET NULL,
    started_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    duration INTEGER, -- actual duration in seconds
    mood_before INTEGER,
    mood_after INTEGER,
    notes TEXT,
    poses_completed INTEGER DEFAULT 0,
    is_completed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Yoga favorites
CREATE TABLE IF NOT EXISTS yoga_favorites (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    routine_id TEXT REFERENCES yoga_routines(id) ON DELETE CASCADE,
    pose_id TEXT REFERENCES yoga_poses(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, routine_id, pose_id)
);

-- Yoga streaks
CREATE TABLE IF NOT EXISTS yoga_streaks (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_session_date TEXT,
    total_sessions INTEGER DEFAULT 0,
    total_minutes INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Yoga journal
CREATE TABLE IF NOT EXISTS yoga_journal (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    routine_id TEXT REFERENCES yoga_routines(id) ON DELETE SET NULL,
    entry_date TEXT DEFAULT (date('now')),
    reflection TEXT,
    flexibility_notes TEXT,
    strength_notes TEXT,
    mood_before INTEGER,
    mood_after INTEGER,
    tags TEXT, -- JSON array
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- =====================================================
-- MUSIC TABLES
-- =====================================================

-- Music playlists
CREATE TABLE IF NOT EXISTS music_playlists (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    title TEXT NOT NULL,
    title_key TEXT,
    description TEXT,
    description_key TEXT,
    category TEXT NOT NULL, -- calming, energizing, focus, sleep, anxiety, depression, meditation, nature, binaural, classical, ambient
    mood_tags TEXT, -- JSON array of mood tags
    duration INTEGER DEFAULT 0, -- total duration in seconds
    track_count INTEGER DEFAULT 0,
    image_url TEXT,
    is_premium INTEGER DEFAULT 0,
    is_custom INTEGER DEFAULT 0,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    play_count INTEGER DEFAULT 0,
    rating REAL DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Music tracks
CREATE TABLE IF NOT EXISTS music_tracks (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    title TEXT NOT NULL,
    title_key TEXT,
    artist TEXT,
    album TEXT,
    duration INTEGER NOT NULL, -- in seconds
    category TEXT,
    mood_tags TEXT, -- JSON array
    audio_url TEXT,
    external_url TEXT, -- Spotify/YouTube link
    external_service TEXT, -- spotify, youtube, apple_music
    image_url TEXT,
    bpm INTEGER, -- beats per minute
    key TEXT, -- musical key
    is_premium INTEGER DEFAULT 0,
    play_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Playlist tracks junction
CREATE TABLE IF NOT EXISTS playlist_tracks (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    playlist_id TEXT NOT NULL REFERENCES music_playlists(id) ON DELETE CASCADE,
    track_id TEXT NOT NULL REFERENCES music_tracks(id) ON DELETE CASCADE,
    track_order INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(playlist_id, track_id)
);

-- Music listening history
CREATE TABLE IF NOT EXISTS music_listening_history (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    playlist_id TEXT REFERENCES music_playlists(id) ON DELETE SET NULL,
    track_id TEXT REFERENCES music_tracks(id) ON DELETE SET NULL,
    played_at TEXT DEFAULT (datetime('now')),
    duration INTEGER, -- actual listen duration
    mood_before INTEGER,
    mood_after INTEGER,
    completed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Music favorites
CREATE TABLE IF NOT EXISTS music_favorites (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    playlist_id TEXT REFERENCES music_playlists(id) ON DELETE CASCADE,
    track_id TEXT REFERENCES music_tracks(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, playlist_id, track_id)
);

-- Music recommendations
CREATE TABLE IF NOT EXISTS music_recommendations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    playlist_id TEXT REFERENCES music_playlists(id) ON DELETE CASCADE,
    track_id TEXT REFERENCES music_tracks(id) ON DELETE CASCADE,
    reason TEXT, -- why recommended
    score REAL DEFAULT 0, -- recommendation score 0-1
    is_viewed INTEGER DEFAULT 0,
    is_played INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- =====================================================
-- WELLNESS ACHIEVEMENTS
-- =====================================================

-- Insert wellness achievements
INSERT OR IGNORE INTO achievements (id, name, name_key, description, description_key, category, icon, points, requirement_type, requirement_value, is_secret) VALUES
('ach_zen_beginner', 'Zen Beginner', 'achievements.zen_beginner', 'Complete your first meditation session', 'achievements.zen_beginner_desc', 'wellness', '🧘', 10, 'meditation_sessions', 1, 0),
('ach_meditation_10', 'Mindful Explorer', 'achievements.meditation_10', 'Complete 10 meditation sessions', 'achievements.meditation_10_desc', 'wellness', '🧘‍♀️', 25, 'meditation_sessions', 10, 0),
('ach_meditation_50', 'Inner Peace', 'achievements.meditation_50', 'Complete 50 meditation sessions', 'achievements.meditation_50_desc', 'wellness', '☮️', 50, 'meditation_sessions', 50, 0),
('ach_zen_master', 'Zen Master', 'achievements.zen_master', 'Complete 100 meditation sessions', 'achievements.zen_master_desc', 'wellness', '🏆', 100, 'meditation_sessions', 100, 0),
('ach_meditation_streak_7', 'Weekly Meditator', 'achievements.meditation_streak_7', 'Maintain a 7-day meditation streak', 'achievements.meditation_streak_7_desc', 'wellness', '🔥', 30, 'meditation_streak', 7, 0),
('ach_meditation_streak_30', 'Monthly Mindfulness', 'achievements.meditation_streak_30', 'Maintain a 30-day meditation streak', 'achievements.meditation_streak_30_desc', 'wellness', '💫', 75, 'meditation_streak', 30, 0),
('ach_yoga_beginner', 'Yoga Novice', 'achievements.yoga_beginner', 'Complete your first yoga session', 'achievements.yoga_beginner_desc', 'wellness', '🧎', 10, 'yoga_sessions', 1, 0),
('ach_yoga_25', 'Yoga Enthusiast', 'achievements.yoga_25', 'Complete 25 yoga sessions', 'achievements.yoga_25_desc', 'wellness', '🤸', 40, 'yoga_sessions', 25, 0),
('ach_yoga_warrior', 'Yoga Warrior', 'achievements.yoga_warrior', 'Complete 50 yoga sessions', 'achievements.yoga_warrior_desc', 'wellness', '⚔️', 75, 'yoga_sessions', 50, 0),
('ach_yoga_streak_7', 'Flexible Week', 'achievements.yoga_streak_7', 'Maintain a 7-day yoga streak', 'achievements.yoga_streak_7_desc', 'wellness', '🌟', 30, 'yoga_streak', 7, 0),
('ach_yoga_streak_30', 'Flexible Mind', 'achievements.yoga_streak_30', 'Maintain a 30-day yoga streak', 'achievements.yoga_streak_30_desc', 'wellness', '✨', 75, 'yoga_streak', 30, 0),
('ach_music_listener', 'Sound Seeker', 'achievements.music_listener', 'Listen to 10 hours of therapeutic music', 'achievements.music_listener_desc', 'wellness', '🎵', 20, 'music_hours', 10, 0),
('ach_music_therapy', 'Music Therapist', 'achievements.music_therapy', 'Listen to 100 hours of therapeutic music', 'achievements.music_therapy_desc', 'wellness', '🎶', 75, 'music_hours', 100, 0),
('ach_wellness_champion', 'Wellness Champion', 'achievements.wellness_champion', 'Complete meditation, yoga, and music in one day', 'achievements.wellness_champion_desc', 'wellness', '👑', 50, 'wellness_daily', 1, 0),
('ach_all_categories', 'Category Explorer', 'achievements.all_categories', 'Try meditation from all categories', 'achievements.all_categories_desc', 'wellness', '🗺️', 40, 'meditation_categories', 10, 0);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_meditation_sessions_category ON meditation_sessions(category);
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_difficulty ON meditation_sessions(difficulty);
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_duration ON meditation_sessions(duration);
CREATE INDEX IF NOT EXISTS idx_meditation_progress_user ON meditation_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_meditation_progress_session ON meditation_progress(session_id);
CREATE INDEX IF NOT EXISTS idx_meditation_favorites_user ON meditation_favorites(user_id);

CREATE INDEX IF NOT EXISTS idx_yoga_poses_category ON yoga_poses(category);
CREATE INDEX IF NOT EXISTS idx_yoga_poses_difficulty ON yoga_poses(difficulty);
CREATE INDEX IF NOT EXISTS idx_yoga_routines_category ON yoga_routines(category);
CREATE INDEX IF NOT EXISTS idx_yoga_routines_difficulty ON yoga_routines(difficulty);
CREATE INDEX IF NOT EXISTS idx_yoga_progress_user ON yoga_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_yoga_favorites_user ON yoga_favorites(user_id);

CREATE INDEX IF NOT EXISTS idx_music_playlists_category ON music_playlists(category);
CREATE INDEX IF NOT EXISTS idx_music_tracks_category ON music_tracks(category);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist ON playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_music_history_user ON music_listening_history(user_id);
CREATE INDEX IF NOT EXISTS idx_music_favorites_user ON music_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_music_recommendations_user ON music_recommendations(user_id);
