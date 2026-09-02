import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize, parse } from 'cookie';
import { db } from '@/server/db';
import { users } from '@/db/schema';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const TOKEN_NAME = 'sb_token';

export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return await bcrypt.compare(password, hash);
}

export function signToken(payload: any) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

export function setTokenCookie(res: any, token: string) {
  const cookie = serialize(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  res.setHeader('Set-Cookie', cookie);
}

export function clearTokenCookie(res: any) {
  const cookie = serialize(TOKEN_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: -1,
  });
  res.setHeader('Set-Cookie', cookie);
}

export async function getUserFromRequest(req: any) {
  const cookieHeader = req.headers?.cookie;
  if (!cookieHeader) return null;
  const parsed = parse(cookieHeader || '');
  const token = parsed[TOKEN_NAME];
  if (!token) return null;
  const payload: any = verifyToken(token);
  if (!payload?.id) return null;
  const user = await db.select().from(users).where(users.id.eq(payload.id)).limit(1);
  return user[0] ?? null;
}
