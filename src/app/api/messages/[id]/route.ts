import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { messages, reactions, users } from "@/db/schema";
import { badRequest, getCurrentUser, unauthorized } from "@/lib/auth";
import { addXp, canAccess, evaluateAchievements, hydrateMessages, messageSelect, type Unlock } from "@/lib/server";
import { XP_REWARDS } from "@/lib/game";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function loadOne(id: number, viewerId: number) {
  const rows = await db.select(messageSelect).from(messages).leftJoin(users, eq(messages.userId, users.id)).where(eq(messages.id, id)).limit(1);
  return (await hydrateMessages(rows, viewerId))[0];
}

async function getAccessible(id: number, userId: number) {
  const [m] = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
  if (!m) return null;
  const ch = await canAccess(m.channelId, userId);
  if (!ch) return null;
  return { m, ch };
}

/** Edit own message */
export async function PATCH(req: Request, ctx: Ctx) {
  const me = await getCurrentUser();
  if (!me) return unauthorized();
  const id = Number((await ctx.params).id);
  const found = await getAccessible(id, me.id);
  if (!found) return badRequest("Не найдено", 404);
  if (found.m.userId !== me.id) return badRequest("Можно править только свои сообщения", 403);
  if (found.m.deletedAt) return badRequest("Сообщение удалено");
  let body: { content?: string } = {};
  try {
    body = await req.json();
  } catch {
    return badRequest("Некорректный запрос");
  }
  const content = (body.content ?? "").trim();
  if (!content) return badRequest("Пустое сообщение");
  await db.update(messages).set({ content: content.slice(0, 2000), editedAt: new Date(), updatedAt: new Date() }).where(eq(messages.id, id));
  return Response.json({ message: await loadOne(id, me.id) });
}

/** Soft-delete own message (or any in a room you created) */
export async function DELETE(_req: Request, ctx: Ctx) {
  const me = await getCurrentUser();
  if (!me) return unauthorized();
  const id = Number((await ctx.params).id);
  const found = await getAccessible(id, me.id);
  if (!found) return badRequest("Не найдено", 404);
  const owner = found.m.userId === me.id || found.ch.createdBy === me.id;
  if (!owner) return badRequest("Нельзя удалить чужое сообщение", 403);
  await db.update(messages).set({ deletedAt: new Date(), updatedAt: new Date(), isPinned: false }).where(eq(messages.id, id));
  return Response.json({ message: await loadOne(id, me.id) });
}

/** Actions: react (toggle emoji), pin (toggle) */
export async function POST(req: Request, ctx: Ctx) {
  const me = await getCurrentUser();
  if (!me) return unauthorized();
  const id = Number((await ctx.params).id);
  const found = await getAccessible(id, me.id);
  if (!found) return badRequest("Не найдено", 404);
  let body: { action?: string; emoji?: string } = {};
  try {
    body = await req.json();
  } catch {
    return badRequest("Некорректный запрос");
  }
  let unlocked: Unlock[] = [];

  if (body.action === "react") {
    const emoji = (body.emoji ?? "").trim().slice(0, 16);
    if (!emoji) return badRequest("Нет эмодзи");
    const existing = await db
      .select({ id: reactions.id })
      .from(reactions)
      .where(and(eq(reactions.messageId, id), eq(reactions.userId, me.id), eq(reactions.emoji, emoji)))
      .limit(1);
    if (existing.length) {
      await db.delete(reactions).where(eq(reactions.id, existing[0].id));
    } else {
      await db.insert(reactions).values({ messageId: id, userId: me.id, emoji }).onConflictDoNothing();
      await db.update(users).set({ reactionsCount: sql`${users.reactionsCount} + 1` }).where(eq(users.id, me.id));
      await addXp(me.id, XP_REWARDS.reaction);
      unlocked = await evaluateAchievements(me.id);
    }
    await db.update(messages).set({ updatedAt: new Date() }).where(eq(messages.id, id));
    return Response.json({ message: await loadOne(id, me.id), unlocked });
  }

  if (body.action === "pin") {
    if (found.m.deletedAt) return badRequest("Нельзя закрепить удалённое");
    const next = !found.m.isPinned;
    await db.update(messages).set({ isPinned: next, updatedAt: new Date() }).where(eq(messages.id, id));
    if (next && found.m.userId && found.m.userId !== me.id) {
      await evaluateAchievements(found.m.userId, { pinned: true });
    }
    return Response.json({ message: await loadOne(id, me.id), unlocked });
  }

  return badRequest("Неизвестное действие");
}
