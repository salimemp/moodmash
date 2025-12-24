import { describe, it, expect } from 'vitest';
import type { Emotion, MoodEntry, MoodStats } from '../../src/types';

describe('Type Definitions', () => {
  describe('Emotion Type', () => {
    it('should accept valid emotion values', () => {
      const validEmotions: Emotion[] = [
        'happy', 'sad', 'anxious', 'calm', 'energetic',
        'tired', 'angry', 'peaceful', 'stressed', 'neutral'
      ];
      
      validEmotions.forEach(emotion => {
        expect(validEmotions).toContain(emotion);
      });
    });
  });

  describe('MoodEntry Interface', () => {
    it('should allow valid mood entry structure', () => {
      const entry: MoodEntry = {
        emotion: 'happy',
        intensity: 4,
        notes: 'Feeling great today!',
        logged_at: new Date().toISOString(),
      };
      
      expect(entry.emotion).toBe('happy');
      expect(entry.intensity).toBe(4);
      expect(entry.notes).toBe('Feeling great today!');
    });

    it('should allow optional fields', () => {
      const entry: MoodEntry = {
        emotion: 'calm',
        intensity: 3,
        logged_at: new Date().toISOString(),
      };
      
      expect(entry.notes).toBeUndefined();
      expect(entry.weather).toBeUndefined();
    });
  });

  describe('MoodStats Interface', () => {
    it('should have required properties', () => {
      const stats: MoodStats = {
        total_entries: 10,
        most_common_emotion: 'happy',
        average_intensity: 3.5,
        mood_distribution: { happy: 5, calm: 3, neutral: 2 },
        recent_trend: 'improving',
        insights: ['You tend to be happier in the morning']
      };
      
      expect(stats.total_entries).toBe(10);
      expect(stats.most_common_emotion).toBe('happy');
      expect(stats.recent_trend).toBe('improving');
    });
  });
});
