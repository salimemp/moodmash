/**
 * Mood Tracking Unit Tests
 * Tests for mood entry creation, validation, and statistics
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Types
interface MoodEntry {
  id?: string;
  user_id: string;
  mood: string;
  intensity: number;
  notes?: string;
  activities?: string[];
  weather?: string;
  created_at?: string;
}

describe('Mood Tracking', () => {
  describe('Mood Validation', () => {
    const VALID_MOODS = ['happy', 'sad', 'anxious', 'calm', 'excited', 'tired', 'angry', 'neutral', 'grateful'];
    
    const validateMood = (mood: string) => VALID_MOODS.includes(mood.toLowerCase());

    it('should accept valid moods', () => {
      VALID_MOODS.forEach(mood => {
        expect(validateMood(mood)).toBe(true);
      });
    });

    it('should reject invalid moods', () => {
      expect(validateMood('invalidmood')).toBe(false);
      expect(validateMood('')).toBe(false);
      expect(validateMood('super happy')).toBe(false);
    });
  });

  describe('Intensity Validation', () => {
    const validateIntensity = (intensity: number) => {
      return Number.isInteger(intensity) && intensity >= 1 && intensity <= 10;
    };

    it('should accept valid intensities (1-10)', () => {
      for (let i = 1; i <= 10; i++) {
        expect(validateIntensity(i)).toBe(true);
      }
    });

    it('should reject invalid intensities', () => {
      expect(validateIntensity(0)).toBe(false);
      expect(validateIntensity(11)).toBe(false);
      expect(validateIntensity(-1)).toBe(false);
      expect(validateIntensity(5.5)).toBe(false);
    });
  });

  describe('Mood Entry Creation', () => {
    const createMoodEntry = (data: Partial<MoodEntry>): MoodEntry | null => {
      const VALID_MOODS = ['happy', 'sad', 'anxious', 'calm', 'excited', 'tired', 'angry', 'neutral', 'grateful'];
      
      if (!data.user_id || !data.mood) return null;
      if (!VALID_MOODS.includes(data.mood.toLowerCase())) return null;
      if (data.intensity && (data.intensity < 1 || data.intensity > 10)) return null;

      return {
        id: `mood_${Date.now()}`,
        user_id: data.user_id,
        mood: data.mood.toLowerCase(),
        intensity: data.intensity || 5,
        notes: data.notes || '',
        activities: data.activities || [],
        weather: data.weather || '',
        created_at: new Date().toISOString(),
      };
    };

    it('should create valid mood entry', () => {
      const entry = createMoodEntry({
        user_id: 'user_123',
        mood: 'happy',
        intensity: 8,
        notes: 'Great day!',
      });

      expect(entry).not.toBeNull();
      expect(entry?.mood).toBe('happy');
      expect(entry?.intensity).toBe(8);
      expect(entry?.id).toMatch(/^mood_\d+$/);
    });

    it('should use default intensity of 5', () => {
      const entry = createMoodEntry({
        user_id: 'user_123',
        mood: 'calm',
      });

      expect(entry?.intensity).toBe(5);
    });

    it('should reject invalid mood entry', () => {
      const entry = createMoodEntry({
        user_id: 'user_123',
        mood: 'invalid',
      });

      expect(entry).toBeNull();
    });
  });

  describe('Mood Statistics', () => {
    const calculateMoodStats = (entries: MoodEntry[]) => {
      if (entries.length === 0) {
        return { averageIntensity: 0, moodCounts: {}, totalEntries: 0 };
      }

      const moodCounts: Record<string, number> = {};
      let totalIntensity = 0;

      entries.forEach(entry => {
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
        totalIntensity += entry.intensity;
      });

      return {
        averageIntensity: totalIntensity / entries.length,
        moodCounts,
        totalEntries: entries.length,
      };
    };

    it('should calculate average intensity', () => {
      const entries: MoodEntry[] = [
        { user_id: 'u1', mood: 'happy', intensity: 8 },
        { user_id: 'u1', mood: 'calm', intensity: 6 },
        { user_id: 'u1', mood: 'happy', intensity: 7 },
      ];

      const stats = calculateMoodStats(entries);
      expect(stats.averageIntensity).toBe(7);
    });

    it('should count mood occurrences', () => {
      const entries: MoodEntry[] = [
        { user_id: 'u1', mood: 'happy', intensity: 8 },
        { user_id: 'u1', mood: 'happy', intensity: 7 },
        { user_id: 'u1', mood: 'calm', intensity: 6 },
      ];

      const stats = calculateMoodStats(entries);
      expect(stats.moodCounts.happy).toBe(2);
      expect(stats.moodCounts.calm).toBe(1);
    });

    it('should handle empty entries', () => {
      const stats = calculateMoodStats([]);
      expect(stats.totalEntries).toBe(0);
      expect(stats.averageIntensity).toBe(0);
    });
  });

  describe('Mood Streaks', () => {
    const calculateStreak = (dates: string[]) => {
      if (dates.length === 0) return 0;
      
      const sortedDates = [...dates].sort((a, b) => 
        new Date(b).getTime() - new Date(a).getTime()
      );
      
      let streak = 1;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const firstDate = new Date(sortedDates[0]);
      firstDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 1) return 0;
      
      for (let i = 1; i < sortedDates.length; i++) {
        const curr = new Date(sortedDates[i - 1]);
        const prev = new Date(sortedDates[i]);
        const diff = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diff === 1) {
          streak++;
        } else {
          break;
        }
      }
      
      return streak;
    };

    it('should calculate consecutive day streak', () => {
      const today = new Date();
      const dates = [
        today.toISOString(),
        new Date(today.getTime() - 86400000).toISOString(),
        new Date(today.getTime() - 172800000).toISOString(),
      ];
      
      const streak = calculateStreak(dates);
      expect(streak).toBe(3);
    });

    it('should return 0 for missed day', () => {
      const today = new Date();
      const dates = [
        new Date(today.getTime() - 172800000).toISOString(),
      ];
      
      const streak = calculateStreak(dates);
      expect(streak).toBe(0);
    });
  });
});
