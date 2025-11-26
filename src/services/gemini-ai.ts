// Gemini AI Service for MoodMash
// Provides AI-powered mood intelligence features

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface MoodEntry {
  id?: number;
  emotion: string;
  intensity: number;
  notes?: string;
  activities?: string[];
  weather?: string;
  sleep_hours?: number;
  social_interaction?: string;
  logged_at: string;
}

export interface PatternAnalysisResult {
  patterns: string[];
  frequency: Record<string, number>;
  weekly_trends: Array<{ day: string; mood: string; intensity: number }>;
  insights: string[];
}

export interface ForecastResult {
  next_7_days: Array<{
    date: string;
    predicted_mood: string;
    confidence: number;
    reasoning: string;
  }>;
  risk_days: string[];
  recommendations: string[];
}

export interface ContextAnalysisResult {
  analysis: string;
  correlations: Array<{
    factor: string;
    impact: string;
    strength: 'high' | 'moderate' | 'low';
  }>;
  insights: string[];
}

export interface CausalFactorsResult {
  positive_triggers: Array<{ factor: string; impact_score: number }>;
  negative_triggers: Array<{ factor: string; impact_score: number }>;
  recommendations: string[];
  confidence: number;
}

export interface RecommendationResult {
  activities: Array<{
    name: string;
    description: string;
    effectiveness: number;
    duration: string;
    reasoning: string;
  }>;
  personalized_message: string;
}

export interface CrisisCheckResult {
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  risk_score: number;
  indicators: string[];
  interventions: string[];
  resources: Array<{
    name: string;
    phone: string;
    available: string;
    url?: string;
  }>;
  immediate_action_required: boolean;
}

export interface RiskDetectionResult {
  trend: 'improving' | 'stable' | 'declining' | 'critical';
  risk_score: number;
  warning_signs: string[];
  recommended_actions: string[];
  follow_up_days: number;
}

export interface AdvancedAnalyticsResult {
  insights: string[];
  best_times: { time: string; mood: string }[];
  worst_times: { time: string; mood: string }[];
  mood_variance: number;
  stress_management_score: number;
  actionable_tips: string[];
  progress_summary: string;
}

export class GeminiAIService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    });
  }

  /**
   * 1. Mood Pattern Recognition
   * Analyzes mood entries to identify recurring patterns
   */
  async analyzeMoodPatterns(moodEntries: MoodEntry[]): Promise<PatternAnalysisResult> {
    const prompt = `Analyze the following mood entries and identify patterns:

${JSON.stringify(moodEntries, null, 2)}

Provide a detailed analysis in the following JSON format:
{
  "patterns": ["array of identified patterns like 'Anxiety peaks on Mondays'"],
  "frequency": {"happy": 0.4, "anxious": 0.3, "calm": 0.3},
  "weekly_trends": [{"day": "Monday", "mood": "anxious", "intensity": 3.5}],
  "insights": ["actionable insights based on patterns"]
}`;

    const result = await this.model.generateContent(prompt);
    const response = result.response.text();
    return JSON.parse(response);
  }

  /**
   * 2. Predictive Mood Forecasting
   * Predicts likely moods for the next 7 days
   */
  async forecastMood(moodEntries: MoodEntry[], currentContext?: any): Promise<ForecastResult> {
    const prompt = `Based on the following mood history and current context, predict the user's mood for the next 7 days:

Mood History:
${JSON.stringify(moodEntries, null, 2)}

Current Context:
${JSON.stringify(currentContext || {}, null, 2)}

Provide predictions in the following JSON format:
{
  "next_7_days": [
    {
      "date": "2025-01-24",
      "predicted_mood": "calm",
      "confidence": 0.75,
      "reasoning": "Pattern suggests better mood after rest day"
    }
  ],
  "risk_days": ["Monday - high work stress expected"],
  "recommendations": ["actionable tips to maintain positive mood"]
}`;

    const result = await this.model.generateContent(prompt);
    const response = result.response.text();
    return JSON.parse(response);
  }

  /**
   * 3. Contextual Mood Analysis
   * Analyzes mood in context of activities, weather, sleep, etc.
   */
  async analyzeContext(moodEntries: MoodEntry[]): Promise<ContextAnalysisResult> {
    const prompt = `Analyze how context factors (activities, weather, sleep, social interaction) correlate with mood:

${JSON.stringify(moodEntries, null, 2)}

Provide analysis in the following JSON format:
{
  "analysis": "comprehensive explanation of mood-context relationships",
  "correlations": [
    {
      "factor": "sleep_hours < 6",
      "impact": "negative",
      "strength": "high"
    }
  ],
  "insights": ["specific insights about mood triggers"]
}`;

    const result = await this.model.generateContent(prompt);
    const response = result.response.text();
    return JSON.parse(response);
  }

  /**
   * 4. Causal Factor Identification
   * Identifies what triggers positive and negative moods
   */
  async identifyCausalFactors(moodEntries: MoodEntry[]): Promise<CausalFactorsResult> {
    const prompt = `Identify causal factors that trigger positive and negative moods:

${JSON.stringify(moodEntries, null, 2)}

Provide results in the following JSON format:
{
  "positive_triggers": [
    {"factor": "Morning exercise", "impact_score": 0.85}
  ],
  "negative_triggers": [
    {"factor": "Poor sleep", "impact_score": 0.78}
  ],
  "recommendations": ["specific actions to maximize positive triggers"],
  "confidence": 0.82
}`;

    const result = await this.model.generateContent(prompt);
    const response = result.response.text();
    return JSON.parse(response);
  }

  /**
   * 5. Personalized Recommendations
   * Suggests activities based on current mood and past effectiveness
   */
  async getRecommendations(
    currentMood: string,
    intensity: number,
    moodHistory: MoodEntry[],
    preferences?: string[]
  ): Promise<RecommendationResult> {
    const prompt = `Given the current mood "${currentMood}" with intensity ${intensity}, and this mood history:

${JSON.stringify(moodHistory, null, 2)}

User preferences: ${JSON.stringify(preferences || [])}

Recommend 3-5 activities that would be most effective. Provide in JSON format:
{
  "activities": [
    {
      "name": "10-min meditation",
      "description": "Guided breathing exercise",
      "effectiveness": 0.85,
      "duration": "10min",
      "reasoning": "Past data shows meditation improves calm by 40%"
    }
  ],
  "personalized_message": "encouraging message tailored to current mood"
}`;

    const result = await this.model.generateContent(prompt);
    const response = result.response.text();
    return JSON.parse(response);
  }

  /**
   * 6. Crisis Intervention System
   * Detects crisis signals and provides intervention resources
   */
  async checkCrisis(moodEntries: MoodEntry[]): Promise<CrisisCheckResult> {
    const prompt = `Analyze these mood entries for signs of mental health crisis:

${JSON.stringify(moodEntries, null, 2)}

Assess risk level and provide intervention guidance in JSON format:
{
  "risk_level": "low|moderate|high|critical",
  "risk_score": 6.5,
  "indicators": ["list of concerning patterns"],
  "interventions": ["immediate actions to take"],
  "resources": [
    {
      "name": "National Suicide Prevention Lifeline",
      "phone": "988",
      "available": "24/7",
      "url": "https://988lifeline.org"
    }
  ],
  "immediate_action_required": false
}`;

    const result = await this.model.generateContent(prompt);
    const response = result.response.text();
    return JSON.parse(response);
  }

  /**
   * 7. Early Risk Detection
   * Detects declining mental health trends early
   */
  async detectRisk(moodEntries: MoodEntry[]): Promise<RiskDetectionResult> {
    const prompt = `Analyze mood trends to detect early warning signs of declining mental health:

${JSON.stringify(moodEntries, null, 2)}

Provide risk assessment in JSON format:
{
  "trend": "improving|stable|declining|critical",
  "risk_score": 6.5,
  "warning_signs": ["specific patterns of concern"],
  "recommended_actions": ["proactive steps to take"],
  "follow_up_days": 7
}`;

    const result = await this.model.generateContent(prompt);
    const response = result.response.text();
    return JSON.parse(response);
  }

  /**
   * 8. Advanced Mood Analytics
   * Provides comprehensive mood insights and analytics
   */
  async getAdvancedAnalytics(moodEntries: MoodEntry[]): Promise<AdvancedAnalyticsResult> {
    const prompt = `Perform advanced analytics on mood data:

${JSON.stringify(moodEntries, null, 2)}

Provide comprehensive analytics in JSON format:
{
  "insights": ["key insights about mood patterns"],
  "best_times": [{"time": "10am-12pm", "mood": "energetic"}],
  "worst_times": [{"time": "8pm-10pm", "mood": "tired"}],
  "mood_variance": 2.5,
  "stress_management_score": 65,
  "actionable_tips": ["specific recommendations"],
  "progress_summary": "overall assessment of mental wellbeing progress"
}`;

    const result = await this.model.generateContent(prompt);
    const response = result.response.text();
    return JSON.parse(response);
  }

  /**
   * 9. Conversational Chat
   * Provides interactive chat with context awareness
   */
  async chat(
    userMessage: string,
    conversationHistory: Array<{ role: string; parts: Array<{ text: string }> }> = [],
    systemPrompt: string = 'You are MoodMash AI Assistant, a helpful and empathetic AI.'
  ): Promise<string> {
    try {
      // Create chat session with history
      const chat = this.model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }]
          },
          {
            role: 'model',
            parts: [{ text: 'I understand. I am MoodMash AI Assistant, here to help with mood tracking and emotional wellness. How can I assist you today?' }]
          },
          ...conversationHistory
        ],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        },
      });

      const result = await chat.sendMessage(userMessage);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('[Gemini Chat] Error:', error);
      throw new Error('Failed to get AI response');
    }
  }
}

// Helper function to initialize AI service with environment variable
export function createAIService(apiKey: string): GeminiAIService {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }
  return new GeminiAIService(apiKey);
}
