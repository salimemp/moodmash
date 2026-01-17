// Gemini AI Service
import type { MoodEntry, MoodInsight, VoiceJournal } from '../types';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export async function analyzeVoiceJournal(
  apiKey: string,
  transcript: string
): Promise<{ emotion: string; sentiment: number; summary: string }> {
  if (!apiKey) {
    return { emotion: 'neutral', sentiment: 0, summary: 'AI analysis not available' };
  }

  const prompt = `Analyze this voice journal transcript and provide:
1. The primary emotion detected (one of: happy, sad, anxious, calm, angry, excited, tired, neutral)
2. A sentiment score from -1 (very negative) to 1 (very positive)
3. A brief 1-2 sentence summary

Transcript: "${transcript}"

Respond in JSON format only:
{"emotion": "...", "sentiment": 0.0, "summary": "..."}`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 200 }
      })
    });

    if (!response.ok) {
      console.error('Gemini API error:', response.status);
      return { emotion: 'neutral', sentiment: 0, summary: 'Analysis unavailable' };
    }

    const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[^}]+\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]) as { emotion: string; sentiment: number; summary: string };
      return result;
    }
    return { emotion: 'neutral', sentiment: 0, summary: 'Unable to analyze' };
  } catch (error) {
    console.error('Gemini analysis error:', error);
    return { emotion: 'neutral', sentiment: 0, summary: 'Analysis failed' };
  }
}

export async function generateMoodInsights(
  apiKey: string,
  moods: MoodEntry[],
  voiceJournals: VoiceJournal[]
): Promise<MoodInsight[]> {
  if (!apiKey || moods.length === 0) {
    return [];
  }

  // Prepare mood data summary
  const emotionCounts: Record<string, number> = {};
  let totalIntensity = 0;
  
  for (const mood of moods) {
    emotionCounts[mood.emotion] = (emotionCounts[mood.emotion] || 0) + 1;
    totalIntensity += mood.intensity;
  }

  const avgIntensity = (totalIntensity / moods.length).toFixed(1);
  const dominantEmotion = Object.entries(emotionCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'neutral';

  const journalSummary = voiceJournals
    .slice(0, 5)
    .map(j => j.transcript?.substring(0, 100))
    .filter(Boolean)
    .join('; ');

  const prompt = `Based on this mood data from the past week, provide 3-4 personalized insights:

Mood entries: ${moods.length}
Dominant emotion: ${dominantEmotion}
Average intensity: ${avgIntensity}/5
Emotion breakdown: ${JSON.stringify(emotionCounts)}
Recent journal excerpts: "${journalSummary || 'None'}"

Provide actionable insights in JSON format:
[{"type": "trend|pattern|suggestion", "title": "...", "description": "..."}]`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
      })
    });

    if (!response.ok) {
      return [{
        type: 'pattern',
        title: 'Mood Pattern',
        description: `Your dominant emotion has been ${dominantEmotion} with an average intensity of ${avgIntensity}/5.`
      }];
    }

    const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Extract JSON array from response
    const jsonMatch = text.match(/\[.*\]/s);
    if (jsonMatch) {
      const insights = JSON.parse(jsonMatch[0]) as MoodInsight[];
      return insights.slice(0, 4);
    }

    return [];
  } catch (error) {
    console.error('Gemini insights error:', error);
    return [];
  }
}
