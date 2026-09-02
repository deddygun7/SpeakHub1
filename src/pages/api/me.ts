import { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(200).json({ user: null });
  return res.status(200).json({ user: { id: user.id, nick: user.nick, role: user.role, avatar_url: user.avatar_url } });
}
