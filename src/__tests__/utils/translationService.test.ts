import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  generateMissingTranslations,
  readTranslationFile,
  translateText,
  translationFileExists,
  TranslationRequest,
  writeTranslationFile
} from '@/utils/translationService';

// Mock dependencies - use a more comprehensive approach to include default exports
vi.mock('fs', () => {
  const existsSyncMock = vi.fn();
  const readFileSyncMock = vi.fn();
  const writeFileSyncMock = vi.fn();
  const mkdirSyncMock = vi.fn();

  return {
    default: {
      existsSync: existsSyncMock,
      readFileSync: readFileSyncMock,
      writeFileSync: writeFileSyncMock,
      mkdirSync: mkdirSyncMock
    },
    existsSync: existsSyncMock,
    readFileSync: readFileSyncMock,
    writeFileSync: writeFileSyncMock,
    mkdirSync: mkdirSyncMock
  };
});

// Mock path module correctly
vi.mock('path', () => {
  const joinMock = vi.fn((...args: string[]) => args.join('/'));
  const resolveMock = vi.fn((...args: string[]) => args.join('/'));

  return {
    default: {
      join: joinMock,
      resolve: resolveMock
    },
    join: joinMock,
    resolve: resolveMock
  };
});

// Mock fetch
global.fetch = vi.fn();

// Import fs after mocking for type safety in test code
import * as fs from 'fs';

describe('Translation Service', () => {
  const mockEnv = {
    GOOGLE_TRANSLATE_API_KEY: 'mock-google-key',
    DEEPL_API_KEY: 'mock-deepl-key',
    OPENAI_API_KEY: 'mock-openai-key'
  };
  
  const originalEnv = { ...process.env };
  
  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv, ...mockEnv };
    
    // Setup default mock response for fetch
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          translations: [{ translatedText: 'Bonjour' }]
        }
      })
    });
  });
  
  afterEach(() => {
    process.env = originalEnv;
  });
  
  describe('translateText', () => {
    it('should translate text using Google Translate by default', async () => {
      const request: TranslationRequest = {
        text: 'Hello',
        sourceLanguage: 'en',
        targetLanguage: 'fr'
      };
      
      const result = await translateText(request);
      
      expect(result.translatedText).toBe('Bonjour');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('googleapis.com'),
        expect.any(Object)
      );
    });
    
    it('should handle translation errors gracefully', async () => {
      // Mock a failed response
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid request' })
      });
      
      const request: TranslationRequest = {
        text: 'Hello',
        sourceLanguage: 'en',
        targetLanguage: 'fr'
      };
      
      await expect(translateText(request)).rejects.toThrow();
    });
  });
  
  describe('translationFileExists', () => {
    it('should check if a translation file exists', () => {
      (fs.existsSync as any).mockReturnValue(true);
      
      const result = translationFileExists('en', 'common');
      
      expect(result).toBe(true);
      expect(fs.existsSync).toHaveBeenCalled();
    });
  });
  
  describe('readTranslationFile', () => {
    it('should read and parse a translation file', () => {
      const mockData = JSON.stringify({ hello: 'world' });
      (fs.existsSync as any).mockReturnValue(true);
      (fs.readFileSync as any).mockReturnValue(mockData);
      
      const result = readTranslationFile('en', 'common');
      
      expect(result).toEqual({ hello: 'world' });
    });
    
    it('should return null for non-existent files', () => {
      (fs.existsSync as any).mockReturnValue(false);
      
      const result = readTranslationFile('xx', 'nonexistent');
      
      expect(result).toBeNull();
    });
  });
  
  describe('writeTranslationFile', () => {
    it('should write translations to a file', () => {
      const data = { hello: 'world' };
      
      writeTranslationFile('en', 'common', data);
      
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify(data, null, 2),
        'utf8'
      );
    });
  });
  
  describe('generateMissingTranslations', () => {
    it('should generate missing translations', async () => {
      // Mock file operations
      (fs.existsSync as any).mockReturnValue(true);
      (fs.readFileSync as any)
        .mockReturnValueOnce(JSON.stringify({ 
          greeting: 'Hello',
          welcome: 'Welcome'
        }))
        .mockReturnValueOnce(JSON.stringify({ 
          greeting: 'Bonjour'
        }));
      
      // Mock successful translation
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            translations: [{ translatedText: 'Bienvenue' }]
          }
        })
      });
      
      const result = await generateMissingTranslations('fr', 'common');
      
      expect(result.success).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
    
    it('should handle errors gracefully', async () => {
      // Mock file operations to throw
      (fs.existsSync as any).mockImplementation(() => {
        throw new Error('File access error');
      });
      
      const result = await generateMissingTranslations('fr', 'common');
      
      expect(result.success).toBe(false);
    });
  });
}); 