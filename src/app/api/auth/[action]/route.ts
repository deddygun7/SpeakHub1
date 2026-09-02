import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  badRequest,
  createSession,
  destroySession,
  getCurrentUser,
  hashPassword,
  serializeMe,
  verifyPassword,
} from "@/lib/auth";
import { ensureSeed } from "@/lib/server";

export const dynamic = "force-dynamic";

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
const RESERVED = new Set(["bartender", "admin", "system", "bot", "root"]);

export async function GET(_req: Request, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params;
  if (action !== "me") return badRequest("Unknown action", 404);
  const user = await getCurrentUser();
  if (!user) return Response.json({ user: null });
  return Response.json({ user: serializeMe(user) });
}

export async function POST(req: Request, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params;
  await ensureSeed();

  if (action === "logout") {
    await destroySession();
    return Response.json({ ok: true });
  }

  let body: { username?: string; password?: string; displayName?: string } = {};
  try {
    body = await req.json();
  } catch {
    return badRequest("Некорректный запрос");
  }
  const username = (body.username ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (action === "register") {
    if (!USERNAME_RE.test(username)) return badRequest("Ник: 3–20 символов, латиница, цифры и _");
    if (RESERVED.has(username)) return badRequest("Этот ник занят заведением");
    if (password.length < 6) return badRequest("Пароль минимум 6 символов");
    const displayName = (body.displayName ?? "").trim().slice(0, 48) || username;
    const exists = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
    if (exists.length) return badRequest("Ник уже занят. Попробуй другой.", 409);
    const [user] = await db
      .insert(users)
      .values({ username, displayName, passwordHash: hashPassword(password) })
      .returning();
    await createSession(user.id);
    return Response.json({ user: serializeMe(user) });
  }

  if (action === "login") {
    if (!username || !password) return badRequest("Введи ник и пароль");
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (!user || user.isBot || !verifyPassword(password, user.passwordHash)) {
      return badRequest("Неверный ник или пароль", 401);
    }
    await createSession(user.id);
    return Response.json({ user: serializeMe(user) });
  }

  return badRequest("Unknown action", 404);
}
