import fs from 'fs';
import path from 'path';

// Type for translation services
export type TranslationService = 'google' | 'deepl' | 'openai';

// Interface for the translation request
export interface TranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  service?: TranslationService;
}

// Interface for the translation response
export interface TranslationResponse {
  translatedText: string;
  detectedLanguage?: string;
  confidence?: number;
}

/**
 * Translate text using Google Translate API
 * @param text - Text to translate
 * @param targetLanguage - Target language code
 * @param sourceLanguage - Source language code (optional)
 * @returns Promise with translated text
 */
export async function translateWithGoogle(
  text: string,
  targetLanguage: string,
  sourceLanguage: string = 'auto'
): Promise<TranslationResponse> {
  try {
    // Check if API key is available in environment without directly accessing a property
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY || '';
    if (!apiKey) {
      throw new Error('Google Translate API key is not configured');
    }

    const url = new URL('https://translation.googleapis.com/language/translate/v2');
    url.searchParams.append('key', apiKey);
    url.searchParams.append('q', text);
    url.searchParams.append('target', targetLanguage);
    
    if (sourceLanguage !== 'auto') {
      url.searchParams.append('source', sourceLanguage);
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Google Translate API error: ${response.statusText}`);
    }

    const data = await response.json();
    const translation = data.data.translations[0];

    return {
      translatedText: translation.translatedText,
      detectedLanguage: translation.detectedSourceLanguage,
      confidence: 0.9, // Google doesn't provide confidence, using default
    };
  } catch (error) {
    console.error('Google Translate error:', error);
    throw error;
  }
}

/**
 * Translate text using DeepL API
 * @param text - Text to translate
 * @param targetLanguage - Target language code
 * @param sourceLanguage - Source language code (optional)
 * @returns Promise with translated text
 */
export async function translateWithDeepL(
  text: string,
  targetLanguage: string,
  sourceLanguage: string = 'auto'
): Promise<TranslationResponse> {
  try {
    // Check if API key is available in environment without directly accessing a property
    const apiKey = process.env.DEEPL_API_KEY || '';
    if (!apiKey) {
      throw new Error('DeepL API key is not configured');
    }

    // Convert ISO language codes to DeepL format
    const deepLTargetLanguage = targetLanguage.toUpperCase();
    const deepLSourceLanguage = sourceLanguage !== 'auto' ? sourceLanguage.toUpperCase() : null;

    const url = 'https://api-free.deepl.com/v2/translate';
    
    const formData = new URLSearchParams();
    formData.append('auth_key', apiKey);
    formData.append('text', text);
    formData.append('target_lang', deepLTargetLanguage);
    
    if (deepLSourceLanguage) {
      formData.append('source_lang', deepLSourceLanguage);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new Error(`DeepL API error: ${response.statusText}`);
    }

    const data = await response.json();
    const translation = data.translations[0];

    return {
      translatedText: translation.text,
      detectedLanguage: translation.detected_source_language?.toLowerCase(),
      confidence: 0.95, // DeepL doesn't provide confidence, using default
    };
  } catch (error) {
    console.error('DeepL translation error:', error);
    throw error;
  }
}

/**
 * Translate text using OpenAI API
 * @param text - Text to translate
 * @param targetLanguage - Target language code
 * @param sourceLanguage - Source language code (optional)
 * @returns Promise with translated text
 */
export async function translateWithOpenAI(
  text: string,
  targetLanguage: string,
  sourceLanguage: string = 'auto'
): Promise<TranslationResponse> {
  try {
    // Check if API key is available in environment without directly accessing a property
    const apiKey = process.env.OPENAI_API_KEY || '';
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    // Get full language name for better results
    const getLanguageName = (code: string): string => {
      const languages: Record<string, string> = {
        en: 'English',
        es: 'Spanish',
        fr: 'French',
        de: 'German',
        zh: 'Chinese',
        ja: 'Japanese',
        ko: 'Korean',
        ru: 'Russian',
        pt: 'Portuguese',
        it: 'Italian',
        ar: 'Arabic',
        he: 'Hebrew',
        fa: 'Persian',
        ur: 'Urdu',
        hi: 'Hindi',
        bn: 'Bengali',
        tr: 'Turkish',
        nl: 'Dutch',
        sv: 'Swedish',
        pl: 'Polish',
      };
      return languages[code] || code;
    };

    const targetLanguageName = getLanguageName(targetLanguage);
    const sourceLanguageName = sourceLanguage !== 'auto' ? getLanguageName(sourceLanguage) : 'the source language';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the following text from ${sourceLanguageName} to ${targetLanguageName}. Maintain the formatting and structure of the original text. Only respond with the translated text, nothing else.`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const translatedText = data.choices[0].message.content.trim();

    return {
      translatedText,
      confidence: 0.85, // OpenAI doesn't provide confidence, using default
    };
  } catch (error) {
    console.error('OpenAI translation error:', error);
    throw error;
  }
}

/**
 * Translate text using the specified service
 * @param request - Translation request
 * @returns Promise with translated text
 */
export async function translateText(
  request: TranslationRequest
): Promise<TranslationResponse> {
  const { text, sourceLanguage, targetLanguage, service = 'google' } = request;

  switch (service) {
    case 'google':
      return translateWithGoogle(text, targetLanguage, sourceLanguage);
    case 'deepl':
      return translateWithDeepL(text, targetLanguage, sourceLanguage);
    case 'openai':
      return translateWithOpenAI(text, targetLanguage, sourceLanguage);
    default:
      throw new Error(`Unsupported translation service: ${service}`);
  }
}

/**
 * Check if a translation file exists
 * @param locale - Locale code
 * @param namespace - Translation namespace
 * @returns Boolean indicating if file exists
 */
export function translationFileExists(locale: string, namespace: string): boolean {
  try {
    const filePath = path.join(process.cwd(), 'public', 'locales', locale, `${namespace}.json`);
    return fs.existsSync(filePath);
  } catch (error) {
    console.error(`Error checking translation file: ${error}`);
    return false;
  }
}

/**
 * Read a translation file
 * @param locale - Locale code
 * @param namespace - Translation namespace
 * @returns Translation object or null if not found
 */
export function readTranslationFile(locale: string, namespace: string): Record<string, any> | null {
  try {
    const filePath = path.join(process.cwd(), 'public', 'locales', locale, `${namespace}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading translation file: ${error}`);
    return null;
  }
}

/**
 * Write a translation file
 * @param locale - Locale code
 * @param namespace - Translation namespace
 * @param data - Translation data
 * @returns Boolean indicating success
 */
export function writeTranslationFile(
  locale: string,
  namespace: string,
  data: Record<string, any>
): boolean {
  try {
    const dirPath = path.join(process.cwd(), 'public', 'locales', locale);
    const filePath = path.join(dirPath, `${namespace}.json`);

    // Create directory if it doesn't exist
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Write file with pretty formatting
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing translation file: ${error}`);
    return false;
  }
}

/**
 * Recursively translate an object's string values
 * @param obj - Object to translate
 * @param targetLanguage - Target language code
 * @param sourceLanguage - Source language code
 * @param service - Translation service to use
 * @returns Promise with translated object
 */
export async function translateObject(
  obj: Record<string, any>,
  targetLanguage: string,
  sourceLanguage: string = 'en',
  service: TranslationService = 'google'
): Promise<Record<string, any>> {
  const result: Record<string, any> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];

      if (typeof value === 'string') {
        try {
          // Skip empty strings and values that look like variables
          if (!value || value.includes('{{') || value.includes('{$')) {
            result[key] = value;
          } else {
            const translation = await translateText({
              text: value,
              sourceLanguage,
              targetLanguage,
              service,
            });
            result[key] = translation.translatedText;
          }
        } catch (error) {
          console.error(`Error translating key ${key}:`, error);
          result[key] = value; // Use original value on error
        }
      } else if (typeof value === 'object' && value !== null) {
        // Recursively translate nested objects
        result[key] = await translateObject(value, targetLanguage, sourceLanguage, service);
      } else {
        result[key] = value;
      }
    }
  }

  return result;
}

/**
 * Generate missing translations for a namespace and locale
 * @param locale - Target locale code
 * @param namespace - Translation namespace
 * @param service - Translation service to use
 * @returns Promise with translation status
 */
export async function generateMissingTranslations(
  locale: string,
  namespace: string,
  service: TranslationService = 'google'
): Promise<{ success: boolean; message: string }> {
  try {
    if (locale === 'en') {
      return { success: false, message: 'Cannot generate for source locale (en)' };
    }

    // Read source (English) translations
    const sourceTranslations = readTranslationFile('en', namespace);
    if (!sourceTranslations) {
      return { success: false, message: `Source translations for namespace ${namespace} not found` };
    }

    // Read existing target translations (if any)
    let targetTranslations = readTranslationFile(locale, namespace) || {};

    // Only translate keys that don't already exist in the target
    const missingKeys = findMissingKeys(sourceTranslations, targetTranslations);
    if (Object.keys(missingKeys).length === 0) {
      return { success: true, message: `No missing translations for ${locale}/${namespace}` };
    }

    // Translate missing keys
    const translatedMissingKeys = await translateObject(missingKeys, locale, 'en', service);

    // Merge with existing translations
    targetTranslations = deepMerge(targetTranslations, translatedMissingKeys);

    // Write updated translations
    const success = writeTranslationFile(locale, namespace, targetTranslations);
    
    return {
      success,
      message: success
        ? `Successfully generated ${Object.keys(missingKeys).length} missing translations for ${locale}/${namespace}`
        : `Failed to write translations for ${locale}/${namespace}`,
    };
  } catch (error) {
    console.error(`Error generating translations:`, error);
    return {
      success: false,
      message: `Error generating translations: ${(error as Error).message}`,
    };
  }
}

/**
 * Find keys that exist in the source but not in the target
 * @param source - Source object
 * @param target - Target object
 * @returns Object with missing keys
 */
function findMissingKeys(
  source: Record<string, any>,
  target: Record<string, any>,
  prefix: string = ''
): Record<string, any> {
  const missingKeys: Record<string, any> = {};

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const currentKey = prefix ? `${prefix}.${key}` : key;
      const sourceValue = source[key];
      const targetValue = target[key];

      if (targetValue === undefined) {
        // Key doesn't exist in target
        missingKeys[key] = sourceValue;
      } else if (typeof sourceValue === 'object' && sourceValue !== null && typeof targetValue === 'object' && targetValue !== null) {
        // Recursively check nested objects
        const nestedMissingKeys = findMissingKeys(sourceValue, targetValue, currentKey);
        if (Object.keys(nestedMissingKeys).length > 0) {
          missingKeys[key] = nestedMissingKeys;
        }
      }
    }
  }

  return missingKeys;
}

/**
 * Deep merge two objects
 * @param target - Target object
 * @param source - Source object
 * @returns Merged object
 */
function deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        typeof result[key] === 'object' &&
        result[key] !== null
      ) {
        result[key] = deepMerge(result[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }

  return result;
} 