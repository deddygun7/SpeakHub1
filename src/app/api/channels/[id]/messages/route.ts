import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { channelMembers, channels, cheers, messages, users } from "@/db/schema";
import { badRequest, getCurrentUser, unauthorized } from "@/lib/auth";
import {
  addXp,
  canAccess,
  clearTyping,
  ensureMember,
  evaluateAchievements,
  fetchMessagesBefore,
  getBot,
  hydrateMessages,
  isMember,
  messageSelect,
  type Unlock,
} from "@/lib/server";
import { processCommand } from "@/lib/bartender";
import { XP_REWARDS, isNightOwl } from "@/lib/game";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const me = await getCurrentUser();
  if (!me) return unauthorized();
  const id = Number((await ctx.params).id);
  const ch = await canAccess(id, me.id);
  if (!ch) return badRequest("Нет доступа", 403);
  const url = new URL(req.url);
  const before = url.searchParams.get("before");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);
  // Visiting a public room makes you a guest of it (enables unread tracking & "explorer")
  let unlocked: Unlock[] = [];
  if (ch.type === "room" && !ch.isPrivate && !before && !(await isMember(id, me.id))) {
    await ensureMember(id, me.id);
    unlocked = await evaluateAchievements(me.id);
  }
  const list = await fetchMessagesBefore(id, before ? Number(before) : null, limit, me.id);
  // mark read
  if (list.length && !before) {
    const maxId = list[list.length - 1].id;
    await db
      .update(channelMembers)
      .set({ lastReadId: sql`greatest(${channelMembers.lastReadId}, ${maxId})` })
      .where(and(eq(channelMembers.channelId, id), eq(channelMembers.userId, me.id)));
  }
  return Response.json({ messages: list, hasMore: list.length === limit, unlocked });
}

async function loadOne(id: number, viewerId: number) {
  const rows = await db.select(messageSelect).from(messages).leftJoin(users, eq(messages.userId, users.id)).where(eq(messages.id, id)).limit(1);
  return (await hydrateMessages(rows, viewerId))[0];
}

export async function POST(req: Request, ctx: Ctx) {
  const me = await getCurrentUser();
  if (!me) return unauthorized();
  const id = Number((await ctx.params).id);
  const ch = await canAccess(id, me.id);
  if (!ch) return badRequest("Нет доступа", 403);

  let body: { content?: string; replyToId?: number | null } = {};
  try {
    body = await req.json();
  } catch {
    return badRequest("Некорректный запрос");
  }
  const raw = (body.content ?? "").trim();
  if (!raw) return badRequest("Пустое сообщение");
  if (raw.length > 2000) return badRequest("Слишком длинно — максимум 2000 символов");

  if (ch.type === "room") await ensureMember(id, me.id);
  clearTyping(id, me.id);

  const created: number[] = [];
  let unlocked: Unlock[] = [];
  let xpGain = 0;
  let info: string | null = null;

  const cmd = processCommand(raw, me.displayName);
  if (cmd) {
    if (cmd.error) return badRequest(cmd.error);
    xpGain += XP_REWARDS.command;
    if (cmd.userMessage) {
      const [m] = await db
        .insert(messages)
        .values({ channelId: id, userId: me.id, content: cmd.userMessage.content, kind: cmd.userMessage.kind })
        .returning({ id: messages.id });
      created.push(m.id);
    }
    if (cmd.action?.type === "topic") {
      await db.update(channels).set({ topic: cmd.action.topic }).where(eq(channels.id, id));
      const bot = await getBot();
      const [m] = await db
        .insert(messages)
        .values({ channelId: id, userId: bot.id, content: `📝 ${me.displayName} меняет тему зала: «${cmd.action.topic}»`, kind: "system" })
        .returning({ id: messages.id });
      created.push(m.id);
    }
    if (cmd.action?.type === "cheers") {
      const target = cmd.action.target.toLowerCase();
      const [t] = await db.select().from(users).where(eq(users.username, target)).limit(1);
      if (!t) return badRequest(`Не вижу @${target} в баре`);
      if (t.id === me.id) return badRequest("Самого себя угощать — это просто пить.");
      const since = new Date(Date.now() - 24 * 3600 * 1000);
      const recent = await db
        .select({ id: cheers.id })
        .from(cheers)
        .where(and(eq(cheers.fromUserId, me.id), eq(cheers.toUserId, t.id), gt(cheers.createdAt, since)))
        .limit(1);
      if (recent.length) return badRequest(`Ты уже угощал @${target} сегодня. Дай печени отдохнуть.`);
      await db.insert(cheers).values({ fromUserId: me.id, toUserId: t.id });
      await db.update(users).set({ cheersGiven: sql`${users.cheersGiven} + 1` }).where(eq(users.id, me.id));
      await db
        .update(users)
        .set({ cheersReceived: sql`${users.cheersReceived} + 1`, xp: sql`${users.xp} + ${XP_REWARDS.cheersReceived}`, coins: sql`${users.coins} + 3` })
        .where(eq(users.id, t.id));
      const bot = await getBot();
      const [m] = await db
        .insert(messages)
        .values({
          channelId: id,
          userId: bot.id,
          content: `🍻 ${me.displayName} угощает **${t.displayName}**! +${XP_REWARDS.cheersReceived} XP и 3 дрэма на счёт ${t.displayName}.`,
          kind: "bot",
        })
        .returning({ id: messages.id });
      created.push(m.id);
      await evaluateAchievements(t.id);
    }
    if (cmd.botMessage) {
      const bot = await getBot();
      const [m] = await db.insert(messages).values({ channelId: id, userId: bot.id, content: cmd.botMessage, kind: "bot" }).returning({ id: messages.id });
      created.push(m.id);
    }
    if (cmd.action?.type === "hack") {
      unlocked = await evaluateAchievements(me.id, { hack: true });
    } else {
      unlocked = await evaluateAchievements(me.id);
    }
    if (cmd.action?.type === "cheers") info = "Угощение доставлено";
  } else {
    const replyToId = body.replyToId ? Number(body.replyToId) : null;
    const [m] = await db
      .insert(messages)
      .values({ channelId: id, userId: me.id, content: raw, kind: "text", replyToId })
      .returning({ id: messages.id });
    created.push(m.id);
    xpGain += XP_REWARDS.message;
    await db
      .update(users)
      .set({ messagesCount: sql`${users.messagesCount} + 1`, coins: sql`${users.coins} + (case when ${users.messagesCount} % 10 = 9 then 1 else 0 end)` })
      .where(eq(users.id, me.id));
    // Bartender reacts to mentions
    if (/бармен|bartender|@bartender/i.test(raw)) {
      const bot = await getBot();
      const replies = [
        "Слушаю. Налить или поговорить?",
        "Я здесь. Всегда здесь.",
        "Ещё один? Записываю на твой счёт.",
        "Скажи /help — и я расскажу, что умею.",
        "Тише. Лёд тает от громких слов.",
      ];
      const [bm] = await db
        .insert(messages)
        .values({ channelId: id, userId: bot.id, content: `🥃 ${replies[Math.floor(Math.random() * replies.length)]}`, kind: "bot" })
        .returning({ id: messages.id });
      created.push(bm.id);
    }
    unlocked = await evaluateAchievements(me.id, { nightOwl: isNightOwl(), dm: ch.type === "dm" });
  }

  if (xpGain > 0) await addXp(me.id, xpGain);

  // mark read up to latest created
  const maxId = Math.max(...created);
  await db
    .update(channelMembers)
    .set({ lastReadId: sql`greatest(${channelMembers.lastReadId}, ${maxId})` })
    .where(and(eq(channelMembers.channelId, id), eq(channelMembers.userId, me.id)));

  const list = [];
  for (const mid of created) {
    const m = await loadOne(mid, me.id);
    if (m) list.push(m);
  }
  return Response.json({ messages: list, unlocked, xpGain, info });
}
