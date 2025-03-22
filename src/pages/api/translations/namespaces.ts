import fs from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

/**
 * API route to get available translation namespaces
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Default to English directory for namespaces
    const localesDir = path.join(process.cwd(), 'public', 'locales');
    const enDir = path.join(localesDir, 'en');
    
    // Get all English files as the reference for available namespaces
    const namespaces = fs.readdirSync(enDir)
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
    
    // Return the namespaces wrapped in an object
    return res.status(200).json({ namespaces });
  } catch (error) {
    console.error('Error getting namespaces:', error);
    return res.status(500).json({ error: 'Failed to get namespaces' });
  }
} 