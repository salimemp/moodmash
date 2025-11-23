-- MoodMash Production Seed Data
-- Sample data to demonstrate app functionality

-- Insert sample user (if not exists)
INSERT OR IGNORE INTO users (id, email, name, created_at)
VALUES (1, 'demo@moodmash.win', 'Demo User', datetime('now'));

-- Insert sample mood entries for the past 30 days
INSERT OR IGNORE INTO mood_entries (user_id, emotion, intensity, notes, logged_at, weather, sleep_hours, activities, social_interaction, created_at)
VALUES 
  (1, 'happy', 4, 'Great start to the day!', datetime('now', '-1 day'), 'sunny', 8, '["exercise", "work"]', 'friends', datetime('now', '-1 day')),
  (1, 'energetic', 5, 'Feeling productive', datetime('now', '-2 days'), 'cloudy', 7, '["work", "coffee"]', 'colleagues', datetime('now', '-2 days')),
  (1, 'calm', 3, 'Relaxing evening', datetime('now', '-3 days'), 'rainy', 6, '["reading", "meditation"]', 'alone', datetime('now', '-3 days')),
  (1, 'anxious', 2, 'Stressful meeting', datetime('now', '-4 days'), 'sunny', 5, '["work"]', 'colleagues', datetime('now', '-4 days')),
  (1, 'peaceful', 4, 'Nature walk was refreshing', datetime('now', '-5 days'), 'sunny', 8, '["exercise", "nature"]', 'alone', datetime('now', '-5 days')),
  (1, 'tired', 2, 'Long work day', datetime('now', '-6 days'), 'cloudy', 5, '["work"]', 'colleagues', datetime('now', '-6 days')),
  (1, 'happy', 5, 'Weekend vibes!', datetime('now', '-7 days'), 'sunny', 9, '["social", "exercise"]', 'friends', datetime('now', '-7 days')),
  (1, 'neutral', 3, 'Regular day', datetime('now', '-8 days'), 'partly_cloudy', 7, '["work", "coffee"]', 'colleagues', datetime('now', '-8 days')),
  (1, 'sad', 2, 'Feeling down', datetime('now', '-9 days'), 'rainy', 6, '["reading"]', 'alone', datetime('now', '-9 days')),
  (1, 'energetic', 4, 'Morning workout energy', datetime('now', '-10 days'), 'sunny', 8, '["exercise"]', 'alone', datetime('now', '-10 days')),
  (1, 'calm', 4, 'Meditation helped', datetime('now', '-11 days'), 'cloudy', 7, '["meditation", "yoga"]', 'alone', datetime('now', '-11 days')),
  (1, 'happy', 4, 'Good news at work', datetime('now', '-12 days'), 'sunny', 7, '["work"]', 'colleagues', datetime('now', '-12 days')),
  (1, 'stressed', 3, 'Tight deadline', datetime('now', '-13 days'), 'cloudy', 6, '["work", "coffee"]', 'colleagues', datetime('now', '-13 days')),
  (1, 'peaceful', 5, 'Spa day was amazing', datetime('now', '-14 days'), 'sunny', 9, '["relaxation"]', 'friends', datetime('now', '-14 days')),
  (1, 'neutral', 3, 'Average day', datetime('now', '-15 days'), 'partly_cloudy', 7, '["work"]', 'colleagues', datetime('now', '-15 days'));

-- Insert sample wellness activities (if table exists)
INSERT OR IGNORE INTO wellness_activities (title, description, category, target_emotions, duration_minutes, difficulty, created_at)
VALUES
  ('5-Minute Breathing Exercise', 'Deep breathing to reduce anxiety and stress', 'meditation', '["anxious", "stressed"]', 5, 'easy', datetime('now')),
  ('Morning Walk', 'Light exercise to boost mood and energy', 'exercise', '["tired", "sad"]', 30, 'easy', datetime('now')),
  ('Gratitude Journaling', 'Write 3 things you''re grateful for', 'journaling', '["sad", "neutral"]', 10, 'easy', datetime('now')),
  ('Quick Yoga Session', 'Gentle stretches for body and mind', 'exercise', '["anxious", "stressed"]', 15, 'medium', datetime('now')),
  ('Call a Friend', 'Connect with someone you care about', 'social', '["sad", "lonely"]', 20, 'easy', datetime('now'));

-- Note: This seed data is safe to run multiple times due to INSERT OR IGNORE
