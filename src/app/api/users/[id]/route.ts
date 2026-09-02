import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { channelMembers, channels, userAchievements, users } from "@/db/schema";
import { badRequest, getCurrentUser, unauthorized } from "@/lib/auth";
import { ensureMember } from "@/lib/server";
import { ACHIEVEMENT_MAP, levelProgress, rankForLevel } from "@/lib/game";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Public profile */
export async function GET(_req: Request, ctx: Ctx) {
  const me = await getCurrentUser();
  if (!me) return unauthorized();
  const id = Number((await ctx.params).id);
  const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!u) return badRequest("Пользователь не найден", 404);
  const ach = await db
    .select({ code: userAchievements.code, unlockedAt: userAchievements.unlockedAt })
    .from(userAchievements)
    .where(eq(userAchievements.userId, id))
    .orderBy(userAchievements.unlockedAt);
  const prog = levelProgress(u.xp);
  return Response.json({
    user: {
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      bio: u.bio,
      status: u.status,
      favoriteWhisky: u.favoriteWhisky,
      title: u.title,
      nameColor: u.nameColor,
      xp: u.xp,
      level: prog.level,
      levelPct: prog.pct,
      rank: rankForLevel(prog.level),
      messagesCount: u.messagesCount,
      cheersReceived: u.cheersReceived,
      cheersGiven: u.cheersGiven,
      dailyStreak: u.dailyStreak,
      isBot: u.isBot,
      online: u.lastSeen.getTime() > Date.now() - 45_000,
      lastSeen: u.lastSeen.toISOString(),
      createdAt: u.createdAt.toISOString(),
      achievements: ach.map((a) => ({ ...ACHIEVEMENT_MAP[a.code], unlockedAt: a.unlockedAt.toISOString() })).filter((a) => a.code),
    },
  });
}

/** Open (or find) a DM channel with this user */
export async function POST(_req: Request, ctx: Ctx) {
  const me = await getCurrentUser();
  if (!me) return unauthorized();
  const id = Number((await ctx.params).id);
  if (id === me.id) return badRequest("Поговорить с собой можно и без чата.");
  const [other] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!other) return badRequest("Пользователь не найден", 404);

  // find existing dm channel where both are members
  const mine = await db
    .select({ channelId: channelMembers.channelId })
    .from(channelMembers)
    .innerJoin(channels, eq(channels.id, channelMembers.channelId))
    .where(and(eq(channelMembers.userId, me.id), eq(channels.type, "dm")));
  const ids = mine.map((m) => m.channelId);
  if (ids.length) {
    const shared = await db
      .select({ channelId: channelMembers.channelId })
      .from(channelMembers)
      .where(and(inArray(channelMembers.channelId, ids), eq(channelMembers.userId, id)))
      .limit(1);
    if (shared.length) return Response.json({ channelId: shared[0].channelId, existed: true });
  }
  const [ch] = await db
    .insert(channels)
    .values({ type: "dm", name: `${me.username}+${other.username}`, icon: "🤫" })
    .returning();
  await ensureMember(ch.id, me.id);
  await ensureMember(ch.id, id);
  return Response.json({ channelId: ch.id, existed: false });
}


