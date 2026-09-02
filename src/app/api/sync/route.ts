import { and, eq, gt, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { channelMembers, messages, users } from "@/db/schema";
import { getCurrentUser, serializeMe, unauthorized } from "@/lib/auth";
import { canAccess, getTyping, hydrateMessages, messageSelect, setTyping } from "@/lib/server";
import { levelFromXp } from "@/lib/game";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return unauthorized();
  let body: { channelId?: number | null; afterId?: number; since?: string; typing?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const now = new Date();
  await db.update(users).set({ lastSeen: now }).where(eq(users.id, me.id));

  const channelId = body.channelId ? Number(body.channelId) : null;
  let newMessages: Awaited<ReturnType<typeof hydrateMessages>> = [];
  let typingNames: string[] = [];

  if (channelId) {
    const ch = await canAccess(channelId, me.id);
    if (ch) {
      if (body.typing) setTyping(channelId, me.id);
      const afterId = Number(body.afterId ?? 0);
      const since = body.since ? new Date(body.since) : new Date(Date.now() - 10_000);
      const rows = await db
        .select(messageSelect)
        .from(messages)
        .leftJoin(users, eq(messages.userId, users.id))
        .where(and(eq(messages.channelId, channelId), or(gt(messages.id, afterId), gt(messages.updatedAt, since))))
        .orderBy(messages.id)
        .limit(100);
      newMessages = await hydrateMessages(rows, me.id);
      const maxNew = newMessages.reduce((mx, m) => Math.max(mx, m.id), 0);
      if (maxNew > 0) {
        await db
          .update(channelMembers)
          .set({ lastReadId: sql`greatest(${channelMembers.lastReadId}, ${maxNew})` })
          .where(and(eq(channelMembers.channelId, channelId), eq(channelMembers.userId, me.id)));
      }
      const typingIds = getTyping(channelId, me.id);
      if (typingIds.length) {
        const rows = await db.select({ name: users.displayName }).from(users).where(inArray(users.id, typingIds));
        typingNames = rows.map((r) => r.name);
      }
    }
  }

  const onlineRows = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      nameColor: users.nameColor,
      status: users.status,
      title: users.title,
      xp: users.xp,
      isBot: users.isBot,
    })
    .from(users)
    .where(or(gt(users.lastSeen, new Date(Date.now() - 45_000)), eq(users.isBot, true)))
    .orderBy(sql`${users.isBot} desc`, sql`${users.xp} desc`)
    .limit(60);

  const unread = await db
    .select({ channelId: messages.channelId, n: sql<number>`count(*)::int` })
    .from(messages)
    .innerJoin(channelMembers, and(eq(channelMembers.channelId, messages.channelId), eq(channelMembers.userId, me.id)))
    .where(and(gt(messages.id, channelMembers.lastReadId), ne(messages.userId, me.id), isNull(messages.deletedAt)))
    .groupBy(messages.channelId);

  const [fresh] = await db.select().from(users).where(eq(users.id, me.id)).limit(1);

  return Response.json({
    now: now.toISOString(),
    messages: newMessages,
    typing: typingNames,
    online: onlineRows.map((u) => ({ ...u, level: levelFromXp(u.xp), online: true })),
    unread: Object.fromEntries(unread.map((u) => [u.channelId, u.n])),
    me: serializeMe(fresh ?? me),
  });
}
