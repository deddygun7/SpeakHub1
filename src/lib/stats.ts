import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { channels, messages, users } from "@/db/schema";
import { ensureSeed } from "@/lib/server";
import { levelFromXp, rankForLevel } from "@/lib/game";

export async function getPublicStats() {
  await ensureSeed();
  const dayAgo = new Date(Date.now() - 86_400_000);
  const [[{ members }], [{ online }], [{ total }], [{ today }], [{ rooms }]] = await Promise.all([
    db.select({ members: sql<number>`count(*)::int` }).from(users).where(eq(users.isBot, false)),
    db.select({ online: sql<number>`count(*)::int` }).from(users).where(and(eq(users.isBot, false), gt(users.lastSeen, new Date(Date.now() - 45_000)))),
    db.select({ total: sql<number>`count(*)::int` }).from(messages),
    db.select({ today: sql<number>`count(*)::int` }).from(messages).where(gt(messages.createdAt, dayAgo)),
    db.select({ rooms: sql<number>`count(*)::int` }).from(channels).where(eq(channels.type, "room")),
  ]);

  const top = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      nameColor: users.nameColor,
      title: users.title,
      xp: users.xp,
      messagesCount: users.messagesCount,
      cheersReceived: users.cheersReceived,
    })
    .from(users)
    .where(eq(users.isBot, false))
    .orderBy(desc(users.xp))
    .limit(10);

  const [lobby] = await db.select({ id: channels.id }).from(channels).where(eq(channels.slug, "lobby")).limit(1);
  const ticker = lobby
    ? await db
        .select({ content: messages.content, kind: messages.kind, displayName: users.displayName, nameColor: users.nameColor, createdAt: messages.createdAt })
        .from(messages)
        .leftJoin(users, eq(messages.userId, users.id))
        .where(and(eq(messages.channelId, lobby.id), isNull(messages.deletedAt), sql`${messages.kind} in ('text','me','bot')`))
        .orderBy(desc(messages.id))
        .limit(8)
    : [];

  return {
    members,
    online,
    total,
    today,
    rooms,
    leaderboard: top.map((u, i) => ({ ...u, place: i + 1, level: levelFromXp(u.xp), rank: rankForLevel(levelFromXp(u.xp)) })),
    ticker: ticker.reverse().map((t) => ({
      text: t.content.length > 90 ? t.content.slice(0, 90) + "…" : t.content,
      kind: t.kind,
      name: t.displayName ?? "Призрак",
      nameColor: t.nameColor ?? "amber",
      at: t.createdAt.toISOString(),
    })),
  };
}
