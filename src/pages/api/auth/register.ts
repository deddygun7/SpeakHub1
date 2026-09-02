import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/server/db';
import { users } from '@/db/schema';
import { hashPassword, signToken, setTokenCookie } from '@/lib/auth';

const ADMIN_USERS = (process.env.ADMIN_USERS || '').split(',').map((s) => s.trim()).filter(Boolean);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { nick, username, password } = req.body || {};
  const userName = (username || nick || '').trim();
  if (!userName || !password) return res.status(400).json({ error: 'username and password required' });

  // check unique username
  const exists = await db.select().from(users).where(users.username.eq(userName)).limit(1);
  if (exists.length) return res.status(409).json({ error: 'username already taken' });

  const password_hash = await hashPassword(password);
  const role = ADMIN_USERS.includes(userName) ? 'founder' : 'user';

  const result = await db.insert(users).values({ username: userName, password_hash, role }).returning();
  const created = result[0];
  const token = signToken({ id: created.id, username: created.username, role: created.role });
  setTokenCookie(res, token);
  return res.status(201).json({ ok: true, user: { id: created.id, username: created.username, role: created.role } });
}
