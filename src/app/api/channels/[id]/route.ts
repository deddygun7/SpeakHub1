import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { channelMembers, channels, users } from "@/db/schema";
import { badRequest, getCurrentUser, unauthorized, verifyPassword } from "@/lib/auth";
import { canAccess, ensureMember, evaluateAchievements, fetchPinned, postSystemMessage } from "@/lib/server";
import { levelFromXp } from "@/lib/game";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const me = await getCurrentUser();
  if (!me) return unauthorized();
  const id = Number((await ctx.params).id);
  if (!Number.isFinite(id)) return badRequest("Bad id");
  const ch = await canAccess(id, me.id);
  if (!ch) {
    const [exists] = await db.select({ id: channels.id, name: channels.name, icon: channels.icon, isPrivate: channels.isPrivate }).from(channels).where(eq(channels.id, id)).limit(1);
    if (exists?.isPrivate) return Response.json({ error: "locked", channel: exists }, { status: 403 });
    return badRequest("Зал не найден", 404);
  }
  const onlineThreshold = Date.now() - 45_000;
  const members = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      nameColor: users.nameColor,
      status: users.status,
      title: users.title,
      xp: users.xp,
      lastSeen: users.lastSeen,
      isBot: users.isBot,
    })
    .from(channelMembers)
    .innerJoin(users, eq(channelMembers.userId, users.id))
    .where(eq(channelMembers.channelId, id))
    .limit(200);
  const pinned = await fetchPinned(id, me.id);
  return Response.json({
    channel: {
      id: ch.id,
      type: ch.type,
      slug: ch.slug,
      name: ch.name,
      icon: ch.icon,
      description: ch.description,
      topic: ch.topic,
      isPrivate: ch.isPrivate,
      createdBy: ch.createdBy,
      createdAt: ch.createdAt.toISOString(),
    },
    members: members
      .map((m) => ({
        id: m.id,
        username: m.username,
        displayName: m.displayName,
        nameColor: m.nameColor,
        status: m.status,
        title: m.title,
        level: levelFromXp(m.xp),
        online: m.lastSeen.getTime() > onlineThreshold,
        isBot: m.isBot,
      }))
      .sort((a, b) => Number(b.online) - Number(a.online) || b.level - a.level),
    pinned,
  });
}

/** Join a room (password for private rooms). */
export async function POST(req: Request, ctx: Ctx) {
  const me = await getCurrentUser();
  if (!me) return unauthorized();
  const id = Number((await ctx.params).id);
  const [ch] = await db.select().from(channels).where(eq(channels.id, id)).limit(1);
  if (!ch || ch.type !== "room") return badRequest("Зал не найден", 404);
  let body: { password?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const already = await db
    .select({ id: channelMembers.id })
    .from(channelMembers)
    .where(and(eq(channelMembers.channelId, id), eq(channelMembers.userId, me.id)))
    .limit(1);
  if (already.length) return Response.json({ ok: true, joined: true });
  if (ch.isPrivate) {
    if (!ch.passwordHash || !verifyPassword(body.password ?? "", ch.passwordHash)) {
      return badRequest("Неверный пароль. Вышибала качает головой.", 403);
    }
  }
  await ensureMember(id, me.id);
  await postSystemMessage(id, `🚪 ${me.displayName} заходит в зал.`);
  const unlocked = await evaluateAchievements(me.id);
  return Response.json({ ok: true, joined: true, unlocked });
}

/** Leave a room. */
export async function DELETE(_req: Request, ctx: Ctx) {
  const me = await getCurrentUser();
  if (!me) return unauthorized();
  const id = Number((await ctx.params).id);
  const [ch] = await db.select().from(channels).where(eq(channels.id, id)).limit(1);
  if (!ch) return badRequest("Не найдено", 404);
  if (ch.slug === "lobby") return badRequest("Из главного зала не уходят — тут наливают.");
  await db.delete(channelMembers).where(and(eq(channelMembers.channelId, id), eq(channelMembers.userId, me.id)));
  if (ch.type === "room") await postSystemMessage(id, `🚶 ${me.displayName} выходит покурить.`);
  return Response.json({ ok: true });
}
