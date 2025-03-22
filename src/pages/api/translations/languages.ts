import { SUPPORTED_LANGUAGES } from '@/utils/i18n';
import fs from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

/**
 * API route to get available languages and their completion status
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const localesDir = path.join(process.cwd(), 'public', 'locales');
    const enDir = path.join(localesDir, 'en');
    
    // Get all English files to use as a baseline for completeness
    const enFiles = fs.readdirSync(enDir)
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
    
    // Get total keys in English as the baseline
    const totalEnKeys = enFiles.reduce((total, namespace) => {
      const filePath = path.join(enDir, `${namespace}.json`);
      const fileContents = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Count all keys including nested ones
      const countKeys = (obj: any, prefix = ''): number => {
        return Object.keys(obj).reduce((count, key) => {
          const newPrefix = prefix ? `${prefix}.${key}` : key;
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            return count + countKeys(obj[key], newPrefix);
          }
          return count + 1;
        }, 0);
      };
      
      return total + countKeys(fileContents);
    }, 0);
    
    // Calculate completion for each language
    const languages = SUPPORTED_LANGUAGES.map(lang => {
      // English is always 100% complete by definition
      if (lang.code === 'en') {
        return {
          code: lang.code,
          completion: 100
        };
      }
      
      const langDir = path.join(localesDir, lang.code);
      let translatedKeys = 0;
      
      // Skip calculation if the language directory doesn't exist
      if (!fs.existsSync(langDir)) {
        return {
          code: lang.code,
          completion: 0
        };
      }
      
      // Count translated keys for this language
      enFiles.forEach(namespace => {
        const enFilePath = path.join(enDir, `${namespace}.json`);
        const langFilePath = path.join(langDir, `${namespace}.json`);
        
        if (fs.existsSync(langFilePath)) {
          const enContents = JSON.parse(fs.readFileSync(enFilePath, 'utf8'));
          const langContents = JSON.parse(fs.readFileSync(langFilePath, 'utf8'));
          
          // Recursively compare keys
          const countTranslatedKeys = (enObj: any, langObj: any, prefix = ''): number => {
            return Object.keys(enObj).reduce((count, key) => {
              const newPrefix = prefix ? `${prefix}.${key}` : key;
              
              if (typeof enObj[key] === 'object' && enObj[key] !== null) {
                // For nested objects, recurse
                if (typeof langObj?.[key] === 'object' && langObj[key] !== null) {
                  return count + countTranslatedKeys(enObj[key], langObj[key], newPrefix);
                }
                return count;
              } else {
                // For leaf values, check if translation exists and is not empty
                if (langObj?.[key] && langObj[key] !== enObj[key]) {
                  return count + 1;
                }
                return count;
              }
            }, 0);
          };
          
          translatedKeys += countTranslatedKeys(enContents, langContents);
        }
      });
      
      // Calculate completion percentage
      const completionPercentage = Math.round((translatedKeys / totalEnKeys) * 100);
      
      return {
        code: lang.code,
        completion: completionPercentage
      };
    });
    
    // Return the languages wrapped in an object
    return res.status(200).json({ languages });
  } catch (error) {
    console.error('Error getting languages:', error);
    return res.status(500).json({ error: 'Failed to get languages' });
  }
} 