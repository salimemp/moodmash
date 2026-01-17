-- Phase 8: Wellness Achievements
-- Achievement definitions for meditation, yoga, and music features

-- ============================================================================
-- MEDITATION ACHIEVEMENTS
-- ============================================================================

-- First meditation session
INSERT OR IGNORE INTO achievement_definitions (name, description, category, icon, points, rarity, criteria_type, criteria_value, is_hidden)
VALUES ('Zen Beginner', 'Complete your first meditation session', 'meditation', '🧘', 10, 'common', 'meditation_count', 1, FALSE);

-- 10 meditation sessions
INSERT OR IGNORE INTO achievement_definitions (name, description, category, icon, points, rarity, criteria_type, criteria_value, is_hidden)
VALUES ('Mindful Explorer', 'Complete 10 meditation sessions', 'meditation', '🌸', 25, 'common', 'meditation_count', 10, FALSE);

-- 50 meditation sessions
INSERT OR IGNORE INTO achievement_definitions (name, description, category, icon, points, rarity, criteria_type, criteria_value, is_hidden)
VALUES ('Meditation Enthusiast', 'Complete 50 meditation sessions', 'meditation', '🪷', 75, 'rare', 'meditation_count', 50, FALSE);

-- 100 meditation sessions
INSERT OR IGNORE INTO achievement_definitions (name, description, category, icon, points, rarity, criteria_type, criteria_value, is_hidden)
VALUES ('Zen Master', 'Complete 100 meditation sessions', 'meditation', '🧘‍♀️', 150, 'epic', 'meditation_count', 100, FALSE);

-- 7-day meditation streak
INSERT OR IGNORE INTO achievement_definitions (name, description, category, icon, points, rarity, criteria_type, criteria_value, is_hidden)
VALUES ('Mindful Week', 'Meditate for 7 consecutive days', 'meditation', '📿', 50, 'rare', 'meditation_streak', 7, FALSE);

-- 30-day meditation streak
INSERT OR IGNORE INTO achievement_definitions (name, description, category, icon, points, rarity, criteria_type, criteria_value, is_hidden)
VALUES ('Meditation Devotee', 'Meditate for 30 consecutive days', 'meditation', '🕯️', 200, 'epic', 'meditation_streak', 30, FALSE);

-- 100 minutes of meditation
INSERT OR IGNORE INTO achievement_definitions (name, description, category, icon, points, rarity, criteria_type, criteria_value, is_hidden)
VALUES ('First Hour of Calm', 'Meditate for a total of 60 minutes', 'meditation', '⏱️', 30, 'common', 'meditation_minutes', 60, FALSE);

-- 500 minutes of meditation
INSERT OR IGNORE INTO achievement_definitions (name, description, category, icon, points, rarity, criteria_type, criteria_value, is_hidden)
VALUES ('Peaceful Mind', 'Meditate for a total of 500 minutes', 'meditation', '🌙', 100, 'rare', 'meditation_minutes', 500, FALSE);

-- Try all meditation categories
INSERT OR IGNORE INTO achievement_definitions (name, description, category, icon, points, rarity, criteria_type, criteria_value, is_hidden)
VALUES ('Meditation Explorer', 'Try meditation sessions from 5 different categories', 'meditation', '🗺️', 50, 'rare', 'meditation_categories', 5, TRUE);

-- ============================================================================
-- YOGA ACHIEVEMENTS
-- ============================================================================

-- First yoga session
INSERT OR IGNORE INTO achievement_definitions (name, description, category, icon, points, rarity, criteria_type, criteria_value, is_hidden)
VALUES ('Yoga Beginner', 'Complete your first yoga routine', 'yoga', '🧎', 10, 'common', 'yoga_count', 1, FALSE);

-- 25 yoga sessions
INSERT OR IGNORE INTO achievement_definitions (name, description, category, icon, points, rarity, criteria_type, criteria_value, is_hidden)
VALUES ('Flexible Mind', 'Complete 25 yoga routines', 'yoga', '🌿', 50, 'rare', 'yoga_count', 25, FALSE);

-- 50 yoga sessions
INSERT OR IGNORE INTO achievement_definitions (name, description, category, icon, points, rarity, criteria_type, criteria_value, is_hidden)
VALUES ('Yoga Warrior', 'Complete 50 yoga routines', 'yoga', '⚔️', 100, 'epic', 'yoga_count', 50, FALSE);

-- 7-day yoga streak
INSERT OR IGNORE INTO achievement_definitions (name, description, category, icon, points, rarity, criteria_type, criteria_value, is_hidden)
VALUES ('Dedicated Yogi', 'Practice yoga for 7 consecutive days', 'yoga', '🌅', 50, 'rare', 'yoga_streak', 7, FALSE);

-- 30-day yoga streak
INSERT OR IGNORE INTO achievement_definitions (name, description, category, icon, points, rarity, criteria_type, criteria_value, is_hidden)
VALUES ('Yoga Master', 'Practice yoga for 30 consecutive days', 'yoga', '🏆', 200, 'epic', 'yoga_streak', 30, FALSE);

-- Try 50 different poses
INSERT OR IGNORE INTO achievement_definitions (name, description, category, icon, points, rarity, criteria_type, criteria_value, is_hidden)
VALUES ('Pose Collector', 'Try 50 different yoga poses', 'yoga', '🎭', 75, 'rare', 'yoga_poses_tried', 50, FALSE);

-- Complete a routine without pausing
INSERT OR IGNORE INTO achievement_definitions (name, description, category, icon, points, rarity, criteria_type, criteria_value, is_hidden)
VALUES ('Uninterrupted Flow', 'Complete a yoga routine without pausing', 'yoga', '💫', 25, 'common', 'yoga_unpaused', 1, TRUE);

-- ============================================================================
-- MUSIC THERAPY ACHIEVEMENTS
-- ============================================================================

-- First music session
INSERT OR IGNORE INTO achievement_definitions (name, description, category, icon, points, rarity, criteria_type, criteria_value, is_hidden)
VALUES ('Music Listener', 'Listen to your first music therapy playlist', 'music', '🎵', 10, 'common', 'music_plays', 1, FALSE);

-- 10 hours of music
INSERT OR IGNORE INTO achievement_definitions (name, description, category, icon, points, rarity, criteria_type, criteria_value, is_hidden)
VALUES ('Sound Healer', 'Listen to 10 hours of music therapy', 'music', '🎧', 50, 'rare', 'music_hours', 10, FALSE);

-- 100 hours of music
INSERT OR IGNORE INTO achievement_definitions (name, description, category, icon, points, rarity, criteria_type, criteria_value, is_hidden)
VALUES ('Music Therapist', 'Listen to 100 hours of music therapy', 'music', '🎼', 150, 'epic', 'music_hours', 100, FALSE);

-- Try all music categories
INSERT OR IGNORE INTO achievement_definitions (name, description, category, icon, points, rarity, criteria_type, criteria_value, is_hidden)
VALUES ('Genre Explorer', 'Listen to playlists from 8 different categories', 'music', '🌈', 50, 'rare', 'music_categories', 8, FALSE);

-- Improve mood with music 10 times
INSERT OR IGNORE INTO achievement_definitions (name, description, category, icon, points, rarity, criteria_type, criteria_value, is_hidden)
VALUES ('Mood Shifter', 'Improve your mood through music 10 times', 'music', '😊', 75, 'rare', 'music_mood_improved', 10, FALSE);

-- ============================================================================
-- WELLNESS COMBO ACHIEVEMENTS
-- ============================================================================

-- Complete meditation and yoga on the same day
INSERT OR IGNORE INTO achievement_definitions (name, description, category, icon, points, rarity, criteria_type, criteria_value, is_hidden)
VALUES ('Mind-Body Balance', 'Complete both meditation and yoga on the same day', 'wellness', '☯️', 25, 'common', 'wellness_combo_day', 1, FALSE);

-- Complete all three wellness activities in one day
INSERT OR IGNORE INTO achievement_definitions (name, description, category, icon, points, rarity, criteria_type, criteria_value, is_hidden)
VALUES ('Wellness Trifecta', 'Do meditation, yoga, and music therapy in one day', 'wellness', '🌟', 50, 'rare', 'wellness_trifecta', 1, FALSE);

-- Do all three for 7 days
INSERT OR IGNORE INTO achievement_definitions (name, description, category, icon, points, rarity, criteria_type, criteria_value, is_hidden)
VALUES ('Wellness Week', 'Complete all three wellness activities for 7 consecutive days', 'wellness', '🏅', 150, 'epic', 'wellness_week', 7, FALSE);

-- Total wellness time: 1000 minutes
INSERT OR IGNORE INTO achievement_definitions (name, description, category, icon, points, rarity, criteria_type, criteria_value, is_hidden)
VALUES ('Wellness Champion', 'Spend 1000 total minutes on wellness activities', 'wellness', '👑', 200, 'legendary', 'wellness_total_minutes', 1000, FALSE);

-- Morning routine: meditation before 9am
INSERT OR IGNORE INTO achievement_definitions (name, description, category, icon, points, rarity, criteria_type, criteria_value, is_hidden)
VALUES ('Early Bird', 'Complete a morning meditation before 9 AM', 'wellness', '🐦', 15, 'common', 'morning_meditation', 1, TRUE);

-- Evening wind-down: complete bedtime routine 10 times
INSERT OR IGNORE INTO achievement_definitions (name, description, category, icon, points, rarity, criteria_type, criteria_value, is_hidden)
VALUES ('Night Owl', 'Complete 10 evening wellness routines', 'wellness', '🦉', 40, 'rare', 'evening_wellness', 10, TRUE);

-- Mood improvement tracked after wellness
INSERT OR IGNORE INTO achievement_definitions (name, description, category, icon, points, rarity, criteria_type, criteria_value, is_hidden)
VALUES ('Feeling Better', 'Track mood improvement after 5 wellness sessions', 'wellness', '📈', 30, 'common', 'wellness_mood_tracked', 5, FALSE);

-- Perfect wellness week (all metrics improved)
INSERT OR IGNORE INTO achievement_definitions (name, description, category, icon, points, rarity, criteria_type, criteria_value, is_hidden)
VALUES ('Transformation Week', 'Complete a week with improved mood every day', 'wellness', '🦋', 100, 'epic', 'perfect_wellness_week', 1, TRUE);
