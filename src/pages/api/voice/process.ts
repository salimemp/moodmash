import { env } from '@/env.mjs';
import { rateLimit } from '@/lib/auth/rate-limit-middleware';
import formidable from 'formidable';
import fs from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';

// Configure formidable for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

interface AssemblyAIResponse {
  id: string;
  status: string;
  text: string;
  confidence: number;
  audio_url: string;
  language_code: string;
  sentiment_analysis_results: Array<{
    text: string;
    sentiment: string;
    confidence: number;
  }>;
  emotion_analysis_results: Array<{
    text: string;
    emotions: {
      [key: string]: number;
    };
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Apply rate limiting
    const isAllowed = await rateLimit(req, res, 'api');
    if (!isAllowed) {
      return;
    }

    // Parse the multipart form data
    const form = formidable({});
    const [fields, files] = await form.parse(req);
    const audioFile = files.audio?.[0];

    if (!audioFile) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Read the file and convert to Blob
    const fileBuffer = await fs.promises.readFile(audioFile.filepath);
    const blob = new Blob([fileBuffer], { type: audioFile.mimetype || 'audio/wav' });

    // Upload the audio file to AssemblyAI
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': env.ASSEMBLYAI_API_KEY,
      },
      body: blob,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload audio file');
    }

    const { upload_url } = await uploadResponse.json();

    // Start the transcription with sentiment and emotion analysis
    const transcribeResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': env.ASSEMBLYAI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: upload_url,
        language_code: fields.language?.[0] || 'en',
        sentiment_analysis: true,
        emotion_detection: true,
      }),
    });

    if (!transcribeResponse.ok) {
      throw new Error('Failed to start transcription');
    }

    const { id: transcriptId } = await transcribeResponse.json();

    // Poll for the transcription result
    let result: AssemblyAIResponse;
    while (true) {
      const pollingResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': env.ASSEMBLYAI_API_KEY,
        },
      });

      if (!pollingResponse.ok) {
        throw new Error('Failed to get transcription status');
      }

      result = await pollingResponse.json();

      if (result.status === 'completed') {
        break;
      } else if (result.status === 'error') {
        throw new Error('Transcription failed');
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Clean up the temporary file
    fs.unlinkSync(audioFile.filepath);

    // Process and format the results
    const overallSentiment = result.sentiment_analysis_results?.[0] || {
      sentiment: 'neutral',
      confidence: 0,
    };

    const emotions = result.emotion_analysis_results?.[0]?.emotions || {};

    return res.status(200).json({
      text: result.text,
      sentiment: {
        label: overallSentiment.sentiment,
        score: overallSentiment.confidence,
      },
      emotions,
      confidence: result.confidence,
    });
  } catch (error) {
    console.error('Voice processing error:', error);
    return res.status(500).json({ error: 'Failed to process voice recording' });
  }
} 