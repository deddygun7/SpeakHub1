import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users, type User } from "@/db/schema";
import { levelProgress, rankForLevel } from "@/lib/game";

export const SESSION_COOKIE = "neon_dram_session";
const SESSION_DAYS = 30;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

export async function createSession(userId: number): Promise<string> {
  const token = randomBytes(36).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000);
  await db.insert(sessions).values({ token, userId, expiresAt });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    secure: process.env.NODE_ENV === "production" && process.env.COOKIE_INSECURE !== "1",
  });
  return token;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token));
  }
  store.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return rows[0]?.user ?? null;
}

export function unauthorized() {
  return Response.json({ error: "Нужно войти в бар" }, { status: 401 });
}

export function badRequest(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function serializeMe(u: User) {
  const prog = levelProgress(u.xp);
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    bio: u.bio,
    status: u.status,
    favoriteWhisky: u.favoriteWhisky,
    title: u.title,
    nameColor: u.nameColor,
    theme: u.theme,
    xp: u.xp,
    coins: u.coins,
    level: prog.level,
    levelPct: prog.pct,
    levelCurrent: prog.current,
    levelNeeded: prog.needed,
    rank: rankForLevel(prog.level),
    messagesCount: u.messagesCount,
    cheersReceived: u.cheersReceived,
    cheersGiven: u.cheersGiven,
    dailyStreak: u.dailyStreak,
    lastDailyClaim: u.lastDailyClaim?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
  };
}

export type Me = ReturnType<typeof serializeMe>;

export function publicUser(u: User) {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    status: u.status,
    title: u.title,
    nameColor: u.nameColor,
    xp: u.xp,
    isBot: u.isBot,
  };
}
