import { formatDuration, normalizeLanguageCode, validateAudioFormat } from '@/lib/voice/utils';
import { describe, expect, it } from 'vitest';

describe('Voice Utilities', () => {
  describe('formatDuration', () => {
    it('should format seconds correctly', () => {
      expect(formatDuration(30)).toBe('0:30');
      expect(formatDuration(65)).toBe('1:05');
      expect(formatDuration(3600)).toBe('60:00');
    });

    it('should handle zero and negative values', () => {
      expect(formatDuration(0)).toBe('0:00');
      expect(formatDuration(-30)).toBe('0:00');
    });

    it('should handle decimal values', () => {
      expect(formatDuration(30.5)).toBe('0:31');
      expect(formatDuration(59.9)).toBe('1:00');
    });
  });

  describe('validateAudioFormat', () => {
    it('should accept valid audio formats', () => {
      expect(validateAudioFormat('audio/webm')).toBe(true);
      expect(validateAudioFormat('audio/wav')).toBe(true);
      expect(validateAudioFormat('audio/mp3')).toBe(true);
      expect(validateAudioFormat('audio/mpeg')).toBe(true);
    });

    it('should reject invalid audio formats', () => {
      expect(validateAudioFormat('video/mp4')).toBe(false);
      expect(validateAudioFormat('image/png')).toBe(false);
      expect(validateAudioFormat('')).toBe(false);
      expect(validateAudioFormat('invalid')).toBe(false);
    });

    it('should handle undefined and null', () => {
      expect(validateAudioFormat(undefined)).toBe(false);
      expect(validateAudioFormat(null)).toBe(false);
    });
  });

  describe('validateAudioFormat additional cases', () => {
    it('should handle all supported audio formats', () => {
      expect(validateAudioFormat('audio/ogg')).toBe(true);
      expect(validateAudioFormat('audio/m4a')).toBe(true);
      expect(validateAudioFormat('audio/aac')).toBe(true);
    });

    it('should handle case sensitivity', () => {
      expect(validateAudioFormat('AUDIO/WAV')).toBe(false);
      expect(validateAudioFormat('Audio/Mpeg')).toBe(false);
    });

    it('should reject malformed MIME types', () => {
      expect(validateAudioFormat('audio-mp3')).toBe(false);
      expect(validateAudioFormat('audio/')).toBe(false);
      expect(validateAudioFormat('/mp3')).toBe(false);
    });
  });

  describe('normalizeLanguageCode', () => {
    it('should normalize valid language codes', () => {
      expect(normalizeLanguageCode('en')).toBe('en');
      expect(normalizeLanguageCode('en-US')).toBe('en');
      expect(normalizeLanguageCode('en-GB')).toBe('en');
      expect(normalizeLanguageCode('es-ES')).toBe('es');
    });

    it('should handle invalid language codes', () => {
      expect(normalizeLanguageCode('invalid')).toBe('en');
      expect(normalizeLanguageCode('')).toBe('en');
      expect(normalizeLanguageCode('xx-YY')).toBe('en');
    });

    it('should handle undefined and null', () => {
      expect(normalizeLanguageCode(undefined)).toBe('en');
      expect(normalizeLanguageCode(null)).toBe('en');
    });
  });

  describe('normalizeLanguageCode additional cases', () => {
    it('should handle complex language codes', () => {
      expect(normalizeLanguageCode('en-US-x-private')).toBe('en');
      expect(normalizeLanguageCode('zh-Hans-CN')).toBe('zh');
      expect(normalizeLanguageCode('pt-BR')).toBe('pt');
    });

    it('should handle case insensitivity', () => {
      expect(normalizeLanguageCode('EN')).toBe('en');
      expect(normalizeLanguageCode('En-us')).toBe('en');
      expect(normalizeLanguageCode('FR-fr')).toBe('fr');
    });

    it('should handle unsupported languages with variants', () => {
      expect(normalizeLanguageCode('xx-YY')).toBe('en');
      expect(normalizeLanguageCode('und-Latn')).toBe('en');
      expect(normalizeLanguageCode('mis-x-private')).toBe('en');
    });

    it('should handle malformed language codes', () => {
      expect(normalizeLanguageCode('e')).toBe('en');
      expect(normalizeLanguageCode('eng')).toBe('en');
      expect(normalizeLanguageCode('en_US')).toBe('en');
    });
  });

  describe('formatDuration edge cases', () => {
    it('should handle large numbers', () => {
      expect(formatDuration(3601)).toBe('60:01');
      expect(formatDuration(7200)).toBe('120:00');
    });

    it('should handle floating point precision', () => {
      expect(formatDuration(59.999)).toBe('1:00');
      expect(formatDuration(59.001)).toBe('0:59');
      expect(formatDuration(0.1)).toBe('0:00');
      expect(formatDuration(0.9)).toBe('0:01');
    });

    it('should handle very small numbers', () => {
      expect(formatDuration(0.001)).toBe('0:00');
      expect(formatDuration(0.499)).toBe('0:00');
      expect(formatDuration(0.5)).toBe('0:01');
    });
  });
}); 