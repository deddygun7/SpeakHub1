import { NextApiRequest, NextApiResponse } from 'next';
import { clearTokenCookie } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  clearTokenCookie(res);
  return res.status(200).json({ ok: true });
}
