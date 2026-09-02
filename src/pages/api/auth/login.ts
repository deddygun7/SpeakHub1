import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/server/db';
import { users } from '@/db/schema';
import { verifyPassword, signToken, setTokenCookie } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { nick, username, password } = req.body || {};
  const userName = (username || nick || '').trim();
  if (!userName || !password) return res.status(400).json({ error: 'username and password required' });

  const found = await db.select().from(users).where(users.username.eq(userName)).limit(1);
  if (!found.length) return res.status(404).json({ error: 'user not found' });
  const user = found[0];
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });

  const token = signToken({ id: user.id, username: user.username, role: user.role });
  setTokenCookie(res, token);
  return res.status(200).json({ ok: true, user: { id: user.id, username: user.username, role: user.role } });
}
