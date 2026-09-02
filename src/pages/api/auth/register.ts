import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/server/db';
import { users } from '@/db/schema';
import { hashPassword, signToken, setTokenCookie } from '@/lib/auth';

const ADMIN_USERS = (process.env.ADMIN_USERS || '').split(',').map(s => s.trim()).filter(Boolean);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { nick, password } = req.body || {};
  if (!nick || !password) return res.status(400).json({ error: 'nick and password required' });

  // check unique nick
  const exists = await db.select().from(users).where(users.nick.eq(nick)).limit(1);
  if (exists.length) return res.status(409).json({ error: 'nick already taken' });

  const password_hash = await hashPassword(password);
  const role = ADMIN_USERS.includes(nick) ? 'founder' : 'user';

  const result = await db.insert(users).values({ nick, password_hash, role }).returning();
  const created = result[0];
  const token = signToken({ id: created.id, nick: created.nick, role: created.role });
  setTokenCookie(res, token);
  return res.status(201).json({ ok: true, user: { id: created.id, nick: created.nick, role: created.role } });
}
