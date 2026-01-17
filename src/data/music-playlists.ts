// Music Therapy Playlists Data - 35+ Curated Playlists
// Categories: calming, energizing, focus, sleep, anxiety, depression, meditation, nature, binaural, classical, ambient

export interface MusicPlaylist {
  id: string;
  title: string;
  titleKey: string;
  description: string;
  descriptionKey: string;
  category: string;
  moodTags: string[];
  duration: number; // total duration in seconds
  trackCount: number;
  tracks: MusicTrack[];
  isPremium: boolean;
}

export interface MusicTrack {
  id: string;
  title: string;
  titleKey?: string;
  artist: string;
  duration: number; // in seconds
  category: string;
  moodTags: string[];
  bpm?: number;
  key?: string;
  description?: string;
}

export const musicPlaylists: MusicPlaylist[] = [
  // ==================== CALMING & RELAXATION ====================
  {
    id: 'playlist_calm_mind',
    title: 'Calm Your Mind',
    titleKey: 'music.playlist.calm_mind',
    description: 'Peaceful melodies to quiet your thoughts and find serenity.',
    descriptionKey: 'music.playlist.calm_mind_desc',
    category: 'calming',
    moodTags: ['relaxed', 'peaceful', 'calm', 'serene'],
    duration: 3600,
    trackCount: 12,
    tracks: [
      { id: 'track_calm_1', title: 'Gentle Waves', artist: 'Ambient Dreams', duration: 300, category: 'calming', moodTags: ['peaceful', 'serene'], bpm: 60 },
      { id: 'track_calm_2', title: 'Floating Clouds', artist: 'Nature\'s Melody', duration: 280, category: 'calming', moodTags: ['dreamy', 'light'], bpm: 55 },
      { id: 'track_calm_3', title: 'Silent Sunset', artist: 'Peaceful Piano', duration: 320, category: 'calming', moodTags: ['warm', 'peaceful'], bpm: 65 },
      { id: 'track_calm_4', title: 'Mountain Stillness', artist: 'Zen Garden', duration: 290, category: 'calming', moodTags: ['grounding', 'stable'], bpm: 50 },
      { id: 'track_calm_5', title: 'Soft Rain Falls', artist: 'Rain Sounds', duration: 300, category: 'calming', moodTags: ['soothing', 'cleansing'], bpm: 58 },
      { id: 'track_calm_6', title: 'Candlelight Glow', artist: 'Evening Rest', duration: 310, category: 'calming', moodTags: ['warm', 'cozy'], bpm: 52 },
      { id: 'track_calm_7', title: 'Drifting Leaves', artist: 'Autumn Dreams', duration: 295, category: 'calming', moodTags: ['gentle', 'nostalgic'], bpm: 60 },
      { id: 'track_calm_8', title: 'Starlight Meditation', artist: 'Night Sky', duration: 330, category: 'calming', moodTags: ['ethereal', 'spacious'], bpm: 48 },
      { id: 'track_calm_9', title: 'Garden of Peace', artist: 'Zen Garden', duration: 285, category: 'calming', moodTags: ['harmonious', 'balanced'], bpm: 55 },
      { id: 'track_calm_10', title: 'Still Waters', artist: 'Lake Sounds', duration: 340, category: 'calming', moodTags: ['reflective', 'quiet'], bpm: 45 },
      { id: 'track_calm_11', title: 'Moonlit Path', artist: 'Night Walker', duration: 275, category: 'calming', moodTags: ['mysterious', 'peaceful'], bpm: 58 },
      { id: 'track_calm_12', title: 'Inner Sanctuary', artist: 'Meditation Music', duration: 275, category: 'calming', moodTags: ['safe', 'protected'], bpm: 50 }
    ],
    isPremium: false
  },
  {
    id: 'playlist_peaceful_piano',
    title: 'Peaceful Piano',
    titleKey: 'music.playlist.peaceful_piano',
    description: 'Beautiful piano melodies for relaxation and reflection.',
    descriptionKey: 'music.playlist.peaceful_piano_desc',
    category: 'calming',
    moodTags: ['peaceful', 'reflective', 'gentle', 'beautiful'],
    duration: 3600,
    trackCount: 10,
    tracks: [
      { id: 'track_piano_1', title: 'Moonlight Sonata (Adagio)', artist: 'Classical Piano', duration: 360, category: 'calming', moodTags: ['melancholic', 'beautiful'], bpm: 55 },
      { id: 'track_piano_2', title: 'River Flows in You', artist: 'Yiruma Style', duration: 340, category: 'calming', moodTags: ['flowing', 'emotional'], bpm: 68 },
      { id: 'track_piano_3', title: 'Comptine d\'un Autre Été', artist: 'French Piano', duration: 320, category: 'calming', moodTags: ['nostalgic', 'dreamy'], bpm: 70 },
      { id: 'track_piano_4', title: 'Clair de Lune', artist: 'Classical Masters', duration: 380, category: 'calming', moodTags: ['ethereal', 'romantic'], bpm: 50 },
      { id: 'track_piano_5', title: 'Gymnopédie No.1', artist: 'Erik Satie Style', duration: 300, category: 'calming', moodTags: ['minimal', 'contemplative'], bpm: 45 },
      { id: 'track_piano_6', title: 'Kiss the Rain', artist: 'Yiruma Style', duration: 350, category: 'calming', moodTags: ['romantic', 'gentle'], bpm: 60 },
      { id: 'track_piano_7', title: 'Nocturne in E-flat', artist: 'Chopin Style', duration: 420, category: 'calming', moodTags: ['elegant', 'dreamy'], bpm: 55 },
      { id: 'track_piano_8', title: 'A Walk in the Forest', artist: 'Nature Piano', duration: 380, category: 'calming', moodTags: ['peaceful', 'natural'], bpm: 65 },
      { id: 'track_piano_9', title: 'Raindrop Prelude', artist: 'Chopin Style', duration: 360, category: 'calming', moodTags: ['melancholic', 'introspective'], bpm: 58 },
      { id: 'track_piano_10', title: 'Evening Reflection', artist: 'Solo Piano', duration: 390, category: 'calming', moodTags: ['reflective', 'calm'], bpm: 52 }
    ],
    isPremium: false
  },
  {
    id: 'playlist_stress_relief',
    title: 'Stress Relief',
    titleKey: 'music.playlist.stress_relief',
    description: 'Soothing sounds to melt away tension and stress.',
    descriptionKey: 'music.playlist.stress_relief_desc',
    category: 'calming',
    moodTags: ['relieved', 'relaxed', 'calm', 'tension-free'],
    duration: 3000,
    trackCount: 10,
    tracks: [
      { id: 'track_stress_1', title: 'Tension Release', artist: 'Healing Sounds', duration: 300, category: 'calming', moodTags: ['releasing', 'freeing'], bpm: 55 },
      { id: 'track_stress_2', title: 'Let It Go', artist: 'Relaxation Music', duration: 320, category: 'calming', moodTags: ['surrendering', 'peaceful'], bpm: 50 },
      { id: 'track_stress_3', title: 'Breathe Easy', artist: 'Breath Work', duration: 280, category: 'calming', moodTags: ['breathing', 'open'], bpm: 45 },
      { id: 'track_stress_4', title: 'Weightless', artist: 'Float Music', duration: 290, category: 'calming', moodTags: ['light', 'floating'], bpm: 60 },
      { id: 'track_stress_5', title: 'Peaceful Mind', artist: 'Meditation Sounds', duration: 310, category: 'calming', moodTags: ['quiet', 'still'], bpm: 48 },
      { id: 'track_stress_6', title: 'Calm Waters', artist: 'Nature Therapy', duration: 300, category: 'calming', moodTags: ['flowing', 'soothing'], bpm: 52 },
      { id: 'track_stress_7', title: 'Safe Haven', artist: 'Comfort Sounds', duration: 320, category: 'calming', moodTags: ['safe', 'protected'], bpm: 55 },
      { id: 'track_stress_8', title: 'Unwind', artist: 'Evening Relaxation', duration: 290, category: 'calming', moodTags: ['unwinding', 'releasing'], bpm: 50 },
      { id: 'track_stress_9', title: 'Inner Peace', artist: 'Zen Music', duration: 300, category: 'calming', moodTags: ['peaceful', 'centered'], bpm: 45 },
      { id: 'track_stress_10', title: 'Serenity Now', artist: 'Calm Collection', duration: 290, category: 'calming', moodTags: ['serene', 'tranquil'], bpm: 48 }
    ],
    isPremium: false
  },

  // ==================== ENERGIZING & UPLIFTING ====================
  {
    id: 'playlist_morning_motivation',
    title: 'Morning Motivation',
    titleKey: 'music.playlist.morning_motivation',
    description: 'Start your day with energy and positivity.',
    descriptionKey: 'music.playlist.morning_motivation_desc',
    category: 'energizing',
    moodTags: ['energized', 'motivated', 'positive', 'uplifted'],
    duration: 3000,
    trackCount: 10,
    tracks: [
      { id: 'track_morning_1', title: 'Rise and Shine', artist: 'Morning Glory', duration: 300, category: 'energizing', moodTags: ['awakening', 'fresh'], bpm: 110 },
      { id: 'track_morning_2', title: 'New Day Rising', artist: 'Sunrise Sounds', duration: 280, category: 'energizing', moodTags: ['hopeful', 'bright'], bpm: 115 },
      { id: 'track_morning_3', title: 'Limitless', artist: 'Motivation Music', duration: 320, category: 'energizing', moodTags: ['powerful', 'unlimited'], bpm: 120 },
      { id: 'track_morning_4', title: 'Good Vibes Only', artist: 'Positive Beats', duration: 290, category: 'energizing', moodTags: ['positive', 'happy'], bpm: 108 },
      { id: 'track_morning_5', title: 'Unstoppable', artist: 'Power Tracks', duration: 310, category: 'energizing', moodTags: ['determined', 'strong'], bpm: 125 },
      { id: 'track_morning_6', title: 'Sunrise Energy', artist: 'Dawn Beats', duration: 300, category: 'energizing', moodTags: ['fresh', 'energizing'], bpm: 112 },
      { id: 'track_morning_7', title: 'Champion Mind', artist: 'Victory Music', duration: 320, category: 'energizing', moodTags: ['winning', 'confident'], bpm: 118 },
      { id: 'track_morning_8', title: 'Seize the Day', artist: 'Motivation Mix', duration: 280, category: 'energizing', moodTags: ['ambitious', 'driven'], bpm: 122 },
      { id: 'track_morning_9', title: 'Bright Future', artist: 'Optimism Sounds', duration: 300, category: 'energizing', moodTags: ['optimistic', 'forward'], bpm: 110 },
      { id: 'track_morning_10', title: 'Ready Set Go', artist: 'Start Strong', duration: 300, category: 'energizing', moodTags: ['ready', 'prepared'], bpm: 128 }
    ],
    isPremium: false
  },
  {
    id: 'playlist_happy_vibes',
    title: 'Happy Vibes',
    titleKey: 'music.playlist.happy_vibes',
    description: 'Cheerful tunes to boost your mood instantly.',
    descriptionKey: 'music.playlist.happy_vibes_desc',
    category: 'energizing',
    moodTags: ['happy', 'joyful', 'cheerful', 'upbeat'],
    duration: 3200,
    trackCount: 10,
    tracks: [
      { id: 'track_happy_1', title: 'Walking on Sunshine', artist: 'Happy Beats', duration: 310, category: 'energizing', moodTags: ['sunny', 'bright'], bpm: 115 },
      { id: 'track_happy_2', title: 'Pure Joy', artist: 'Joyful Sounds', duration: 290, category: 'energizing', moodTags: ['joyful', 'pure'], bpm: 120 },
      { id: 'track_happy_3', title: 'Dancing Heart', artist: 'Feel Good Music', duration: 320, category: 'energizing', moodTags: ['dancing', 'light'], bpm: 118 },
      { id: 'track_happy_4', title: 'Smile', artist: 'Positive Vibes', duration: 280, category: 'energizing', moodTags: ['smiling', 'warm'], bpm: 105 },
      { id: 'track_happy_5', title: 'Summer Feeling', artist: 'Beach Sounds', duration: 340, category: 'energizing', moodTags: ['summer', 'free'], bpm: 110 },
      { id: 'track_happy_6', title: 'Celebrate Life', artist: 'Party Music', duration: 330, category: 'energizing', moodTags: ['celebrating', 'alive'], bpm: 125 },
      { id: 'track_happy_7', title: 'Grateful Heart', artist: 'Thankful Tunes', duration: 300, category: 'energizing', moodTags: ['grateful', 'blessed'], bpm: 100 },
      { id: 'track_happy_8', title: 'Carefree Days', artist: 'Freedom Music', duration: 320, category: 'energizing', moodTags: ['carefree', 'easy'], bpm: 112 },
      { id: 'track_happy_9', title: 'Rainbow After Rain', artist: 'Hope Music', duration: 310, category: 'energizing', moodTags: ['hopeful', 'colorful'], bpm: 108 },
      { id: 'track_happy_10', title: 'Best Day Ever', artist: 'Perfect Day', duration: 300, category: 'energizing', moodTags: ['perfect', 'memorable'], bpm: 115 }
    ],
    isPremium: false
  },
  {
    id: 'playlist_workout_boost',
    title: 'Workout Boost',
    titleKey: 'music.playlist.workout_boost',
    description: 'High-energy tracks to power your workout.',
    descriptionKey: 'music.playlist.workout_boost_desc',
    category: 'energizing',
    moodTags: ['energized', 'powerful', 'strong', 'pumped'],
    duration: 2700,
    trackCount: 9,
    tracks: [
      { id: 'track_workout_1', title: 'Power Up', artist: 'Fitness Beats', duration: 300, category: 'energizing', moodTags: ['powerful', 'intense'], bpm: 140 },
      { id: 'track_workout_2', title: 'Beast Mode', artist: 'Gym Music', duration: 280, category: 'energizing', moodTags: ['fierce', 'determined'], bpm: 145 },
      { id: 'track_workout_3', title: 'Push Harder', artist: 'Motivation Mix', duration: 320, category: 'energizing', moodTags: ['pushing', 'driven'], bpm: 138 },
      { id: 'track_workout_4', title: 'No Limits', artist: 'Extreme Beats', duration: 290, category: 'energizing', moodTags: ['unlimited', 'free'], bpm: 142 },
      { id: 'track_workout_5', title: 'Runner\'s High', artist: 'Cardio Tracks', duration: 310, category: 'energizing', moodTags: ['euphoric', 'flowing'], bpm: 150 },
      { id: 'track_workout_6', title: 'Strength Within', artist: 'Power Music', duration: 300, category: 'energizing', moodTags: ['strong', 'inner'], bpm: 135 },
      { id: 'track_workout_7', title: 'Victory Lap', artist: 'Champion Beats', duration: 280, category: 'energizing', moodTags: ['winning', 'triumphant'], bpm: 148 },
      { id: 'track_workout_8', title: 'Adrenaline Rush', artist: 'Energy Music', duration: 320, category: 'energizing', moodTags: ['excited', 'alive'], bpm: 155 },
      { id: 'track_workout_9', title: 'Final Push', artist: 'Finish Strong', duration: 300, category: 'energizing', moodTags: ['determined', 'finishing'], bpm: 152 }
    ],
    isPremium: false
  },

  // ==================== FOCUS & CONCENTRATION ====================
  {
    id: 'playlist_focus_flow',
    title: 'Focus Flow',
    titleKey: 'music.playlist.focus_flow',
    description: 'Enhance concentration and productivity with these tracks.',
    descriptionKey: 'music.playlist.focus_flow_desc',
    category: 'focus',
    moodTags: ['focused', 'productive', 'concentrated', 'clear'],
    duration: 3600,
    trackCount: 12,
    tracks: [
      { id: 'track_focus_1', title: 'Deep Work', artist: 'Productivity Music', duration: 300, category: 'focus', moodTags: ['deep', 'absorbed'], bpm: 70 },
      { id: 'track_focus_2', title: 'Crystal Clear', artist: 'Clarity Sounds', duration: 280, category: 'focus', moodTags: ['clear', 'sharp'], bpm: 72 },
      { id: 'track_focus_3', title: 'Flow State', artist: 'Zone Music', duration: 320, category: 'focus', moodTags: ['flowing', 'effortless'], bpm: 68 },
      { id: 'track_focus_4', title: 'Mind Machine', artist: 'Brain Beats', duration: 290, category: 'focus', moodTags: ['efficient', 'working'], bpm: 75 },
      { id: 'track_focus_5', title: 'Laser Focus', artist: 'Concentration Mix', duration: 310, category: 'focus', moodTags: ['sharp', 'precise'], bpm: 70 },
      { id: 'track_focus_6', title: 'Study Session', artist: 'Learning Music', duration: 300, category: 'focus', moodTags: ['learning', 'absorbing'], bpm: 65 },
      { id: 'track_focus_7', title: 'Code Flow', artist: 'Developer Beats', duration: 320, category: 'focus', moodTags: ['logical', 'systematic'], bpm: 72 },
      { id: 'track_focus_8', title: 'Creative Zone', artist: 'Innovation Music', duration: 280, category: 'focus', moodTags: ['creative', 'inspired'], bpm: 68 },
      { id: 'track_focus_9', title: 'Deadline Dash', artist: 'Productivity Plus', duration: 300, category: 'focus', moodTags: ['urgent', 'efficient'], bpm: 80 },
      { id: 'track_focus_10', title: 'Mental Clarity', artist: 'Brain Music', duration: 290, category: 'focus', moodTags: ['clear', 'organized'], bpm: 70 },
      { id: 'track_focus_11', title: 'Problem Solver', artist: 'Logic Sounds', duration: 310, category: 'focus', moodTags: ['analytical', 'solving'], bpm: 72 },
      { id: 'track_focus_12', title: 'Sustained Attention', artist: 'Focus Music', duration: 300, category: 'focus', moodTags: ['sustained', 'steady'], bpm: 68 }
    ],
    isPremium: false
  },
  {
    id: 'playlist_study_ambient',
    title: 'Study Ambient',
    titleKey: 'music.playlist.study_ambient',
    description: 'Background ambience perfect for studying and reading.',
    descriptionKey: 'music.playlist.study_ambient_desc',
    category: 'focus',
    moodTags: ['ambient', 'background', 'unobtrusive', 'studying'],
    duration: 4200,
    trackCount: 14,
    tracks: [
      { id: 'track_study_1', title: 'Library Atmosphere', artist: 'Ambient Study', duration: 300, category: 'focus', moodTags: ['quiet', 'academic'], bpm: 55 },
      { id: 'track_study_2', title: 'Gentle Background', artist: 'Study Music', duration: 300, category: 'focus', moodTags: ['subtle', 'supporting'], bpm: 58 },
      { id: 'track_study_3', title: 'Midnight Oil', artist: 'Late Study', duration: 300, category: 'focus', moodTags: ['nocturnal', 'dedicated'], bpm: 52 },
      { id: 'track_study_4', title: 'Bookstore Café', artist: 'Coffee Study', duration: 300, category: 'focus', moodTags: ['cozy', 'intellectual'], bpm: 60 },
      { id: 'track_study_5', title: 'Quiet Hours', artist: 'Silence Music', duration: 300, category: 'focus', moodTags: ['quiet', 'peaceful'], bpm: 50 },
      { id: 'track_study_6', title: 'Page Turner', artist: 'Reading Music', duration: 300, category: 'focus', moodTags: ['reading', 'absorbed'], bpm: 55 },
      { id: 'track_study_7', title: 'Exam Prep', artist: 'Student Sounds', duration: 300, category: 'focus', moodTags: ['preparing', 'focused'], bpm: 62 },
      { id: 'track_study_8', title: 'Knowledge Flow', artist: 'Learning Beats', duration: 300, category: 'focus', moodTags: ['learning', 'flowing'], bpm: 58 },
      { id: 'track_study_9', title: 'Concentration Room', artist: 'Focus Space', duration: 300, category: 'focus', moodTags: ['concentrated', 'dedicated'], bpm: 55 },
      { id: 'track_study_10', title: 'Academic Calm', artist: 'Scholar Music', duration: 300, category: 'focus', moodTags: ['scholarly', 'calm'], bpm: 52 },
      { id: 'track_study_11', title: 'Research Mode', artist: 'Deep Study', duration: 300, category: 'focus', moodTags: ['researching', 'thorough'], bpm: 58 },
      { id: 'track_study_12', title: 'Memory Palace', artist: 'Retention Music', duration: 300, category: 'focus', moodTags: ['remembering', 'storing'], bpm: 55 },
      { id: 'track_study_13', title: 'Final Review', artist: 'Study Session', duration: 300, category: 'focus', moodTags: ['reviewing', 'consolidating'], bpm: 60 },
      { id: 'track_study_14', title: 'Success Mindset', artist: 'Achievement Music', duration: 300, category: 'focus', moodTags: ['successful', 'confident'], bpm: 62 }
    ],
    isPremium: false
  },

  // ==================== SLEEP & DEEP REST ====================
  {
    id: 'playlist_deep_sleep',
    title: 'Deep Sleep',
    titleKey: 'music.playlist.deep_sleep',
    description: 'Drift into the deepest, most restful sleep.',
    descriptionKey: 'music.playlist.deep_sleep_desc',
    category: 'sleep',
    moodTags: ['sleepy', 'drowsy', 'resting', 'dreamy'],
    duration: 5400,
    trackCount: 10,
    tracks: [
      { id: 'track_sleep_1', title: 'Dreamland', artist: 'Sleep Music', duration: 540, category: 'sleep', moodTags: ['dreaming', 'floating'], bpm: 40 },
      { id: 'track_sleep_2', title: 'Starry Night', artist: 'Night Sky', duration: 540, category: 'sleep', moodTags: ['cosmic', 'peaceful'], bpm: 42 },
      { id: 'track_sleep_3', title: 'Ocean Lullaby', artist: 'Wave Sounds', duration: 540, category: 'sleep', moodTags: ['rhythmic', 'soothing'], bpm: 38 },
      { id: 'track_sleep_4', title: 'Midnight Clouds', artist: 'Dream Music', duration: 540, category: 'sleep', moodTags: ['soft', 'ethereal'], bpm: 45 },
      { id: 'track_sleep_5', title: 'Sleep Sanctuary', artist: 'Rest Sounds', duration: 540, category: 'sleep', moodTags: ['safe', 'protected'], bpm: 40 },
      { id: 'track_sleep_6', title: 'Night Whispers', artist: 'Quiet Hours', duration: 540, category: 'sleep', moodTags: ['gentle', 'quiet'], bpm: 35 },
      { id: 'track_sleep_7', title: 'Deep Rest', artist: 'Sleep Therapy', duration: 540, category: 'sleep', moodTags: ['deep', 'restorative'], bpm: 38 },
      { id: 'track_sleep_8', title: 'Peaceful Slumber', artist: 'Rest Music', duration: 540, category: 'sleep', moodTags: ['peaceful', 'calm'], bpm: 42 },
      { id: 'track_sleep_9', title: 'Dream Weaver', artist: 'Night Dreams', duration: 540, category: 'sleep', moodTags: ['dreaming', 'weaving'], bpm: 40 },
      { id: 'track_sleep_10', title: 'Endless Night', artist: 'Dark Hours', duration: 540, category: 'sleep', moodTags: ['dark', 'infinite'], bpm: 35 }
    ],
    isPremium: false
  },
  {
    id: 'playlist_sleep_stories',
    title: 'Sleep Stories Ambience',
    titleKey: 'music.playlist.sleep_stories',
    description: 'Gentle background music for bedtime stories.',
    descriptionKey: 'music.playlist.sleep_stories_desc',
    category: 'sleep',
    moodTags: ['story', 'gentle', 'magical', 'sleepy'],
    duration: 3600,
    trackCount: 8,
    tracks: [
      { id: 'track_story_1', title: 'Once Upon a Time', artist: 'Story Music', duration: 450, category: 'sleep', moodTags: ['magical', 'beginning'], bpm: 50 },
      { id: 'track_story_2', title: 'Enchanted Forest', artist: 'Fairy Tales', duration: 450, category: 'sleep', moodTags: ['mystical', 'wonder'], bpm: 48 },
      { id: 'track_story_3', title: 'Castle Dreams', artist: 'Kingdom Music', duration: 450, category: 'sleep', moodTags: ['royal', 'dreamy'], bpm: 45 },
      { id: 'track_story_4', title: 'Magic Carpet Ride', artist: 'Adventure Music', duration: 450, category: 'sleep', moodTags: ['flying', 'magical'], bpm: 52 },
      { id: 'track_story_5', title: 'Starlight Journey', artist: 'Space Dreams', duration: 450, category: 'sleep', moodTags: ['cosmic', 'traveling'], bpm: 45 },
      { id: 'track_story_6', title: 'Underwater Palace', artist: 'Ocean Tales', duration: 450, category: 'sleep', moodTags: ['aquatic', 'mysterious'], bpm: 48 },
      { id: 'track_story_7', title: 'Cloud Kingdom', artist: 'Sky Stories', duration: 450, category: 'sleep', moodTags: ['floating', 'heavenly'], bpm: 42 },
      { id: 'track_story_8', title: 'Happy Ending', artist: 'Story Complete', duration: 450, category: 'sleep', moodTags: ['satisfied', 'complete'], bpm: 40 }
    ],
    isPremium: false
  },

  // ==================== ANXIETY RELIEF ====================
  {
    id: 'playlist_anxiety_relief',
    title: 'Anxiety Relief',
    titleKey: 'music.playlist.anxiety_relief',
    description: 'Calming music to ease anxious feelings.',
    descriptionKey: 'music.playlist.anxiety_relief_desc',
    category: 'anxiety',
    moodTags: ['calm', 'safe', 'grounded', 'eased'],
    duration: 3600,
    trackCount: 12,
    tracks: [
      { id: 'track_anxiety_1', title: 'Safe Space', artist: 'Calm Music', duration: 300, category: 'anxiety', moodTags: ['safe', 'protected'], bpm: 55 },
      { id: 'track_anxiety_2', title: 'Grounding Earth', artist: 'Nature Therapy', duration: 300, category: 'anxiety', moodTags: ['grounded', 'stable'], bpm: 50 },
      { id: 'track_anxiety_3', title: 'Slow Breath', artist: 'Breathing Music', duration: 300, category: 'anxiety', moodTags: ['breathing', 'slow'], bpm: 45 },
      { id: 'track_anxiety_4', title: 'You Are Okay', artist: 'Reassurance Sounds', duration: 300, category: 'anxiety', moodTags: ['reassured', 'okay'], bpm: 52 },
      { id: 'track_anxiety_5', title: 'Gentle Release', artist: 'Let Go Music', duration: 300, category: 'anxiety', moodTags: ['releasing', 'gentle'], bpm: 48 },
      { id: 'track_anxiety_6', title: 'Present Moment', artist: 'Now Music', duration: 300, category: 'anxiety', moodTags: ['present', 'here'], bpm: 50 },
      { id: 'track_anxiety_7', title: 'This Will Pass', artist: 'Comfort Sounds', duration: 300, category: 'anxiety', moodTags: ['temporary', 'passing'], bpm: 55 },
      { id: 'track_anxiety_8', title: 'Peaceful Heart', artist: 'Heart Music', duration: 300, category: 'anxiety', moodTags: ['peaceful', 'calm'], bpm: 52 },
      { id: 'track_anxiety_9', title: 'Worry Free', artist: 'Freedom Music', duration: 300, category: 'anxiety', moodTags: ['free', 'light'], bpm: 58 },
      { id: 'track_anxiety_10', title: 'Inner Strength', artist: 'Courage Music', duration: 300, category: 'anxiety', moodTags: ['strong', 'capable'], bpm: 55 },
      { id: 'track_anxiety_11', title: 'Comfort Zone', artist: 'Safety Sounds', duration: 300, category: 'anxiety', moodTags: ['comfortable', 'secure'], bpm: 50 },
      { id: 'track_anxiety_12', title: 'All Is Well', artist: 'Wellbeing Music', duration: 300, category: 'anxiety', moodTags: ['well', 'balanced'], bpm: 48 }
    ],
    isPremium: false
  },
  {
    id: 'playlist_panic_support',
    title: 'Panic Support',
    titleKey: 'music.playlist.panic_support',
    description: 'Specially designed for moments of acute anxiety.',
    descriptionKey: 'music.playlist.panic_support_desc',
    category: 'anxiety',
    moodTags: ['calming', 'grounding', 'supportive', 'steady'],
    duration: 1800,
    trackCount: 6,
    tracks: [
      { id: 'track_panic_1', title: 'You Are Safe', artist: 'Emergency Calm', duration: 300, category: 'anxiety', moodTags: ['safe', 'immediate'], bpm: 50 },
      { id: 'track_panic_2', title: 'Breathe With Me', artist: 'Guided Breath', duration: 300, category: 'anxiety', moodTags: ['breathing', 'together'], bpm: 48 },
      { id: 'track_panic_3', title: 'Ground and Center', artist: 'Grounding Sounds', duration: 300, category: 'anxiety', moodTags: ['grounded', 'centered'], bpm: 45 },
      { id: 'track_panic_4', title: 'Slow Down', artist: 'Pace Music', duration: 300, category: 'anxiety', moodTags: ['slowing', 'calming'], bpm: 42 },
      { id: 'track_panic_5', title: 'You\'ve Got This', artist: 'Support Sounds', duration: 300, category: 'anxiety', moodTags: ['capable', 'supported'], bpm: 50 },
      { id: 'track_panic_6', title: 'Return to Calm', artist: 'Recovery Music', duration: 300, category: 'anxiety', moodTags: ['returning', 'recovering'], bpm: 48 }
    ],
    isPremium: false
  },

  // ==================== DEPRESSION SUPPORT ====================
  {
    id: 'playlist_gentle_lift',
    title: 'Gentle Lift',
    titleKey: 'music.playlist.gentle_lift',
    description: 'Soft, uplifting music for low moments.',
    descriptionKey: 'music.playlist.gentle_lift_desc',
    category: 'depression',
    moodTags: ['hopeful', 'gentle', 'supportive', 'warming'],
    duration: 3600,
    trackCount: 12,
    tracks: [
      { id: 'track_lift_1', title: 'First Light', artist: 'Hope Music', duration: 300, category: 'depression', moodTags: ['dawn', 'beginning'], bpm: 65 },
      { id: 'track_lift_2', title: 'Small Steps', artist: 'Progress Sounds', duration: 300, category: 'depression', moodTags: ['progress', 'gentle'], bpm: 68 },
      { id: 'track_lift_3', title: 'You Matter', artist: 'Worth Music', duration: 300, category: 'depression', moodTags: ['valued', 'important'], bpm: 62 },
      { id: 'track_lift_4', title: 'Tomorrow Comes', artist: 'Future Music', duration: 300, category: 'depression', moodTags: ['future', 'hopeful'], bpm: 70 },
      { id: 'track_lift_5', title: 'Warmth Inside', artist: 'Inner Light', duration: 300, category: 'depression', moodTags: ['warm', 'inner'], bpm: 65 },
      { id: 'track_lift_6', title: 'Not Alone', artist: 'Connection Music', duration: 300, category: 'depression', moodTags: ['connected', 'together'], bpm: 68 },
      { id: 'track_lift_7', title: 'Keep Going', artist: 'Persistence Music', duration: 300, category: 'depression', moodTags: ['continuing', 'brave'], bpm: 72 },
      { id: 'track_lift_8', title: 'Rays of Light', artist: 'Sunshine Music', duration: 300, category: 'depression', moodTags: ['light', 'breaking through'], bpm: 70 },
      { id: 'track_lift_9', title: 'Self-Compassion', artist: 'Kind Music', duration: 300, category: 'depression', moodTags: ['kind', 'compassionate'], bpm: 62 },
      { id: 'track_lift_10', title: 'One Day at a Time', artist: 'Present Music', duration: 300, category: 'depression', moodTags: ['present', 'manageable'], bpm: 65 },
      { id: 'track_lift_11', title: 'You Are Enough', artist: 'Affirmation Music', duration: 300, category: 'depression', moodTags: ['enough', 'worthy'], bpm: 68 },
      { id: 'track_lift_12', title: 'Better Days Ahead', artist: 'Future Hope', duration: 300, category: 'depression', moodTags: ['better', 'ahead'], bpm: 75 }
    ],
    isPremium: false
  },

  // ==================== MEDITATION MUSIC ====================
  {
    id: 'playlist_meditation_sounds',
    title: 'Meditation Sounds',
    titleKey: 'music.playlist.meditation_sounds',
    description: 'Perfect background music for your meditation practice.',
    descriptionKey: 'music.playlist.meditation_sounds_desc',
    category: 'meditation',
    moodTags: ['meditative', 'centered', 'present', 'spiritual'],
    duration: 3600,
    trackCount: 8,
    tracks: [
      { id: 'track_med_1', title: 'Om Shanti', artist: 'Meditation Masters', duration: 450, category: 'meditation', moodTags: ['sacred', 'peaceful'], bpm: 40 },
      { id: 'track_med_2', title: 'Tibetan Bowls', artist: 'Singing Bowls', duration: 450, category: 'meditation', moodTags: ['resonant', 'healing'], bpm: 35 },
      { id: 'track_med_3', title: 'Chakra Alignment', artist: 'Energy Music', duration: 450, category: 'meditation', moodTags: ['aligning', 'balanced'], bpm: 42 },
      { id: 'track_med_4', title: 'Third Eye Opening', artist: 'Insight Music', duration: 450, category: 'meditation', moodTags: ['intuitive', 'seeing'], bpm: 38 },
      { id: 'track_med_5', title: 'Heart Center', artist: 'Love Music', duration: 450, category: 'meditation', moodTags: ['loving', 'open'], bpm: 45 },
      { id: 'track_med_6', title: 'Breath of Life', artist: 'Prana Music', duration: 450, category: 'meditation', moodTags: ['breathing', 'alive'], bpm: 40 },
      { id: 'track_med_7', title: 'Divine Connection', artist: 'Spiritual Sounds', duration: 450, category: 'meditation', moodTags: ['connected', 'divine'], bpm: 38 },
      { id: 'track_med_8', title: 'Infinite Peace', artist: 'Zen Music', duration: 450, category: 'meditation', moodTags: ['infinite', 'peaceful'], bpm: 35 }
    ],
    isPremium: false
  },
  {
    id: 'playlist_yoga_flow',
    title: 'Yoga Flow',
    titleKey: 'music.playlist.yoga_flow',
    description: 'Accompaniment for your yoga practice.',
    descriptionKey: 'music.playlist.yoga_flow_desc',
    category: 'meditation',
    moodTags: ['flowing', 'moving', 'balanced', 'centered'],
    duration: 3600,
    trackCount: 10,
    tracks: [
      { id: 'track_yoga_1', title: 'Sun Salutation', artist: 'Yoga Music', duration: 360, category: 'meditation', moodTags: ['warming', 'flowing'], bpm: 65 },
      { id: 'track_yoga_2', title: 'Warrior Spirit', artist: 'Strength Music', duration: 360, category: 'meditation', moodTags: ['strong', 'focused'], bpm: 70 },
      { id: 'track_yoga_3', title: 'Balance Flow', artist: 'Equilibrium', duration: 360, category: 'meditation', moodTags: ['balanced', 'steady'], bpm: 62 },
      { id: 'track_yoga_4', title: 'Open Heart', artist: 'Heart Yoga', duration: 360, category: 'meditation', moodTags: ['open', 'loving'], bpm: 58 },
      { id: 'track_yoga_5', title: 'Twist and Release', artist: 'Release Music', duration: 360, category: 'meditation', moodTags: ['releasing', 'detoxing'], bpm: 55 },
      { id: 'track_yoga_6', title: 'Ground and Rise', artist: 'Earth Music', duration: 360, category: 'meditation', moodTags: ['grounded', 'rising'], bpm: 60 },
      { id: 'track_yoga_7', title: 'Breath Sync', artist: 'Pranayama Music', duration: 360, category: 'meditation', moodTags: ['breathing', 'synced'], bpm: 50 },
      { id: 'track_yoga_8', title: 'Flexibility Flow', artist: 'Stretch Music', duration: 360, category: 'meditation', moodTags: ['stretching', 'opening'], bpm: 55 },
      { id: 'track_yoga_9', title: 'Strength Within', artist: 'Power Yoga', duration: 360, category: 'meditation', moodTags: ['strong', 'inner'], bpm: 68 },
      { id: 'track_yoga_10', title: 'Savasana Rest', artist: 'Final Rest', duration: 360, category: 'meditation', moodTags: ['resting', 'integrating'], bpm: 40 }
    ],
    isPremium: false
  },

  // ==================== NATURE SOUNDS ====================
  {
    id: 'playlist_rain_thunder',
    title: 'Rain & Thunder',
    titleKey: 'music.playlist.rain_thunder',
    description: 'The soothing sounds of rain and gentle thunder.',
    descriptionKey: 'music.playlist.rain_thunder_desc',
    category: 'nature',
    moodTags: ['cozy', 'soothing', 'cleansing', 'natural'],
    duration: 5400,
    trackCount: 6,
    tracks: [
      { id: 'track_rain_1', title: 'Light Rain', artist: 'Nature Sounds', duration: 900, category: 'nature', moodTags: ['gentle', 'light'], bpm: 0 },
      { id: 'track_rain_2', title: 'Rain on Window', artist: 'Indoor Rain', duration: 900, category: 'nature', moodTags: ['cozy', 'safe'], bpm: 0 },
      { id: 'track_rain_3', title: 'Thunderstorm', artist: 'Storm Sounds', duration: 900, category: 'nature', moodTags: ['powerful', 'dramatic'], bpm: 0 },
      { id: 'track_rain_4', title: 'Distant Thunder', artist: 'Far Thunder', duration: 900, category: 'nature', moodTags: ['distant', 'rolling'], bpm: 0 },
      { id: 'track_rain_5', title: 'Rain on Leaves', artist: 'Forest Rain', duration: 900, category: 'nature', moodTags: ['natural', 'fresh'], bpm: 0 },
      { id: 'track_rain_6', title: 'Heavy Rain', artist: 'Downpour', duration: 900, category: 'nature', moodTags: ['intense', 'cleansing'], bpm: 0 }
    ],
    isPremium: false
  },
  {
    id: 'playlist_ocean_waves',
    title: 'Ocean Waves',
    titleKey: 'music.playlist.ocean_waves',
    description: 'The rhythmic sounds of the ocean.',
    descriptionKey: 'music.playlist.ocean_waves_desc',
    category: 'nature',
    moodTags: ['rhythmic', 'vast', 'soothing', 'timeless'],
    duration: 5400,
    trackCount: 6,
    tracks: [
      { id: 'track_ocean_1', title: 'Gentle Waves', artist: 'Ocean Sounds', duration: 900, category: 'nature', moodTags: ['gentle', 'rhythmic'], bpm: 0 },
      { id: 'track_ocean_2', title: 'Beach Ambience', artist: 'Shoreline', duration: 900, category: 'nature', moodTags: ['sandy', 'warm'], bpm: 0 },
      { id: 'track_ocean_3', title: 'Crashing Surf', artist: 'Big Waves', duration: 900, category: 'nature', moodTags: ['powerful', 'dynamic'], bpm: 0 },
      { id: 'track_ocean_4', title: 'Underwater Sounds', artist: 'Deep Ocean', duration: 900, category: 'nature', moodTags: ['deep', 'mysterious'], bpm: 0 },
      { id: 'track_ocean_5', title: 'Seaside Breeze', artist: 'Coastal Sounds', duration: 900, category: 'nature', moodTags: ['breezy', 'fresh'], bpm: 0 },
      { id: 'track_ocean_6', title: 'Night Ocean', artist: 'Midnight Waves', duration: 900, category: 'nature', moodTags: ['nocturnal', 'peaceful'], bpm: 0 }
    ],
    isPremium: false
  },
  {
    id: 'playlist_forest_ambience',
    title: 'Forest Ambience',
    titleKey: 'music.playlist.forest_ambience',
    description: 'Immerse yourself in the sounds of the forest.',
    descriptionKey: 'music.playlist.forest_ambience_desc',
    category: 'nature',
    moodTags: ['natural', 'peaceful', 'grounding', 'alive'],
    duration: 5400,
    trackCount: 6,
    tracks: [
      { id: 'track_forest_1', title: 'Morning Birds', artist: 'Forest Dawn', duration: 900, category: 'nature', moodTags: ['awakening', 'bright'], bpm: 0 },
      { id: 'track_forest_2', title: 'Forest Stream', artist: 'Woodland Water', duration: 900, category: 'nature', moodTags: ['flowing', 'fresh'], bpm: 0 },
      { id: 'track_forest_3', title: 'Wind in Trees', artist: 'Canopy Sounds', duration: 900, category: 'nature', moodTags: ['rustling', 'moving'], bpm: 0 },
      { id: 'track_forest_4', title: 'Rainforest', artist: 'Tropical Sounds', duration: 900, category: 'nature', moodTags: ['lush', 'tropical'], bpm: 0 },
      { id: 'track_forest_5', title: 'Night Forest', artist: 'Nocturnal Woods', duration: 900, category: 'nature', moodTags: ['mysterious', 'nocturnal'], bpm: 0 },
      { id: 'track_forest_6', title: 'Woodland Walk', artist: 'Forest Path', duration: 900, category: 'nature', moodTags: ['walking', 'exploring'], bpm: 0 }
    ],
    isPremium: false
  },
  {
    id: 'playlist_birdsong',
    title: 'Birdsong',
    titleKey: 'music.playlist.birdsong',
    description: 'Beautiful bird songs from around the world.',
    descriptionKey: 'music.playlist.birdsong_desc',
    category: 'nature',
    moodTags: ['joyful', 'natural', 'awakening', 'cheerful'],
    duration: 3600,
    trackCount: 6,
    tracks: [
      { id: 'track_bird_1', title: 'Dawn Chorus', artist: 'Morning Birds', duration: 600, category: 'nature', moodTags: ['awakening', 'joyful'], bpm: 0 },
      { id: 'track_bird_2', title: 'Songbirds', artist: 'Melodic Birds', duration: 600, category: 'nature', moodTags: ['melodic', 'beautiful'], bpm: 0 },
      { id: 'track_bird_3', title: 'Garden Birds', artist: 'Backyard Sounds', duration: 600, category: 'nature', moodTags: ['familiar', 'homey'], bpm: 0 },
      { id: 'track_bird_4', title: 'Tropical Birds', artist: 'Exotic Sounds', duration: 600, category: 'nature', moodTags: ['exotic', 'colorful'], bpm: 0 },
      { id: 'track_bird_5', title: 'Woodland Birds', artist: 'Forest Calls', duration: 600, category: 'nature', moodTags: ['natural', 'wild'], bpm: 0 },
      { id: 'track_bird_6', title: 'Evening Birds', artist: 'Sunset Songs', duration: 600, category: 'nature', moodTags: ['settling', 'peaceful'], bpm: 0 }
    ],
    isPremium: false
  },

  // ==================== BINAURAL BEATS ====================
  {
    id: 'playlist_binaural_focus',
    title: 'Binaural Beats - Focus',
    titleKey: 'music.playlist.binaural_focus',
    description: 'Beta waves to enhance concentration and alertness.',
    descriptionKey: 'music.playlist.binaural_focus_desc',
    category: 'binaural',
    moodTags: ['focused', 'alert', 'concentrated', 'sharp'],
    duration: 3600,
    trackCount: 4,
    tracks: [
      { id: 'track_bin_focus_1', title: 'Beta 14Hz Focus', artist: 'Brainwave Music', duration: 900, category: 'binaural', moodTags: ['alert', 'focused'], description: '14Hz beta waves for concentration' },
      { id: 'track_bin_focus_2', title: 'Beta 18Hz Concentration', artist: 'Neural Beats', duration: 900, category: 'binaural', moodTags: ['concentrated', 'sharp'], description: '18Hz beta waves for deep focus' },
      { id: 'track_bin_focus_3', title: 'Beta 20Hz Productivity', artist: 'Brain Boost', duration: 900, category: 'binaural', moodTags: ['productive', 'efficient'], description: '20Hz beta waves for productivity' },
      { id: 'track_bin_focus_4', title: 'Beta 16Hz Learning', artist: 'Study Beats', duration: 900, category: 'binaural', moodTags: ['learning', 'absorbing'], description: '16Hz beta waves for learning' }
    ],
    isPremium: true
  },
  {
    id: 'playlist_binaural_sleep',
    title: 'Binaural Beats - Sleep',
    titleKey: 'music.playlist.binaural_sleep',
    description: 'Delta waves to promote deep, restorative sleep.',
    descriptionKey: 'music.playlist.binaural_sleep_desc',
    category: 'binaural',
    moodTags: ['sleepy', 'relaxed', 'deep', 'restorative'],
    duration: 5400,
    trackCount: 4,
    tracks: [
      { id: 'track_bin_sleep_1', title: 'Delta 2Hz Deep Sleep', artist: 'Sleep Waves', duration: 1350, category: 'binaural', moodTags: ['deep', 'restorative'], description: '2Hz delta waves for deep sleep' },
      { id: 'track_bin_sleep_2', title: 'Delta 3Hz Healing', artist: 'Healing Beats', duration: 1350, category: 'binaural', moodTags: ['healing', 'regenerating'], description: '3Hz delta waves for healing sleep' },
      { id: 'track_bin_sleep_3', title: 'Delta 1Hz Deep Rest', artist: 'Rest Waves', duration: 1350, category: 'binaural', moodTags: ['resting', 'peaceful'], description: '1Hz delta waves for deepest rest' },
      { id: 'track_bin_sleep_4', title: 'Theta to Delta', artist: 'Sleep Transition', duration: 1350, category: 'binaural', moodTags: ['transitioning', 'drifting'], description: 'Gradual transition from theta to delta' }
    ],
    isPremium: true
  },
  {
    id: 'playlist_binaural_meditation',
    title: 'Binaural Beats - Meditation',
    titleKey: 'music.playlist.binaural_meditation',
    description: 'Theta waves for deep meditation and insight.',
    descriptionKey: 'music.playlist.binaural_meditation_desc',
    category: 'binaural',
    moodTags: ['meditative', 'insightful', 'deep', 'spiritual'],
    duration: 3600,
    trackCount: 4,
    tracks: [
      { id: 'track_bin_med_1', title: 'Theta 6Hz Meditation', artist: 'Meditation Waves', duration: 900, category: 'binaural', moodTags: ['meditative', 'deep'], description: '6Hz theta waves for meditation' },
      { id: 'track_bin_med_2', title: 'Theta 7Hz Insight', artist: 'Insight Beats', duration: 900, category: 'binaural', moodTags: ['insightful', 'intuitive'], description: '7Hz theta waves for insight' },
      { id: 'track_bin_med_3', title: 'Theta 5Hz Deep State', artist: 'Deep Meditation', duration: 900, category: 'binaural', moodTags: ['deep', 'transcendent'], description: '5Hz theta waves for deep states' },
      { id: 'track_bin_med_4', title: 'Alpha-Theta Border', artist: 'Twilight State', duration: 900, category: 'binaural', moodTags: ['creative', 'visionary'], description: '8Hz alpha-theta border state' }
    ],
    isPremium: true
  },
  {
    id: 'playlist_binaural_relaxation',
    title: 'Binaural Beats - Relaxation',
    titleKey: 'music.playlist.binaural_relaxation',
    description: 'Alpha waves for calm alertness and relaxation.',
    descriptionKey: 'music.playlist.binaural_relaxation_desc',
    category: 'binaural',
    moodTags: ['relaxed', 'calm', 'alert', 'peaceful'],
    duration: 3600,
    trackCount: 4,
    tracks: [
      { id: 'track_bin_relax_1', title: 'Alpha 10Hz Relaxation', artist: 'Calm Waves', duration: 900, category: 'binaural', moodTags: ['relaxed', 'calm'], description: '10Hz alpha waves for relaxation' },
      { id: 'track_bin_relax_2', title: 'Alpha 8Hz Light Meditation', artist: 'Gentle Beats', duration: 900, category: 'binaural', moodTags: ['light', 'peaceful'], description: '8Hz alpha waves for light meditation' },
      { id: 'track_bin_relax_3', title: 'Alpha 12Hz Calm Alert', artist: 'Alert Relax', duration: 900, category: 'binaural', moodTags: ['alert', 'clear'], description: '12Hz alpha waves for calm alertness' },
      { id: 'track_bin_relax_4', title: 'Alpha 9Hz Flow State', artist: 'Flow Beats', duration: 900, category: 'binaural', moodTags: ['flowing', 'effortless'], description: '9Hz alpha waves for flow state' }
    ],
    isPremium: true
  },

  // ==================== CLASSICAL THERAPY ====================
  {
    id: 'playlist_classical_calm',
    title: 'Classical Calm',
    titleKey: 'music.playlist.classical_calm',
    description: 'Soothing classical pieces for relaxation.',
    descriptionKey: 'music.playlist.classical_calm_desc',
    category: 'classical',
    moodTags: ['elegant', 'sophisticated', 'calming', 'timeless'],
    duration: 3600,
    trackCount: 8,
    tracks: [
      { id: 'track_class_1', title: 'Air on G String', artist: 'Bach Style', duration: 450, category: 'classical', moodTags: ['serene', 'flowing'], bpm: 60 },
      { id: 'track_class_2', title: 'Adagio for Strings', artist: 'Barber Style', duration: 450, category: 'classical', moodTags: ['emotional', 'beautiful'], bpm: 45 },
      { id: 'track_class_3', title: 'Canon in D', artist: 'Pachelbel Style', duration: 450, category: 'classical', moodTags: ['harmonious', 'uplifting'], bpm: 65 },
      { id: 'track_class_4', title: 'Für Elise', artist: 'Beethoven Style', duration: 450, category: 'classical', moodTags: ['romantic', 'gentle'], bpm: 70 },
      { id: 'track_class_5', title: 'Morning Mood', artist: 'Grieg Style', duration: 450, category: 'classical', moodTags: ['fresh', 'awakening'], bpm: 55 },
      { id: 'track_class_6', title: 'Ave Maria', artist: 'Schubert Style', duration: 450, category: 'classical', moodTags: ['spiritual', 'peaceful'], bpm: 50 },
      { id: 'track_class_7', title: 'Swan Lake Theme', artist: 'Tchaikovsky Style', duration: 450, category: 'classical', moodTags: ['elegant', 'graceful'], bpm: 60 },
      { id: 'track_class_8', title: 'Prelude in C Major', artist: 'Bach Style', duration: 450, category: 'classical', moodTags: ['pure', 'simple'], bpm: 70 }
    ],
    isPremium: false
  },

  // ==================== AMBIENT SOUNDSCAPES ====================
  {
    id: 'playlist_ambient_space',
    title: 'Space Ambience',
    titleKey: 'music.playlist.ambient_space',
    description: 'Cosmic soundscapes for deep relaxation.',
    descriptionKey: 'music.playlist.ambient_space_desc',
    category: 'ambient',
    moodTags: ['cosmic', 'vast', 'ethereal', 'mysterious'],
    duration: 3600,
    trackCount: 6,
    tracks: [
      { id: 'track_space_1', title: 'Cosmic Drift', artist: 'Space Ambient', duration: 600, category: 'ambient', moodTags: ['floating', 'cosmic'], bpm: 40 },
      { id: 'track_space_2', title: 'Nebula Dreams', artist: 'Star Music', duration: 600, category: 'ambient', moodTags: ['dreamy', 'colorful'], bpm: 45 },
      { id: 'track_space_3', title: 'Event Horizon', artist: 'Deep Space', duration: 600, category: 'ambient', moodTags: ['mysterious', 'deep'], bpm: 35 },
      { id: 'track_space_4', title: 'Stargazer', artist: 'Night Sky', duration: 600, category: 'ambient', moodTags: ['wondering', 'vast'], bpm: 42 },
      { id: 'track_space_5', title: 'Interstellar Journey', artist: 'Voyager Sounds', duration: 600, category: 'ambient', moodTags: ['traveling', 'infinite'], bpm: 38 },
      { id: 'track_space_6', title: 'Solar Wind', artist: 'Sun Sounds', duration: 600, category: 'ambient', moodTags: ['warm', 'energetic'], bpm: 50 }
    ],
    isPremium: false
  },
  {
    id: 'playlist_ambient_drone',
    title: 'Ambient Drones',
    titleKey: 'music.playlist.ambient_drone',
    description: 'Deep, sustained tones for meditation and relaxation.',
    descriptionKey: 'music.playlist.ambient_drone_desc',
    category: 'ambient',
    moodTags: ['deep', 'sustained', 'grounding', 'immersive'],
    duration: 3600,
    trackCount: 4,
    tracks: [
      { id: 'track_drone_1', title: 'Earth Drone', artist: 'Drone Masters', duration: 900, category: 'ambient', moodTags: ['grounding', 'deep'], bpm: 0 },
      { id: 'track_drone_2', title: 'Harmonic Overtones', artist: 'Overtone Singing', duration: 900, category: 'ambient', moodTags: ['harmonic', 'rich'], bpm: 0 },
      { id: 'track_drone_3', title: 'Cathedral Resonance', artist: 'Sacred Spaces', duration: 900, category: 'ambient', moodTags: ['sacred', 'resonant'], bpm: 0 },
      { id: 'track_drone_4', title: 'Tibetan Bowl Drone', artist: 'Singing Bowls', duration: 900, category: 'ambient', moodTags: ['meditative', 'healing'], bpm: 0 }
    ],
    isPremium: false
  },

  // ==================== ADDITIONAL PLAYLISTS ====================
  {
    id: 'playlist_cafe_ambience',
    title: 'Café Ambience',
    titleKey: 'music.playlist.cafe_ambience',
    description: 'The cozy sounds of a coffee shop.',
    descriptionKey: 'music.playlist.cafe_ambience_desc',
    category: 'ambient',
    moodTags: ['cozy', 'social', 'productive', 'warm'],
    duration: 3600,
    trackCount: 6,
    tracks: [
      { id: 'track_cafe_1', title: 'Morning Coffee', artist: 'Café Sounds', duration: 600, category: 'ambient', moodTags: ['morning', 'warm'], bpm: 0 },
      { id: 'track_cafe_2', title: 'Espresso Machine', artist: 'Coffee Shop', duration: 600, category: 'ambient', moodTags: ['bustling', 'cozy'], bpm: 0 },
      { id: 'track_cafe_3', title: 'Quiet Corner', artist: 'Café Corner', duration: 600, category: 'ambient', moodTags: ['quiet', 'focused'], bpm: 0 },
      { id: 'track_cafe_4', title: 'Afternoon Latte', artist: 'Coffee Time', duration: 600, category: 'ambient', moodTags: ['relaxed', 'comfortable'], bpm: 0 },
      { id: 'track_cafe_5', title: 'Rainy Day Café', artist: 'Rainy Coffee', duration: 600, category: 'ambient', moodTags: ['rainy', 'introspective'], bpm: 0 },
      { id: 'track_cafe_6', title: 'Closing Time', artist: 'Evening Café', duration: 600, category: 'ambient', moodTags: ['winding down', 'peaceful'], bpm: 0 }
    ],
    isPremium: false
  },
  {
    id: 'playlist_fireplace',
    title: 'Cozy Fireplace',
    titleKey: 'music.playlist.fireplace',
    description: 'The warm, crackling sounds of a fireplace.',
    descriptionKey: 'music.playlist.fireplace_desc',
    category: 'nature',
    moodTags: ['warm', 'cozy', 'comforting', 'homey'],
    duration: 5400,
    trackCount: 3,
    tracks: [
      { id: 'track_fire_1', title: 'Crackling Fire', artist: 'Fireplace Sounds', duration: 1800, category: 'nature', moodTags: ['crackling', 'warm'], bpm: 0 },
      { id: 'track_fire_2', title: 'Fire and Rain', artist: 'Cozy Sounds', duration: 1800, category: 'nature', moodTags: ['combined', 'soothing'], bpm: 0 },
      { id: 'track_fire_3', title: 'Evening Fire', artist: 'Night Warmth', duration: 1800, category: 'nature', moodTags: ['evening', 'peaceful'], bpm: 0 }
    ],
    isPremium: false
  }
];

// Music categories with metadata
export const musicCategories = [
  { id: 'calming', name: 'Calming & Relaxation', nameKey: 'music.category.calming', icon: '😌', description: 'Find peace and tranquility' },
  { id: 'energizing', name: 'Energizing & Uplifting', nameKey: 'music.category.energizing', icon: '⚡', description: 'Boost your energy and mood' },
  { id: 'focus', name: 'Focus & Concentration', nameKey: 'music.category.focus', icon: '🎯', description: 'Enhance productivity' },
  { id: 'sleep', name: 'Sleep & Deep Rest', nameKey: 'music.category.sleep', icon: '😴', description: 'Drift into restful sleep' },
  { id: 'anxiety', name: 'Anxiety Relief', nameKey: 'music.category.anxiety', icon: '🌊', description: 'Calm anxious feelings' },
  { id: 'depression', name: 'Depression Support', nameKey: 'music.category.depression', icon: '🌅', description: 'Gentle lift for low moments' },
  { id: 'meditation', name: 'Meditation Music', nameKey: 'music.category.meditation', icon: '🧘', description: 'Support your practice' },
  { id: 'nature', name: 'Nature Sounds', nameKey: 'music.category.nature', icon: '🌲', description: 'Connect with nature' },
  { id: 'binaural', name: 'Binaural Beats', nameKey: 'music.category.binaural', icon: '🧠', description: 'Brainwave entrainment' },
  { id: 'classical', name: 'Classical Therapy', nameKey: 'music.category.classical', icon: '🎻', description: 'Timeless healing music' },
  { id: 'ambient', name: 'Ambient Soundscapes', nameKey: 'music.category.ambient', icon: '🌌', description: 'Immersive atmospheres' }
];

// Mood-based recommendations
export const moodMusicRecommendations: Record<string, string[]> = {
  happy: ['playlist_happy_vibes', 'playlist_morning_motivation'],
  sad: ['playlist_gentle_lift', 'playlist_peaceful_piano'],
  anxious: ['playlist_anxiety_relief', 'playlist_panic_support', 'playlist_calm_mind'],
  stressed: ['playlist_stress_relief', 'playlist_rain_thunder'],
  tired: ['playlist_deep_sleep', 'playlist_sleep_stories'],
  focused: ['playlist_focus_flow', 'playlist_study_ambient', 'playlist_binaural_focus'],
  energetic: ['playlist_workout_boost', 'playlist_morning_motivation'],
  calm: ['playlist_meditation_sounds', 'playlist_peaceful_piano'],
  neutral: ['playlist_cafe_ambience', 'playlist_forest_ambience'],
  angry: ['playlist_calm_mind', 'playlist_anxiety_relief'],
  lonely: ['playlist_gentle_lift', 'playlist_birdsong'],
  grateful: ['playlist_happy_vibes', 'playlist_morning_motivation']
};

export default musicPlaylists;
