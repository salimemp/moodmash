/**
 * Format a duration in seconds to MM:SS format
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
 */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0:00';
  
  const roundedSeconds = Math.round(seconds);
  const minutes = Math.floor(roundedSeconds / 60);
  const remainingSeconds = roundedSeconds % 60;
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Validate if a given MIME type is a supported audio format
 * @param mimeType - MIME type to validate
 * @returns True if supported, false otherwise
 */
export function validateAudioFormat(mimeType: string | null | undefined): boolean {
  if (!mimeType) return false;
  
  const supportedFormats = [
    'audio/webm',
    'audio/wav',
    'audio/mp3',
    'audio/mpeg',
    'audio/ogg',
    'audio/m4a',
    'audio/aac'
  ];
  
  return supportedFormats.includes(mimeType);
}

/**
 * Normalize a language code to its base form (e.g., 'en-US' -> 'en')
 * @param languageCode - Language code to normalize
 * @returns Normalized language code
 */
export function normalizeLanguageCode(languageCode: string | null | undefined): string {
  if (!languageCode) return 'en';
  
  const supportedLanguages = [
    'en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'hi', 'ja', 'ko', 'zh'
  ];
  
  // Extract base language code (e.g., 'en' from 'en-US')
  const baseCode = languageCode.split('-')[0].toLowerCase();
  
  return supportedLanguages.includes(baseCode) ? baseCode : 'en';
} 