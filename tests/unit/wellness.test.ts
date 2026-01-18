/**
 * Wellness Features Tests
 * Tests for meditation, yoga, and music features
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Wellness Features', () => {
  describe('Meditation Sessions', () => {
    interface MeditationSession {
      id: string;
      type: string;
      duration: number;
      completed: boolean;
      startedAt: Date;
      completedAt?: Date;
    }

    const MEDITATION_TYPES = ['breathing', 'mindfulness', 'body-scan', 'visualization', 'loving-kindness'];
    const DURATIONS = [5, 10, 15, 20, 30];

    const createSession = (type: string, duration: number): MeditationSession | null => {
      if (!MEDITATION_TYPES.includes(type)) return null;
      if (!DURATIONS.includes(duration)) return null;

      return {
        id: `med_${Date.now()}`,
        type,
        duration,
        completed: false,
        startedAt: new Date(),
      };
    };

    const completeSession = (session: MeditationSession): MeditationSession => {
      return {
        ...session,
        completed: true,
        completedAt: new Date(),
      };
    };

    it('should create valid meditation session', () => {
      const session = createSession('breathing', 10);
      expect(session).not.toBeNull();
      expect(session?.type).toBe('breathing');
      expect(session?.duration).toBe(10);
      expect(session?.completed).toBe(false);
    });

    it('should reject invalid meditation type', () => {
      const session = createSession('invalid-type', 10);
      expect(session).toBeNull();
    });

    it('should reject invalid duration', () => {
      const session = createSession('breathing', 7);
      expect(session).toBeNull();
    });

    it('should mark session as completed', () => {
      const session = createSession('mindfulness', 15)!;
      const completed = completeSession(session);
      expect(completed.completed).toBe(true);
      expect(completed.completedAt).toBeDefined();
    });
  });

  describe('Yoga Routines', () => {
    interface YogaRoutine {
      id: string;
      name: string;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
      duration: number;
      poses: string[];
    }

    const yogaRoutines: YogaRoutine[] = [
      { id: 'yoga_1', name: 'Morning Flow', difficulty: 'beginner', duration: 15, poses: ['mountain', 'warrior1', 'tree'] },
      { id: 'yoga_2', name: 'Sun Salutation', difficulty: 'intermediate', duration: 20, poses: ['downdog', 'plank', 'cobra'] },
      { id: 'yoga_3', name: 'Power Yoga', difficulty: 'advanced', duration: 45, poses: ['crow', 'headstand', 'wheel'] },
    ];

    const filterByDifficulty = (difficulty: string): YogaRoutine[] => {
      return yogaRoutines.filter(r => r.difficulty === difficulty);
    };

    const filterByDuration = (maxDuration: number): YogaRoutine[] => {
      return yogaRoutines.filter(r => r.duration <= maxDuration);
    };

    it('should filter routines by difficulty', () => {
      const beginner = filterByDifficulty('beginner');
      expect(beginner.length).toBe(1);
      expect(beginner[0].name).toBe('Morning Flow');
    });

    it('should filter routines by max duration', () => {
      const shortRoutines = filterByDuration(20);
      expect(shortRoutines.length).toBe(2);
    });
  });

  describe('Music Playlists', () => {
    interface Track {
      id: string;
      title: string;
      artist: string;
      duration: number;
      category: string;
    }

    interface Playlist {
      id: string;
      name: string;
      tracks: Track[];
      totalDuration: number;
    }

    const createPlaylist = (name: string, tracks: Track[]): Playlist => {
      const totalDuration = tracks.reduce((sum, t) => sum + t.duration, 0);
      return {
        id: `playlist_${Date.now()}`,
        name,
        tracks,
        totalDuration,
      };
    };

    const shufflePlaylist = (playlist: Playlist): Playlist => {
      const shuffled = [...playlist.tracks].sort(() => Math.random() - 0.5);
      return { ...playlist, tracks: shuffled };
    };

    it('should create playlist with total duration', () => {
      const tracks: Track[] = [
        { id: 't1', title: 'Track 1', artist: 'Artist', duration: 180, category: 'relaxation' },
        { id: 't2', title: 'Track 2', artist: 'Artist', duration: 240, category: 'relaxation' },
      ];

      const playlist = createPlaylist('My Playlist', tracks);
      expect(playlist.totalDuration).toBe(420);
      expect(playlist.tracks.length).toBe(2);
    });

    it('should shuffle playlist tracks', () => {
      const tracks: Track[] = Array.from({ length: 10 }, (_, i) => ({
        id: `t${i}`,
        title: `Track ${i}`,
        artist: 'Artist',
        duration: 180,
        category: 'relaxation',
      }));

      const playlist = createPlaylist('Test', tracks);
      const shuffled = shufflePlaylist(playlist);
      
      expect(shuffled.tracks.length).toBe(tracks.length);
      // Tracks should still contain all original tracks
      expect(shuffled.tracks.map(t => t.id).sort()).toEqual(tracks.map(t => t.id).sort());
    });
  });

  describe('Progress Tracking', () => {
    interface WellnessProgress {
      userId: string;
      meditationMinutes: number;
      yogaSessions: number;
      musicMinutes: number;
      weeklyGoal: number;
    }

    const calculateProgress = (progress: WellnessProgress): number => {
      const totalMinutes = progress.meditationMinutes + (progress.yogaSessions * 20) + progress.musicMinutes;
      return Math.min(100, (totalMinutes / progress.weeklyGoal) * 100);
    };

    const getStreak = (dailyActivity: boolean[]): number => {
      let streak = 0;
      for (let i = dailyActivity.length - 1; i >= 0; i--) {
        if (dailyActivity[i]) {
          streak++;
        } else {
          break;
        }
      }
      return streak;
    };

    it('should calculate weekly progress percentage', () => {
      const progress: WellnessProgress = {
        userId: 'u1',
        meditationMinutes: 30,
        yogaSessions: 2,
        musicMinutes: 60,
        weeklyGoal: 150,
      };

      const percentage = calculateProgress(progress);
      expect(percentage).toBeCloseTo(86.67, 0);
    });

    it('should cap progress at 100%', () => {
      const progress: WellnessProgress = {
        userId: 'u1',
        meditationMinutes: 100,
        yogaSessions: 5,
        musicMinutes: 100,
        weeklyGoal: 100,
      };

      expect(calculateProgress(progress)).toBe(100);
    });

    it('should calculate activity streak', () => {
      const dailyActivity = [true, true, false, true, true, true, true];
      expect(getStreak(dailyActivity)).toBe(4);
    });
  });
});
