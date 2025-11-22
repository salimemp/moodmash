-- Seed data for Social Feed

-- Create demo user profile
INSERT OR IGNORE INTO user_profiles (user_id, display_name, bio, profile_visibility, total_posts, total_followers, total_following)
VALUES (1, 'Demo User', 'Exploring emotional wellness and sharing my journey 🌟', 'public', 0, 0, 0);

-- Create feed preferences for user
INSERT OR IGNORE INTO feed_preferences (user_id, show_friends_only, show_public_posts, notify_on_like, notify_on_comment)
VALUES (1, FALSE, TRUE, TRUE, TRUE);

-- Create some sample social posts
INSERT OR IGNORE INTO social_posts (id, user_id, content, emotion, emotion_intensity, visibility, like_count, comment_count) VALUES
  (1, 1, 'Feeling grateful today! ☀️ Morning meditation really helped set a positive tone for the day. #mindfulness #gratitude', 'happy', 4, 'public', 12, 3),
  (2, 1, 'Having a tough day but trying to stay positive. Remember: it''s okay to not be okay. Taking things one step at a time. 💙', 'sad', 3, 'public', 8, 5),
  (3, 1, 'Just finished an amazing workout! Exercise really does boost your mood. Feeling energized and ready to tackle the day! 💪', 'energetic', 5, 'public', 15, 2),
  (4, 1, 'Practicing self-compassion today. Being kind to yourself is just as important as being kind to others. 🌸 #selfcare', 'peaceful', 4, 'public', 10, 4),
  (5, 1, 'Feeling a bit anxious about upcoming deadlines, but breaking tasks into smaller steps is helping. Anyone else dealing with similar feelings?', 'anxious', 3, 'public', 6, 7);

-- Add some sample comments
INSERT OR IGNORE INTO social_post_comments (post_id, user_id, content, like_count) VALUES
  (1, 1, 'Meditation has been life-changing for me too!', 2),
  (2, 1, 'You''re doing great! Keep pushing forward 💪', 3),
  (2, 1, 'Thank you for sharing this. It helps to know others feel this way too.', 4),
  (3, 1, 'What kind of workout did you do? Looking for inspiration!', 1),
  (4, 1, 'This is so important! Self-compassion is a practice we all need.', 3),
  (5, 1, 'Same here! Breaking it down really helps manage the stress.', 2);

-- Add some sample likes (user liking their own posts for demo)
INSERT OR IGNORE INTO social_post_likes (post_id, user_id) VALUES
  (1, 1),
  (2, 1),
  (3, 1);
