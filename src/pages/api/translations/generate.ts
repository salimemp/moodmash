import { generateMissingTranslations, TranslationService } from '@/utils/translationService';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get request body
    const { locale, namespace, service } = req.body as {
      locale: string;
      namespace: string;
      service?: TranslationService;
    };

    // Validate required parameters
    if (!locale || !namespace) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Generate translations
    const result = await generateMissingTranslations(locale, namespace, service);

    // Return result
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Translation generation error:', error);
    return res.status(500).json({ error: 'Failed to generate translations' });
  }
} 