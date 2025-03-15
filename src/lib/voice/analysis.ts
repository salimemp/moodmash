import { env } from '@/env.mjs';

export interface VoiceAnalysisResult {
  text: string;
  sentiment: {
    label: string;
    score: number;
  };
  emotions: {
    [key: string]: number;
  };
  confidence: number;
}

interface AnalysisOptions {
  maxPollingAttempts?: number;
  pollingInterval?: number;
}

interface AssemblyAIResponse {
  id: string;
  status: string;
  text?: string;
  error?: string;
  confidence?: number;
  sentiment_analysis_results?: Array<{
    text: string;
    sentiment: string;
    confidence: number;
  }>;
  emotion_analysis_results?: Array<{
    text: string;
    emotions: {
      [key: string]: number;
    };
  }>;
}

/**
 * Analyze a voice recording using AssemblyAI
 * @param audioBlob - The audio blob to analyze
 * @param languageCode - The language code for transcription
 * @param options - Optional configuration for analysis
 * @returns Analysis result including transcription, sentiment, and emotions
 */
export async function analyzeVoiceRecording(
  audioBlob: Blob,
  languageCode: string,
  options: AnalysisOptions = {}
): Promise<VoiceAnalysisResult> {
  const {
    maxPollingAttempts = 30, // 5 minutes with 10-second interval
    pollingInterval = 10000, // 10 seconds
  } = options;

  // Upload the audio file
  const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
    method: 'POST',
    headers: {
      Authorization: env.ASSEMBLYAI_API_KEY,
    },
    body: audioBlob,
  });

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload audio file');
  }

  const { upload_url } = await uploadResponse.json();

  // Start transcription
  const transcribeResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      Authorization: env.ASSEMBLYAI_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: upload_url,
      language_code: languageCode,
      sentiment_analysis: true,
      emotion_detection: true,
    }),
  });

  if (!transcribeResponse.ok) {
    throw new Error('Failed to start transcription');
  }

  const { id: transcriptId } = await transcribeResponse.json();

  // Poll for results
  let attempts = 0;
  while (attempts < maxPollingAttempts) {
    const pollingResponse = await fetch(
      `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
      {
        headers: {
          Authorization: env.ASSEMBLYAI_API_KEY,
        },
      }
    );

    if (!pollingResponse.ok) {
      throw new Error('Failed to get transcription status');
    }

    const result: AssemblyAIResponse = await pollingResponse.json();

    if (result.status === 'completed' && result.text) {
      // Extract sentiment and emotions from the first result (assuming single utterance)
      const sentiment = result.sentiment_analysis_results?.[0] || {
        sentiment: 'neutral',
        confidence: 0,
      };
      const emotions = result.emotion_analysis_results?.[0]?.emotions || {};

      return {
        text: result.text,
        sentiment: {
          label: sentiment.sentiment,
          score: sentiment.confidence,
        },
        emotions,
        confidence: result.confidence || 0,
      };
    }

    if (result.status === 'error') {
      throw new Error(result.error || 'Unknown error occurred');
    }

    attempts++;
    if (attempts >= maxPollingAttempts) {
      const timeoutError = new Error('Transcription timed out');
      // Ensure the error is handled
      return Promise.reject(timeoutError);
    }
    await new Promise(resolve => setTimeout(resolve, pollingInterval));
  }

  // This is a fallback that shouldn't be reached since the loop will always either
  // return a successful result or reject with a timeout error when attempts >= maxPollingAttempts
  throw new Error('Transcription timed out');
}
