import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/server/db';
import { users } from '@/db/schema';
import { getUserFromRequest } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const me = await getUserFromRequest(req);
  if (!me) return res.status(401).json({ error: 'unauthenticated' });
  // check founder
  if (me.role !== 'founder') return res.status(403).json({ error: 'forbidden' });

  // list users
  const list = await db.select().from(users).orderBy(users.created_at.desc()).limit(200);
  return res.status(200).json({ users: list.map(u => ({ id: u.id, nick: u.nick, role: u.role, avatar_url: u.avatar_url })) });
}
