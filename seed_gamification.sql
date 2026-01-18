-- Seed data for Challenges, Color Psychology, and initial gamification

-- Insert default user if not exists
INSERT OR IGNORE INTO users (id, email, name) VALUES (1, 'user@moodmash.win', 'Demo User');

-- Insert default challenges
INSERT OR IGNORE INTO challenges (id, title, description, challenge_type, category, goal_value, goal_metric, duration_days, points, badge_icon, badge_color, difficulty) VALUES
  -- Daily challenges
  (1, '7-Day Streak', 'Log your mood every day for 7 consecutive days', 'weekly', 'streak', 7, 'consecutive_days', 7, 100, 'fa-fire', '#FF6B6B', 'easy'),
  (2, 'Mood Explorer', 'Experience and log 5 different emotions this week', 'weekly', 'mood_variety', 5, 'unique_moods', 7, 75, 'fa-compass', '#4ECDC4', 'easy'),
  (3, 'Wellness Warrior', 'Complete 3 wellness activities this week', 'weekly', 'activity_completion', 3, 'activities', 7, 80, 'fa-heart', '#95E1D3', 'easy'),
  
  -- Weekly challenges
  (4, '30-Day Master', 'Log your mood for 30 consecutive days', 'monthly', 'streak', 30, 'consecutive_days', 30, 500, 'fa-trophy', '#FFD93D', 'hard'),
  (5, 'Consistent Logger', 'Log at least 20 moods this month', 'monthly', 'consistency', 20, 'entries', 30, 300, 'fa-calendar-check', '#6BCB77', 'medium'),
  (6, 'Activity Champion', 'Complete 10 wellness activities this month', 'monthly', 'activity_completion', 10, 'activities', 30, 400, 'fa-star', '#C3AED6', 'medium'),
  
  -- Special challenges
  (7, 'Morning Ritual', 'Log your mood every morning for 7 days', 'weekly', 'consistency', 7, 'morning_entries', 7, 150, 'fa-sunrise', '#FFB6B9', 'medium'),
  (8, 'Evening Reflection', 'Add detailed notes to 5 mood entries', 'weekly', 'consistency', 5, 'detailed_entries', 7, 120, 'fa-moon', '#8D5B4C', 'medium'),
  (9, 'Social Butterfly', 'Log moods with social context 5 times', 'weekly', 'consistency', 5, 'social_entries', 7, 100, 'fa-users', '#F38181', 'easy'),
  (10, 'Self-Care Week', 'Complete at least one wellness activity daily for 7 days', 'weekly', 'activity_completion', 7, 'daily_activities', 7, 200, 'fa-spa', '#AA96DA', 'hard');

-- Insert color psychology data
INSERT OR IGNORE INTO color_psychology (color_code, color_name, attributes, effects, cultural_notes, mood_associations, recommended_for, avoid_when) VALUES
  -- Primary colors
  ('#FF0000', 'Red', '["energetic", "passionate", "powerful", "intense"]', 'Increases heart rate, stimulates energy and excitement. Can trigger strong emotions.', 'Western: danger/love. Eastern: luck/prosperity. Important in many cultures.', '["angry", "energetic", "passionate", "excited"]', 'When feeling low energy, need motivation', 'When feeling anxious or agitated'),
  
  ('#0000FF', 'Blue', '["calm", "peaceful", "trustworthy", "stable"]', 'Lowers blood pressure, reduces anxiety, promotes relaxation and focus.', 'Universal calming color. Associated with water and sky across cultures.', '["calm", "peaceful", "sad", "thoughtful"]', 'When feeling stressed or anxious', 'When feeling sad or depressed'),
  
  ('#FFFF00', 'Yellow', '["happy", "optimistic", "energetic", "cheerful"]', 'Stimulates mental activity, boosts mood, increases optimism and hope.', 'Western: happiness. Eastern: imperial/sacred. Often represents sun.', '["happy", "energetic", "optimistic", "creative"]', 'When feeling down or need creativity boost', 'When feeling overwhelmed or overstimulated'),
  
  -- Secondary colors
  ('#00FF00', 'Green', '["balanced", "natural", "growing", "harmonious"]', 'Reduces stress, promotes balance and harmony. Easiest color for eyes.', 'Universal nature color. Represents growth, renewal across cultures.', '["calm", "peaceful", "balanced", "refreshed"]', 'When seeking balance or connection with nature', 'When feeling stagnant'),
  
  ('#FF6600', 'Orange', '["enthusiastic", "creative", "warm", "friendly"]', 'Encourages social interaction, boosts enthusiasm and creativity.', 'Western: autumn/harvest. Eastern: transformation. Represents joy.', '["happy", "energetic", "creative", "social"]', 'When feeling isolated or need energy', 'When feeling overly stimulated'),
  
  ('#800080', 'Purple', '["spiritual", "creative", "wise", "luxurious"]', 'Promotes creativity, spirituality, and intuition. Calming yet inspiring.', 'Historically royal color. Represents spirituality in many cultures.', '["peaceful", "creative", "thoughtful", "inspired"]', 'When seeking creativity or spiritual connection', 'When feeling disconnected from reality'),
  
  -- Neutrals and pastels
  ('#FFC0CB', 'Pink', '["loving", "nurturing", "gentle", "compassionate"]', 'Calms anger, promotes feelings of love and compassion.', 'Western: femininity/romance. Universal: gentleness/care.', '["happy", "peaceful", "loved", "calm"]', 'When needing self-compassion or comfort', 'When feeling overwhelmed by emotions'),
  
  ('#ADD8E6', 'Light Blue', '["serene", "clear", "peaceful", "open"]', 'Promotes clear thinking, reduces tension, creates sense of space.', 'Universal sky/water association. Represents clarity and openness.', '["calm", "peaceful", "clear", "thoughtful"]', 'When needing clarity or peace', 'When feeling cold or isolated'),
  
  ('#90EE90', 'Light Green', '["fresh", "renewing", "hopeful", "young"]', 'Promotes renewal, hope, and fresh perspectives.', 'Universal spring/growth color. Represents new beginnings.', '["peaceful", "hopeful", "energetic", "balanced"]', 'When seeking renewal or fresh start', 'When feeling overwhelmed by change'),
  
  ('#FFE4B5', 'Beige', '["neutral", "calm", "warm", "comfortable"]', 'Creates sense of warmth and comfort without overstimulation.', 'Universal earth/warmth association. Represents stability.', '["calm", "neutral", "comfortable", "peaceful"]', 'When needing grounding and stability', 'When feeling bored or unmotivated'),
  
  -- Deep colors
  ('#000080', 'Navy Blue', '["professional", "confident", "stable", "authoritative"]', 'Promotes confidence, focus, and sense of authority.', 'Western: business/professionalism. Represents depth and stability.', '["calm", "confident", "focused", "stable"]', 'When needing confidence or focus', 'When feeling depressed or isolated'),
  
  ('#8B4513', 'Brown', '["grounded", "stable", "natural", "secure"]', 'Promotes sense of security, grounding, and connection to earth.', 'Universal earth color. Represents stability and reliability.', '["calm", "stable", "grounded", "secure"]', 'When feeling ungrounded or insecure', 'When feeling stuck or stagnant'),
  
  ('#4B0082', 'Indigo', '["intuitive", "deep", "spiritual", "wise"]', 'Enhances intuition, deep thinking, and spiritual awareness.', 'Associated with third eye chakra. Represents wisdom and insight.', '["thoughtful", "peaceful", "inspired", "introspective"]', 'When seeking deeper understanding', 'When feeling disconnected from others'),
  
  ('#FF1493', 'Deep Pink', '["playful", "bold", "confident", "expressive"]', 'Boosts confidence, encourages self-expression and playfulness.', 'Modern association with boldness and self-expression.', '["happy", "energetic", "confident", "excited"]', 'When needing to express yourself boldly', 'When feeling overly emotional'),
  
  ('#00CED1', 'Turquoise', '["clear", "refreshing", "communicative", "healing"]', 'Promotes clear communication, emotional healing, and refreshment.', 'Associated with tropical waters. Represents clarity and healing.', '["calm", "peaceful", "clear", "refreshed"]', 'When needing emotional healing or clarity', 'When feeling cold or detached');

-- Initialize default user gamification
INSERT OR IGNORE INTO user_gamification (user_id, total_points, current_level, points_to_next_level, current_streak, longest_streak) 
VALUES (1, 0, 1, 100, 0, 0);

-- Insert sample AI wellness tip (for testing)
INSERT OR IGNORE INTO ai_wellness_tips (id, user_id, tip_text, category, mood_context, ai_model)
VALUES (1, 1, 'Based on your recent moods, try a 5-minute breathing exercise. Deep breathing can help reduce stress and improve mood within minutes.', 'mindfulness', '{"recent_moods": ["stressed", "anxious"]}', 'gpt-4');
