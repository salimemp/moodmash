/**
 * Health Metrics Service
 * Calculates comprehensive health metrics from mood data
 * Version: 9.0.0
 */

export interface MoodEntry {
  id: number;
  user_id: number;
  emotion: string;
  intensity: number;
  notes?: string;
  weather?: string;
  sleep_hours?: number;
  activities?: string;
  social_interaction?: string;
  timestamp: string;
}

export interface HealthMetrics {
  mental_health_score: number; // 0-100
  mood_stability_index: number; // 0-1
  sleep_quality_score: number; // 0-10
  activity_consistency: number; // 0-1
  stress_level: number; // 1-5
  crisis_risk_level: 'low' | 'moderate' | 'high' | 'critical';
  mood_trend: 'improving' | 'stable' | 'declining' | 'critical';
  positive_emotion_ratio: number;
  negative_emotion_ratio: number;
  best_time_of_day: string;
  worst_time_of_day: string;
  data_points_used: number;
  calculation_period_days: number;
}

export interface TrendData {
  period: string; // "7d", "30d", "90d"
  metrics: HealthMetrics;
  comparison_previous_period: {
    mental_health_score_change: number;
    mood_stability_change: number;
    stress_level_change: number;
  };
}

export class HealthMetricsService {
  // Emotion categories
  private static readonly POSITIVE_EMOTIONS = ['happy', 'calm', 'energetic', 'peaceful', 'excited', 'grateful', 'content'];
  private static readonly NEGATIVE_EMOTIONS = ['sad', 'anxious', 'angry', 'stressed', 'tired', 'frustrated', 'lonely'];
  private static readonly NEUTRAL_EMOTIONS = ['neutral', 'confused', 'bored'];

  /**
   * Calculate comprehensive health metrics from mood data
   */
  static calculateMetrics(moodData: MoodEntry[], periodDays: number = 30): HealthMetrics {
    if (!moodData || moodData.length === 0) {
      return this.getDefaultMetrics(0, periodDays);
    }

    // Sort by timestamp
    const sortedData = moodData.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Calculate individual components
    const mentalHealthScore = this.calculateMentalHealthScore(sortedData);
    const moodStability = this.calculateMoodStability(sortedData);
    const sleepQuality = this.calculateSleepQuality(sortedData);
    const activityConsistency = this.calculateActivityConsistency(sortedData);
    const stressLevel = this.calculateStressLevel(sortedData);
    const crisisRisk = this.assessCrisisRisk(sortedData);
    const moodTrend = this.calculateMoodTrend(sortedData);
    const emotionRatios = this.calculateEmotionRatios(sortedData);
    const timeOfDayAnalysis = this.analyzeTimeOfDay(sortedData);

    return {
      mental_health_score: mentalHealthScore,
      mood_stability_index: moodStability,
      sleep_quality_score: sleepQuality,
      activity_consistency: activityConsistency,
      stress_level: stressLevel,
      crisis_risk_level: crisisRisk,
      mood_trend: moodTrend,
      positive_emotion_ratio: emotionRatios.positive,
      negative_emotion_ratio: emotionRatios.negative,
      best_time_of_day: timeOfDayAnalysis.best,
      worst_time_of_day: timeOfDayAnalysis.worst,
      data_points_used: sortedData.length,
      calculation_period_days: periodDays
    };
  }

  /**
   * Calculate overall mental health score (0-100)
   * Weighted combination of multiple factors
   */
  private static calculateMentalHealthScore(data: MoodEntry[]): number {
    if (data.length === 0) return 50; // Neutral baseline

    // Factor 1: Average intensity (20% weight)
    const avgIntensity = data.reduce((sum, m) => sum + m.intensity, 0) / data.length;
    const intensityScore = (avgIntensity / 5) * 100;

    // Factor 2: Positive emotion ratio (30% weight)
    const emotionRatios = this.calculateEmotionRatios(data);
    const emotionScore = emotionRatios.positive * 100;

    // Factor 3: Mood stability (20% weight)
    const stability = this.calculateMoodStability(data);
    const stabilityScore = stability * 100;

    // Factor 4: Sleep quality (15% weight)
    const sleepScore = this.calculateSleepQuality(data) * 10;

    // Factor 5: Activity consistency (15% weight)
    const activityScore = this.calculateActivityConsistency(data) * 100;

    // Weighted average
    const score = (
      intensityScore * 0.20 +
      emotionScore * 0.30 +
      stabilityScore * 0.20 +
      sleepScore * 0.15 +
      activityScore * 0.15
    );

    return Math.round(Math.min(100, Math.max(0, score)));
  }

  /**
   * Calculate mood stability index (0=volatile, 1=stable)
   */
  private static calculateMoodStability(data: MoodEntry[]): number {
    if (data.length < 2) return 1;

    // Calculate intensity variance
    const intensities = data.map(m => m.intensity);
    const mean = intensities.reduce((a, b) => a + b) / intensities.length;
    const variance = intensities.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intensities.length;
    const stdDev = Math.sqrt(variance);

    // Calculate emotion change frequency
    let emotionChanges = 0;
    for (let i = 1; i < data.length; i++) {
      if (data[i].emotion !== data[i - 1].emotion) {
        emotionChanges++;
      }
    }
    const changeRate = emotionChanges / (data.length - 1);

    // Combine metrics (lower variance + lower change rate = higher stability)
    const stabilityFromVariance = 1 - Math.min(stdDev / 5, 1); // Normalize by max intensity
    const stabilityFromChanges = 1 - Math.min(changeRate, 1);

    const stability = (stabilityFromVariance * 0.6 + stabilityFromChanges * 0.4);
    return Math.round(stability * 100) / 100;
  }

  /**
   * Calculate sleep quality score (0-10)
   */
  private static calculateSleepQuality(data: MoodEntry[]): number {
    const entriesWithSleep = data.filter(m => m.sleep_hours !== null && m.sleep_hours !== undefined);
    
    if (entriesWithSleep.length === 0) return 7; // Default/neutral score

    const avgSleepHours = entriesWithSleep.reduce((sum, m) => sum + (m.sleep_hours || 0), 0) / entriesWithSleep.length;

    // Optimal sleep: 7-9 hours = score 10
    // 6 or 10 hours = score 8
    // 5 or 11 hours = score 6
    // <5 or >11 hours = score 4
    let score = 10;
    if (avgSleepHours < 7) {
      score = 4 + (avgSleepHours / 7) * 6;
    } else if (avgSleepHours > 9) {
      score = 10 - ((avgSleepHours - 9) * 2);
    }

    return Math.round(Math.min(10, Math.max(0, score)) * 10) / 10;
  }

  /**
   * Calculate activity consistency (0-1)
   */
  private static calculateActivityConsistency(data: MoodEntry[]): number {
    const entriesWithActivities = data.filter(m => m.activities && m.activities.trim() !== '');
    
    if (entriesWithActivities.length < 3) return 0.5; // Not enough data

    const activityFrequency = entriesWithActivities.length / data.length;
    
    // Check for diverse activities
    const uniqueActivities = new Set(entriesWithActivities.map(m => m.activities));
    const diversityScore = Math.min(uniqueActivities.size / 5, 1); // Normalized to max 5 activities

    const consistency = (activityFrequency * 0.7 + diversityScore * 0.3);
    return Math.round(consistency * 100) / 100;
  }

  /**
   * Calculate stress level (1=low, 5=critical)
   */
  private static calculateStressLevel(data: MoodEntry[]): number {
    if (data.length === 0) return 3; // Neutral

    const recentData = data.slice(-7); // Last 7 entries

    // Count stress-related emotions
    const stressEmotions = ['stressed', 'anxious', 'angry', 'frustrated'];
    const stressCount = recentData.filter(m => stressEmotions.includes(m.emotion.toLowerCase())).length;
    const stressRatio = stressCount / recentData.length;

    // Consider intensity of stress emotions
    const stressIntensities = recentData
      .filter(m => stressEmotions.includes(m.emotion.toLowerCase()))
      .map(m => m.intensity);
    const avgStressIntensity = stressIntensities.length > 0
      ? stressIntensities.reduce((a, b) => a + b) / stressIntensities.length
      : 0;

    // Calculate stress level (1-5 scale)
    const stressScore = (stressRatio * 0.6 + (avgStressIntensity / 5) * 0.4) * 5;
    return Math.max(1, Math.min(5, Math.round(stressScore)));
  }

  /**
   * Assess crisis risk level
   */
  private static assessCrisisRisk(data: MoodEntry[]): 'low' | 'moderate' | 'high' | 'critical' {
    if (data.length < 5) return 'low';

    const recentData = data.slice(-14); // Last 14 entries (2 weeks)

    // Risk factors
    const negativeEmotions = recentData.filter(m => 
      this.NEGATIVE_EMOTIONS.includes(m.emotion.toLowerCase())
    );
    const negativeRatio = negativeEmotions.length / recentData.length;

    const highIntensityNegative = negativeEmotions.filter(m => m.intensity >= 4).length;
    const severeRatio = highIntensityNegative / recentData.length;

    const avgIntensity = recentData.reduce((sum, m) => sum + m.intensity, 0) / recentData.length;

    // Assess risk
    let riskScore = 0;
    riskScore += negativeRatio * 40;
    riskScore += severeRatio * 40;
    riskScore += (1 - avgIntensity / 5) * 20;

    if (riskScore >= 75) return 'critical';
    if (riskScore >= 50) return 'high';
    if (riskScore >= 25) return 'moderate';
    return 'low';
  }

  /**
   * Calculate mood trend
   */
  private static calculateMoodTrend(data: MoodEntry[]): 'improving' | 'stable' | 'declining' | 'critical' {
    if (data.length < 10) return 'stable';

    const half = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, half);
    const secondHalf = data.slice(half);

    const firstScore = this.calculateMentalHealthScore(firstHalf);
    const secondScore = this.calculateMentalHealthScore(secondHalf);

    const change = secondScore - firstScore;

    if (change >= 15) return 'improving';
    if (change <= -15) return 'declining';
    if (secondScore < 30) return 'critical';
    return 'stable';
  }

  /**
   * Calculate emotion ratios
   */
  private static calculateEmotionRatios(data: MoodEntry[]): { positive: number; negative: number; neutral: number } {
    if (data.length === 0) return { positive: 0.5, negative: 0.3, neutral: 0.2 };

    const positive = data.filter(m => this.POSITIVE_EMOTIONS.includes(m.emotion.toLowerCase())).length;
    const negative = data.filter(m => this.NEGATIVE_EMOTIONS.includes(m.emotion.toLowerCase())).length;
    const neutral = data.filter(m => this.NEUTRAL_EMOTIONS.includes(m.emotion.toLowerCase())).length;

    return {
      positive: Math.round((positive / data.length) * 100) / 100,
      negative: Math.round((negative / data.length) * 100) / 100,
      neutral: Math.round((neutral / data.length) * 100) / 100
    };
  }

  /**
   * Analyze best/worst time of day
   */
  private static analyzeTimeOfDay(data: MoodEntry[]): { best: string; worst: string } {
    const timeOfDayScores = {
      morning: [] as number[],
      afternoon: [] as number[],
      evening: [] as number[],
      night: [] as number[]
    };

    data.forEach(entry => {
      const hour = new Date(entry.timestamp).getHours();
      const score = this.POSITIVE_EMOTIONS.includes(entry.emotion.toLowerCase()) ? entry.intensity : -entry.intensity;

      if (hour >= 5 && hour < 12) timeOfDayScores.morning.push(score);
      else if (hour >= 12 && hour < 17) timeOfDayScores.afternoon.push(score);
      else if (hour >= 17 && hour < 21) timeOfDayScores.evening.push(score);
      else timeOfDayScores.night.push(score);
    });

    const averages = Object.entries(timeOfDayScores).map(([time, scores]) => ({
      time,
      avg: scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 0
    }));

    averages.sort((a, b) => b.avg - a.avg);

    return {
      best: averages[0]?.time || 'morning',
      worst: averages[averages.length - 1]?.time || 'night'
    };
  }

  /**
   * Get default metrics when no data available
   */
  private static getDefaultMetrics(dataPoints: number, periodDays: number): HealthMetrics {
    return {
      mental_health_score: 50,
      mood_stability_index: 0.5,
      sleep_quality_score: 7,
      activity_consistency: 0.5,
      stress_level: 3,
      crisis_risk_level: 'low',
      mood_trend: 'stable',
      positive_emotion_ratio: 0.5,
      negative_emotion_ratio: 0.3,
      best_time_of_day: 'morning',
      worst_time_of_day: 'night',
      data_points_used: dataPoints,
      calculation_period_days: periodDays
    };
  }

  /**
   * Calculate trends over time (compare periods)
   */
  static calculateTrends(currentData: MoodEntry[], previousData: MoodEntry[], period: string = '30d'): TrendData {
    const currentMetrics = this.calculateMetrics(currentData, 30);
    const previousMetrics = this.calculateMetrics(previousData, 30);

    return {
      period,
      metrics: currentMetrics,
      comparison_previous_period: {
        mental_health_score_change: currentMetrics.mental_health_score - previousMetrics.mental_health_score,
        mood_stability_change: currentMetrics.mood_stability_index - previousMetrics.mood_stability_index,
        stress_level_change: currentMetrics.stress_level - previousMetrics.stress_level
      }
    };
  }
}
