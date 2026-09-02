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
  // Next.js route handlers use Response object, which has headers append via headers.set in different ways.
  // For NextApiResponse we can setHeader directly. We'll support both by checking setHeader.
  if (res && typeof res.setHeader === 'function') {
    res.setHeader('Set-Cookie', cookie);
  } else if (res && typeof res.headers === 'object' && typeof res.headers.append === 'function') {
    // e.g., Next Response
    res.headers.append('Set-Cookie', cookie);
  }
}

export function clearTokenCookie(res: any) {
  const cookie = serialize(TOKEN_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: -1,
  });
  if (res && typeof res.setHeader === 'function') {
    res.setHeader('Set-Cookie', cookie);
  } else if (res && typeof res.headers === 'object' && typeof res.headers.append === 'function') {
    res.headers.append('Set-Cookie', cookie);
  }
}

export async function getUserFromRequest(req: any) {
  // Accept either a Node/Next API request (with headers) or an object with headers.cookie string
  const cookieHeader = req?.headers?.cookie ?? req?.cookie ?? req?.cookies ?? null;
  let cookieString: string | null = null;
  if (typeof cookieHeader === 'string') cookieString = cookieHeader;
  else if (cookieHeader && typeof cookieHeader.get === 'function') {
    // headers object with get
    cookieString = cookieHeader.get('cookie') || null;
  }
  if (!cookieString) return null;
  const parsed = parse(cookieString || '');
  const token = parsed[TOKEN_NAME];
  if (!token) return null;
  const payload: any = verifyToken(token);
  if (!payload?.id) return null;
  const user = await db.select().from(users).where(users.id.eq(payload.id)).limit(1);
  return user[0] ?? null;
}

// Compatibility helpers expected by existing app routes
export async function getCurrentUser() {
  // In Next.js app router route handlers we can use cookies() helper
  try {
    // dynamic import to avoid runtime errors in non-next environments
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { cookies } = require('next/headers');
    const cookieStore = cookies();
    const tokenCookie = cookieStore.get(TOKEN_NAME)?.value;
    if (!tokenCookie) return null;
    const payload: any = verifyToken(tokenCookie);
    if (!payload?.id) return null;
    const user = await db.select().from(users).where(users.id.eq(payload.id)).limit(1);
    return user[0] ?? null;
  } catch (e) {
    // Fallback: no cookies available (e.g., during static build) or require failed
    return null;
  }
}

export function unauthorized() {
  return new Response(null, { status: 401 });
}
