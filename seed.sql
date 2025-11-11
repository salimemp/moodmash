-- Seed data for MoodMash MVP

-- Create default user for MVP (single user mode)
INSERT OR IGNORE INTO users (id, email, name) VALUES 
  (1, 'demo@moodmash.app', 'Demo User');

-- Seed wellness activities
INSERT OR IGNORE INTO wellness_activities (title, description, category, duration_minutes, difficulty, target_emotions) VALUES 
  ('5-Minute Breathing Exercise', 'Simple box breathing technique to reduce stress and anxiety. Inhale for 4, hold for 4, exhale for 4, hold for 4.', 'meditation', 5, 'easy', '["anxious","stressed","angry"]'),
  
  ('Gratitude Journaling', 'Write down three things you''re grateful for today. Focus on specific details and why they matter.', 'journaling', 10, 'easy', '["sad","neutral","tired"]'),
  
  ('Quick Walk', 'Take a 15-minute walk outside. Notice your surroundings and practice mindfulness while moving.', 'exercise', 15, 'easy', '["tired","sad","anxious","stressed"]'),
  
  ('Progressive Muscle Relaxation', 'Systematically tense and relax different muscle groups to release physical tension.', 'meditation', 15, 'medium', '["anxious","stressed","angry","tired"]'),
  
  ('Creative Doodling', 'Spend 10 minutes drawing or doodling without judgment. Let your hand move freely.', 'creative', 10, 'easy', '["sad","anxious","neutral"]'),
  
  ('Call a Friend', 'Reach out to someone you trust for a meaningful conversation. Connection helps.', 'social', 20, 'easy', '["sad","lonely","anxious"]'),
  
  ('Body Scan Meditation', 'Lie down and mentally scan your body from head to toe, releasing tension as you go.', 'meditation', 20, 'medium', '["anxious","stressed","angry","tired"]'),
  
  ('Dance Break', 'Put on your favorite upbeat song and dance like nobody''s watching for 5 minutes.', 'exercise', 5, 'easy', '["sad","tired","neutral"]'),
  
  ('Mindful Tea/Coffee', 'Prepare and drink your beverage slowly, engaging all five senses in the experience.', 'meditation', 10, 'easy', '["anxious","stressed","rushed"]'),
  
  ('Accomplishment List', 'Write down 5 things you''ve accomplished recently, no matter how small.', 'journaling', 10, 'easy', '["sad","inadequate","tired"]');

-- Sample mood entries (for demo/testing)
INSERT OR IGNORE INTO mood_entries (user_id, emotion, intensity, notes, weather, sleep_hours, activities, social_interaction, logged_at) VALUES 
  (1, 'happy', 4, 'Great morning coffee with a friend', 'sunny', 7.5, '["social","coffee"]', 'friends', datetime('now', '-7 days', '+9 hours')),
  (1, 'calm', 3, 'Productive work session', 'cloudy', 7.5, '["work"]', 'colleagues', datetime('now', '-7 days', '+14 hours')),
  (1, 'tired', 4, 'Long day, need rest', 'cloudy', 7.5, '["work","exercise"]', 'alone', datetime('now', '-7 days', '+20 hours')),
  
  (1, 'energetic', 4, 'Morning workout felt amazing', 'sunny', 8, '["exercise"]', 'alone', datetime('now', '-6 days', '+7 hours')),
  (1, 'happy', 5, 'Finished a big project!', 'sunny', 8, '["work","achievement"]', 'colleagues', datetime('now', '-6 days', '+16 hours')),
  
  (1, 'anxious', 3, 'Worried about upcoming presentation', 'rainy', 6, '["work","planning"]', 'alone', datetime('now', '-5 days', '+10 hours')),
  (1, 'calm', 3, 'Meditation helped', 'rainy', 6, '["meditation","work"]', 'alone', datetime('now', '-5 days', '+19 hours')),
  
  (1, 'sad', 2, 'Feeling a bit down, not sure why', 'rainy', 6.5, '["rest"]', 'alone', datetime('now', '-4 days', '+11 hours')),
  (1, 'peaceful', 4, 'Nature walk improved my mood', 'cloudy', 6.5, '["exercise","nature"]', 'alone', datetime('now', '-4 days', '+15 hours')),
  
  (1, 'happy', 4, 'Fun game night with friends', 'clear', 7, '["social","games"]', 'friends', datetime('now', '-3 days', '+19 hours')),
  
  (1, 'energetic', 5, 'Feeling great today!', 'sunny', 8, '["exercise","work"]', 'colleagues', datetime('now', '-2 days', '+8 hours')),
  (1, 'happy', 4, 'Productive and positive', 'sunny', 8, '["work","achievement"]', 'colleagues', datetime('now', '-2 days', '+17 hours')),
  
  (1, 'tired', 3, 'Didn''t sleep well', 'cloudy', 5.5, '["work"]', 'colleagues', datetime('now', '-1 days', '+9 hours')),
  (1, 'calm', 3, 'Relaxing evening', 'cloudy', 5.5, '["reading","rest"]', 'alone', datetime('now', '-1 days', '+21 hours')),
  
  (1, 'happy', 4, 'Good start to the day', 'sunny', 7, '["coffee","planning"]', 'alone', datetime('now', '+9 hours'));
