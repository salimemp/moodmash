import type { NextApiRequest, NextApiResponse } from 'next';
import { handlers } from '@/lib/auth/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return await handlers({ req, res });
} 