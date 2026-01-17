import { Hono } from 'hono';
import type { Bindings } from '../../types';

const voice = new Hono<{ Bindings: Bindings }>();

// Supported languages with voice codes
const VOICE_LANGUAGES: Record<string, { name: string; code: string; rtl: boolean }> = {
  en: { name: 'English', code: 'en-US', rtl: false },
  ar: { name: 'Arabic', code: 'ar-SA', rtl: true },
  es: { name: 'Spanish', code: 'es-ES', rtl: false },
  fr: { name: 'French', code: 'fr-FR', rtl: false },
  de: { name: 'German', code: 'de-DE', rtl: false }
};

// POST /api/voice/speech-to-text - Convert audio to text (using Gemini)
voice.post('/speech-to-text', async (c) => {
  const userId = c.get('userId') as string;
  if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401);
  
  try {
    const formData = await c.req.formData();
    const audioFile = formData.get('audio') as File;
    const language = formData.get('language') as string || 'en';
    
    if (!audioFile) {
      return c.json({ success: false, error: 'Audio file required' }, 400);
    }
    
    // Convert audio to base64
    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    // Use Gemini for transcription
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${c.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: `Transcribe this audio to text. Language: ${VOICE_LANGUAGES[language]?.name || 'English'}. Return only the transcription, no additional text.` },
              {
                inline_data: {
                  mime_type: audioFile.type || 'audio/webm',
                  data: base64Audio
                }
              }
            ]
          }]
        })
      }
    );
    
    if (!response.ok) {
      return c.json({ success: false, error: 'Transcription failed' }, 500);
    }
    
    const data = await response.json() as any;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    return c.json({ success: true, text, language });
  } catch (error) {
    console.error('Speech-to-text error:', error);
    return c.json({ success: false, error: 'Transcription failed' }, 500);
  }
});

// GET /api/voice/languages - Get supported voice languages
voice.get('/languages', (c) => {
  return c.json({
    success: true,
    languages: Object.entries(VOICE_LANGUAGES).map(([code, info]) => ({
      code,
      ...info
    }))
  });
});

// POST /api/tts - Text-to-speech (returns audio URL or base64)
voice.post('/tts', async (c) => {
  const userId = c.get('userId') as string;
  if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401);
  
  const { text, language = 'en', rate = 1.0 } = await c.req.json();
  
  if (!text?.trim()) {
    return c.json({ success: false, error: 'Text required' }, 400);
  }
  
  // Return TTS configuration for Web Speech API (client-side)
  // Server can't generate audio directly without external TTS service
  const voiceConfig = VOICE_LANGUAGES[language] || VOICE_LANGUAGES.en;
  
  return c.json({
    success: true,
    tts: {
      text,
      lang: voiceConfig.code,
      rate: Math.max(0.5, Math.min(2.0, rate)),
      pitch: 1.0,
      volume: 1.0
    }
  });
});

export default voice;
