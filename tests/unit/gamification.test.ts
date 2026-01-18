/**
 * Gamification Tests
 * Tests for achievements, points, badges, and streaks
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Gamification', () => {
  describe('Points System', () => {
    const POINT_VALUES = {
      mood_logged: 10,
      meditation_completed: 25,
      yoga_completed: 30,
      streak_bonus: 5,
      friend_added: 15,
      group_joined: 20,
      achievement_unlocked: 50,
    };

    const calculateTotalPoints = (activities: { type: keyof typeof POINT_VALUES; count: number }[]): number => {
      return activities.reduce((total, activity) => {
        return total + (POINT_VALUES[activity.type] || 0) * activity.count;
      }, 0);
    };

    it('should calculate points correctly', () => {
      const activities = [
        { type: 'mood_logged' as const, count: 5 },
        { type: 'meditation_completed' as const, count: 2 },
      ];
      expect(calculateTotalPoints(activities)).toBe(100);
    });

    it('should handle empty activities', () => {
      expect(calculateTotalPoints([])).toBe(0);
    });
  });

  describe('Level System', () => {
    const calculateLevel = (points: number): { level: number; pointsToNext: number; progress: number } => {
      const levels = [0, 100, 250, 500, 1000, 2000, 5000, 10000, 20000, 50000];
      
      let level = 1;
      for (let i = 1; i < levels.length; i++) {
        if (points >= levels[i]) {
          level = i + 1;
        } else {
          break;
        }
      }

      const currentLevelPoints = levels[level - 1] || 0;
      const nextLevelPoints = levels[level] || levels[levels.length - 1];
      const pointsInLevel = points - currentLevelPoints;
      const pointsNeeded = nextLevelPoints - currentLevelPoints;
      
      return {
        level,
        pointsToNext: nextLevelPoints - points,
        progress: Math.min(100, (pointsInLevel / pointsNeeded) * 100),
      };
    };

    it('should calculate level from points', () => {
      expect(calculateLevel(0).level).toBe(1);
      expect(calculateLevel(100).level).toBe(2);
      expect(calculateLevel(500).level).toBe(4);
    });

    it('should calculate progress to next level', () => {
      const result = calculateLevel(50);
      expect(result.level).toBe(1);
      expect(result.pointsToNext).toBe(50);
      expect(result.progress).toBe(50);
    });
  });

  describe('Achievements', () => {
    interface Achievement {
      id: string;
      name: string;
      description: string;
      requirement: (stats: any) => boolean;
    }

    const achievements: Achievement[] = [
      {
        id: 'first_mood',
        name: 'First Steps',
        description: 'Log your first mood',
        requirement: (stats) => stats.moodsLogged >= 1,
      },
      {
        id: 'week_streak',
        name: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        requirement: (stats) => stats.currentStreak >= 7,
      },
      {
        id: 'meditation_master',
        name: 'Meditation Master',
        description: 'Complete 50 meditation sessions',
        requirement: (stats) => stats.meditationsCompleted >= 50,
      },
      {
        id: 'social_butterfly',
        name: 'Social Butterfly',
        description: 'Add 10 friends',
        requirement: (stats) => stats.friendsCount >= 10,
      },
    ];

    const checkAchievements = (stats: any): string[] => {
      return achievements
        .filter(a => a.requirement(stats))
        .map(a => a.id);
    };

    it('should unlock achievements based on stats', () => {
      const stats = { moodsLogged: 10, currentStreak: 7, meditationsCompleted: 5, friendsCount: 3 };
      const unlocked = checkAchievements(stats);
      
      expect(unlocked).toContain('first_mood');
      expect(unlocked).toContain('week_streak');
      expect(unlocked).not.toContain('meditation_master');
    });

    it('should return empty array for new user', () => {
      const stats = { moodsLogged: 0, currentStreak: 0, meditationsCompleted: 0, friendsCount: 0 };
      const unlocked = checkAchievements(stats);
      expect(unlocked).toHaveLength(0);
    });
  });

  describe('Streak Calculation', () => {
    const calculateStreak = (dates: Date[]): number => {
      if (dates.length === 0) return 0;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const sortedDates = dates
        .map(d => {
          const date = new Date(d);
          date.setHours(0, 0, 0, 0);
          return date;
        })
        .sort((a, b) => b.getTime() - a.getTime());

      const mostRecent = sortedDates[0];
      const daysSinceLast = Math.floor((today.getTime() - mostRecent.getTime()) / (86400000));
      
      if (daysSinceLast > 1) return 0;
      
      let streak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const diff = Math.floor((sortedDates[i - 1].getTime() - sortedDates[i].getTime()) / 86400000);
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
        today,
        new Date(today.getTime() - 86400000),
        new Date(today.getTime() - 172800000),
      ];
      expect(calculateStreak(dates)).toBe(3);
    });

    it('should reset streak on gap', () => {
      const today = new Date();
      const dates = [
        new Date(today.getTime() - 259200000), // 3 days ago
      ];
      expect(calculateStreak(dates)).toBe(0);
    });
  });

  describe('Leaderboard', () => {
    interface LeaderboardEntry {
      userId: string;
      name: string;
      points: number;
      rank?: number;
    }

    const rankLeaderboard = (entries: LeaderboardEntry[]): LeaderboardEntry[] => {
      return entries
        .sort((a, b) => b.points - a.points)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));
    };

    it('should rank users by points', () => {
      const entries: LeaderboardEntry[] = [
        { userId: 'u1', name: 'Alice', points: 500 },
        { userId: 'u2', name: 'Bob', points: 1000 },
        { userId: 'u3', name: 'Charlie', points: 750 },
      ];

      const ranked = rankLeaderboard(entries);
      expect(ranked[0].name).toBe('Bob');
      expect(ranked[0].rank).toBe(1);
      expect(ranked[2].name).toBe('Alice');
      expect(ranked[2].rank).toBe(3);
    });
  });
});
