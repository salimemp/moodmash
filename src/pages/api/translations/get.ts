import { SUPPORTED_LANGUAGES } from '@/utils/i18n';
import fs from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

/**
 * API route to get translations for a specific namespace and locale
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get locale and namespace from query parameters
  const { locale, namespace } = req.query;

  // Validate parameters
  if (!locale || !namespace || 
      Array.isArray(locale) || Array.isArray(namespace)) {
    return res.status(400).json({ 
      error: 'Missing or invalid locale or namespace parameters' 
    });
  }

  // Validate locale
  const isValidLocale = SUPPORTED_LANGUAGES.some(lang => lang.code === locale);
  if (!isValidLocale) {
    return res.status(400).json({ error: 'Invalid locale' });
  }

  try {
    const localesDir = path.join(process.cwd(), 'public', 'locales');
    const localeDir = path.join(localesDir, locale);
    
    // Check if locale directory exists
    if (!fs.existsSync(localeDir)) {
      // If the locale directory doesn't exist, create it
      fs.mkdirSync(localeDir, { recursive: true });
    }
    
    const filePath = path.join(localeDir, `${namespace}.json`);
    
    // If the file doesn't exist for this locale, create an empty one
    // and get the English version as a reference
    if (!fs.existsSync(filePath)) {
      const enFilePath = path.join(localesDir, 'en', `${namespace}.json`);
      
      // Check if the English file exists
      if (fs.existsSync(enFilePath)) {
        const enContents = JSON.parse(fs.readFileSync(enFilePath, 'utf8'));
        
        // Create an object with the same structure but with empty values
        const createEmptyTranslations = (obj: any): any => {
          return Object.keys(obj).reduce((result, key) => {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
              result[key] = createEmptyTranslations(obj[key]);
            } else {
              result[key] = '';
            }
            return result;
          }, {} as Record<string, any>);
        };
        
        const emptyTranslations = createEmptyTranslations(enContents);
        
        // Write the empty translations file
        fs.writeFileSync(filePath, JSON.stringify(emptyTranslations, null, 2));
        
        return res.status(200).json({ translations: emptyTranslations });
      } else {
        return res.status(404).json({ error: 'Namespace not found' });
      }
    }
    
    // Read the translations file
    const translations = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    return res.status(200).json({ translations });
  } catch (error) {
    console.error('Error getting translations:', error);
    return res.status(500).json({ error: 'Failed to get translations' });
  }
} 