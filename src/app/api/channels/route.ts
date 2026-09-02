import { and, desc, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { channelMembers, channels, messages, users } from "@/db/schema";
import { badRequest, getCurrentUser, hashPassword, unauthorized } from "@/lib/auth";
import { addXp, ensureMember, ensureSeed, evaluateAchievements, postSystemMessage } from "@/lib/server";
import { XP_REWARDS, levelFromXp } from "@/lib/game";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return unauthorized();
  await ensureSeed();

  const myMemberships = await db
    .select({ channelId: channelMembers.channelId, lastReadId: channelMembers.lastReadId })
    .from(channelMembers)
    .where(eq(channelMembers.userId, me.id));
  const memberIds = myMemberships.map((m) => m.channelId);
  const lastReadMap = new Map(myMemberships.map((m) => [m.channelId, m.lastReadId]));

  // All rooms are listed (private ones show a lock; content is guarded by canAccess).
  const roomRows = await db.select().from(channels).where(eq(channels.type, "room")).orderBy(channels.id);

  const dmRows = memberIds.length
    ? await db.select().from(channels).where(and(eq(channels.type, "dm"), inArray(channels.id, memberIds)))
    : [];

  const allIds = [...roomRows, ...dmRows].map((c) => c.id);

  // member counts
  const counts = allIds.length
    ? await db
        .select({ channelId: channelMembers.channelId, n: sql<number>`count(*)::int` })
        .from(channelMembers)
        .where(inArray(channelMembers.channelId, allIds))
        .groupBy(channelMembers.channelId)
    : [];
  const countMap = new Map(counts.map((c) => [c.channelId, c.n]));

  // unread counts for channels I'm a member of
  const unread = memberIds.length
    ? await db
        .select({ channelId: messages.channelId, n: sql<number>`count(*)::int` })
        .from(messages)
        .innerJoin(channelMembers, and(eq(channelMembers.channelId, messages.channelId), eq(channelMembers.userId, me.id)))
        .where(and(sql`${messages.id} > ${channelMembers.lastReadId}`, ne(messages.userId, me.id), isNull(messages.deletedAt)))
        .groupBy(messages.channelId)
    : [];
  const unreadMap = new Map(unread.map((u) => [u.channelId, u.n]));

  // DM partners + last message previews
  const dmPartners = dmRows.length
    ? await db
        .select({
          channelId: channelMembers.channelId,
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          nameColor: users.nameColor,
          status: users.status,
          title: users.title,
          xp: users.xp,
          lastSeen: users.lastSeen,
        })
        .from(channelMembers)
        .innerJoin(users, eq(channelMembers.userId, users.id))
        .where(and(inArray(channelMembers.channelId, dmRows.map((d) => d.id)), ne(channelMembers.userId, me.id)))
    : [];
  const partnerMap = new Map(dmPartners.map((p) => [p.channelId, p]));

  const lastMsgs = dmRows.length
    ? await db
        .selectDistinctOn([messages.channelId], {
          channelId: messages.channelId,
          content: messages.content,
          createdAt: messages.createdAt,
          deletedAt: messages.deletedAt,
        })
        .from(messages)
        .where(inArray(messages.channelId, dmRows.map((d) => d.id)))
        .orderBy(messages.channelId, desc(messages.id))
    : [];
  const lastMap = new Map(lastMsgs.map((m) => [m.channelId, m]));

  const onlineThreshold = Date.now() - 45_000;

  return Response.json({
    rooms: roomRows.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      icon: c.icon,
      description: c.description,
      topic: c.topic,
      isPrivate: c.isPrivate,
      createdBy: c.createdBy,
      members: countMap.get(c.id) ?? 0,
      joined: lastReadMap.has(c.id),
      unread: unreadMap.get(c.id) ?? 0,
    })),
    dms: dmRows
      .map((c) => {
        const p = partnerMap.get(c.id);
        const last = lastMap.get(c.id);
        return {
          id: c.id,
          partner: p
            ? {
                id: p.id,
                username: p.username,
                displayName: p.displayName,
                nameColor: p.nameColor,
                status: p.status,
                title: p.title,
                level: levelFromXp(p.xp),
                online: p.lastSeen.getTime() > onlineThreshold,
              }
            : null,
          lastMessage: last ? (last.deletedAt ? "[удалено]" : last.content.slice(0, 60)) : "",
          lastAt: last?.createdAt.toISOString() ?? c.createdAt.toISOString(),
          unread: unreadMap.get(c.id) ?? 0,
        };
      })
      .sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1)),
  });
}

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return unauthorized();
  await ensureSeed();
  let body: { name?: string; description?: string; icon?: string; isPrivate?: boolean; password?: string } = {};
  try {
    body = await req.json();
  } catch {
    return badRequest("Некорректный запрос");
  }
  const name = (body.name ?? "").trim().slice(0, 48);
  if (name.length < 2) return badRequest("Название зала — минимум 2 символа");
  const isPrivate = !!body.isPrivate;
  const password = (body.password ?? "").trim();
  if (isPrivate && password.length < 3) return badRequest("Для закрытого зала нужен пароль (3+ символа)");

  const baseSlug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9а-яё]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32) || "room";
  const slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;

  const [ch] = await db
    .insert(channels)
    .values({
      type: "room",
      slug,
      name,
      description: (body.description ?? "").trim().slice(0, 200),
      icon: (body.icon ?? "🥃").slice(0, 4) || "🥃",
      isPrivate,
      passwordHash: isPrivate ? hashPassword(password) : null,
      createdBy: me.id,
    })
    .returning();

  await ensureMember(ch.id, me.id);
  await postSystemMessage(ch.id, `🏗️ ${me.displayName} открывает зал «${name}». ${isPrivate ? "Вход по паролю." : "Заходите, не стесняйтесь."}`, "bot");
  await addXp(me.id, XP_REWARDS.createRoom);
  const unlocked = await evaluateAchievements(me.id, { createdRoom: true });

  return Response.json({ channel: { id: ch.id, slug: ch.slug, name: ch.name, icon: ch.icon, isPrivate: ch.isPrivate }, unlocked });
}
