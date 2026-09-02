import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { channelMembers, channels, messages, reactions, userAchievements, users, type User } from "@/db/schema";
import { ACHIEVEMENT_MAP, levelFromXp, type Achievement } from "@/lib/game";
import { hashPassword } from "@/lib/auth";

// ---------- Seed ----------

export const BOT_USERNAME = "bartender";

const DEFAULT_ROOMS = [
  { slug: "lobby", name: "Главный зал", icon: "🥃", description: "Стойка, неон и все, кто зашёл. Начни здесь.", topic: "Добро пожаловать. Первый дрэм — за счёт заведения." },
  { slug: "peat-smoke", name: "Торф и дым", icon: "🔥", description: "Айла, Талискер и всё, что пахнет костром.", topic: "Lagavulin или Ardbeg? Спорим до утра." },
  { slug: "netrunners", name: "Нетраннеры", icon: "👾", description: "Код, железо, нейросети и киберпанк-гики.", topic: "Кто-нибудь уже прошивал тостер?" },
  { slug: "jazz-basement", name: "Джаз-подвал", icon: "🎷", description: "Музыка, кино, книги. Тихий разговор под сакс.", topic: "Что играет у тебя в наушниках прямо сейчас?" },
  { slug: "night-shift", name: "Ночная смена", icon: "🌙", description: "Для тех, кто не спит. Совы, фрилансеры, романтики.", topic: "03:00 — лучшее время для честных разговоров." },
  { slug: "vip-lounge", name: "VIP-лаунж", icon: "🔐", description: "Закрытая комната. Пароль: neon", topic: "Здесь только свои.", isPrivate: true, password: "neon" },
];

let seeded = false;

export async function ensureSeed(): Promise<void> {
  if (seeded) return;
  const existing = await db.select({ id: channels.id }).from(channels).where(eq(channels.slug, "lobby")).limit(1);
  if (existing.length === 0) {
    let bot = (await db.select().from(users).where(eq(users.username, BOT_USERNAME)).limit(1))[0];
    if (!bot) {
      bot = (
        await db
          .insert(users)
          .values({
            username: BOT_USERNAME,
            displayName: "Бармен",
            passwordHash: hashPassword(Math.random().toString(36)),
            bio: "Наливаю, слушаю, помню всё. Напиши /help.",
            status: "протирает стакан",
            title: "Хозяин стойки",
            nameColor: "ice",
            isBot: true,
            xp: 99999,
          })
          .returning()
      )[0];
    }
    for (const r of DEFAULT_ROOMS) {
      const [ch] = await db
        .insert(channels)
        .values({
          type: "room",
          slug: r.slug,
          name: r.name,
          icon: r.icon,
          description: r.description,
          topic: r.topic,
          isPrivate: !!r.isPrivate,
          passwordHash: r.password ? hashPassword(r.password) : null,
          createdBy: bot.id,
        })
        .onConflictDoNothing()
        .returning();
      if (ch) {
        await db.insert(messages).values({
          channelId: ch.id,
          userId: bot.id,
          kind: "bot",
          content:
            r.slug === "lobby"
              ? "🥃 Добро пожаловать в NEON DRAM. Я — бармен. Напиши /help, чтобы узнать, что я умею. Первый дрэм — за счёт заведения: нажми «Ежедневный дрэм» в меню."
              : `🥃 Зал «${r.name}» открыт. ${r.description}`,
        });
      }
    }
  }
  seeded = true;
}

export async function getBot(): Promise<User> {
  await ensureSeed();
  const [bot] = await db.select().from(users).where(eq(users.username, BOT_USERNAME)).limit(1);
  return bot;
}

// ---------- Typing registry (in-memory, per server process) ----------

type TypingMap = Map<number, Map<number, number>>; // channelId -> userId -> expiresAt
const g = globalThis as typeof globalThis & { __typing?: TypingMap };
const typing: TypingMap = g.__typing ?? new Map();
g.__typing = typing;

export function setTyping(channelId: number, userId: number): void {
  let m = typing.get(channelId);
  if (!m) {
    m = new Map();
    typing.set(channelId, m);
  }
  m.set(userId, Date.now() + 4000);
}

export function clearTyping(channelId: number, userId: number): void {
  typing.get(channelId)?.delete(userId);
}

export function getTyping(channelId: number, exceptUserId: number): number[] {
  const m = typing.get(channelId);
  if (!m) return [];
  const now = Date.now();
  const ids: number[] = [];
  for (const [uid, exp] of m) {
    if (exp < now) m.delete(uid);
    else if (uid !== exceptUserId) ids.push(uid);
  }
  return ids;
}

// ---------- XP & achievements ----------

export type Unlock = Achievement;

export async function grantAchievements(userId: number, codes: string[]): Promise<Unlock[]> {
  if (codes.length === 0) return [];
  const inserted = await db
    .insert(userAchievements)
    .values(codes.map((code) => ({ userId, code })))
    .onConflictDoNothing()
    .returning({ code: userAchievements.code });
  const unlocked = inserted.map((r) => ACHIEVEMENT_MAP[r.code]).filter(Boolean);
  const bonus = unlocked.reduce((s, a) => s + a.xp, 0);
  if (bonus > 0) {
    await db.update(users).set({ xp: sql`${users.xp} + ${bonus}` }).where(eq(users.id, userId));
  }
  return unlocked;
}

export type AchievementContext = {
  nightOwl?: boolean;
  dm?: boolean;
  hack?: boolean;
  createdRoom?: boolean;
  pinned?: boolean;
  shop?: boolean;
};

/** Evaluate all counter-based achievements for a user and grant the new ones. */
export async function evaluateAchievements(userId: number, ctx: AchievementContext = {}): Promise<Unlock[]> {
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!u) return [];
  const have = new Set(
    (await db.select({ code: userAchievements.code }).from(userAchievements).where(eq(userAchievements.userId, userId))).map((r) => r.code),
  );
  const want: string[] = [];
  const consider = (code: string, cond: boolean) => {
    if (cond && !have.has(code)) want.push(code);
  };
  consider("first_sip", u.messagesCount >= 1);
  consider("chatterbox", u.messagesCount >= 50);
  consider("regular", u.messagesCount >= 250);
  consider("reactor", u.reactionsCount >= 25);
  consider("generous", u.cheersGiven >= 10);
  consider("popular", u.cheersReceived >= 10);
  consider("loyal", u.dailyClaims >= 3);
  const level = levelFromXp(u.xp);
  consider("level_5", level >= 5);
  consider("level_10", level >= 10);
  consider("night_owl", !!ctx.nightOwl);
  consider("whisperer", !!ctx.dm);
  consider("hacker", !!ctx.hack);
  consider("barkeep", !!ctx.createdRoom);
  consider("pinned", !!ctx.pinned);
  consider("dresscode", !!ctx.shop);
  if (!have.has("explorer")) {
    const [{ n }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(channelMembers)
      .innerJoin(channels, eq(channelMembers.channelId, channels.id))
      .where(and(eq(channelMembers.userId, userId), eq(channels.type, "room")));
    consider("explorer", n >= 5);
  }
  const unlocked = await grantAchievements(userId, want);
  // Level achievements may become reachable after bonus xp
  if (unlocked.length > 0) {
    const [u2] = await db.select({ xp: users.xp }).from(users).where(eq(users.id, userId)).limit(1);
    const lvl2 = levelFromXp(u2.xp);
    const more: string[] = [];
    if (lvl2 >= 5 && !have.has("level_5") && !want.includes("level_5")) more.push("level_5");
    if (lvl2 >= 10 && !have.has("level_10") && !want.includes("level_10")) more.push("level_10");
    unlocked.push(...(await grantAchievements(userId, more)));
  }
  return unlocked;
}

export async function addXp(userId: number, amount: number): Promise<void> {
  await db.update(users).set({ xp: sql`${users.xp} + ${amount}` }).where(eq(users.id, userId));
}

// ---------- Membership ----------

export async function ensureMember(channelId: number, userId: number): Promise<void> {
  await db.insert(channelMembers).values({ channelId, userId }).onConflictDoNothing();
}

export async function isMember(channelId: number, userId: number): Promise<boolean> {
  const rows = await db
    .select({ id: channelMembers.id })
    .from(channelMembers)
    .where(and(eq(channelMembers.channelId, channelId), eq(channelMembers.userId, userId)))
    .limit(1);
  return rows.length > 0;
}

/** Returns channel if user may read it, otherwise null. */
export async function canAccess(channelId: number, userId: number) {
  const [ch] = await db.select().from(channels).where(eq(channels.id, channelId)).limit(1);
  if (!ch) return null;
  if (ch.type === "room" && !ch.isPrivate) return ch;
  return (await isMember(channelId, userId)) ? ch : null;
}

// ---------- Message serialization ----------

export type WireReaction = { emoji: string; count: number; mine: boolean };
export type WireMessage = {
  id: number;
  channelId: number;
  userId: number | null;
  username: string;
  displayName: string;
  nameColor: string;
  title: string;
  level: number;
  content: string;
  kind: string;
  replyTo: { id: number; username: string; content: string } | null;
  isPinned: boolean;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  reactions: WireReaction[];
};

type RawRow = {
  m: typeof messages.$inferSelect;
  username: string | null;
  displayName: string | null;
  nameColor: string | null;
  title: string | null;
  xp: number | null;
};

export async function hydrateMessages(rows: RawRow[], viewerId: number): Promise<WireMessage[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.m.id);
  const replyIds = Array.from(new Set(rows.map((r) => r.m.replyToId).filter((x): x is number => !!x)));

  const [reactRows, replyRows] = await Promise.all([
    db
      .select({ messageId: reactions.messageId, emoji: reactions.emoji, userId: reactions.userId })
      .from(reactions)
      .where(inArray(reactions.messageId, ids)),
    replyIds.length
      ? db
          .select({ id: messages.id, content: messages.content, deletedAt: messages.deletedAt, username: users.username })
          .from(messages)
          .leftJoin(users, eq(messages.userId, users.id))
          .where(inArray(messages.id, replyIds))
      : Promise.resolve([] as Array<{ id: number; content: string; deletedAt: Date | null; username: string | null }>),
  ]);

  const reactMap = new Map<number, Map<string, { count: number; mine: boolean }>>();
  for (const r of reactRows) {
    let m = reactMap.get(r.messageId);
    if (!m) {
      m = new Map();
      reactMap.set(r.messageId, m);
    }
    const e = m.get(r.emoji) ?? { count: 0, mine: false };
    e.count += 1;
    if (r.userId === viewerId) e.mine = true;
    m.set(r.emoji, e);
  }
  const replyMap = new Map(replyRows.map((r) => [r.id, r]));

  return rows.map(({ m, username, displayName, nameColor, title, xp }) => {
    const rep = m.replyToId ? replyMap.get(m.replyToId) : undefined;
    return {
      id: m.id,
      channelId: m.channelId,
      userId: m.userId,
      username: username ?? "ghost",
      displayName: displayName ?? "Призрак",
      nameColor: nameColor ?? "amber",
      title: title ?? "",
      level: levelFromXp(xp ?? 0),
      content: m.deletedAt ? "" : m.content,
      kind: m.kind,
      replyTo: rep
        ? { id: rep.id, username: rep.username ?? "ghost", content: rep.deletedAt ? "[удалено]" : rep.content.slice(0, 120) }
        : null,
      isPinned: m.isPinned,
      editedAt: m.editedAt?.toISOString() ?? null,
      deletedAt: m.deletedAt?.toISOString() ?? null,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
      reactions: Array.from(reactMap.get(m.id)?.entries() ?? []).map(([emoji, v]) => ({ emoji, ...v })),
    };
  });
}

export const messageSelect = {
  m: messages,
  username: users.username,
  displayName: users.displayName,
  nameColor: users.nameColor,
  title: users.title,
  xp: users.xp,
};

export async function fetchMessagesBefore(channelId: number, beforeId: number | null, limit: number, viewerId: number) {
  const rows = await db
    .select(messageSelect)
    .from(messages)
    .leftJoin(users, eq(messages.userId, users.id))
    .where(beforeId ? and(eq(messages.channelId, channelId), sql`${messages.id} < ${beforeId}`) : eq(messages.channelId, channelId))
    .orderBy(desc(messages.id))
    .limit(limit);
  rows.reverse();
  return hydrateMessages(rows, viewerId);
}

export async function fetchPinned(channelId: number, viewerId: number) {
  const rows = await db
    .select(messageSelect)
    .from(messages)
    .leftJoin(users, eq(messages.userId, users.id))
    .where(and(eq(messages.channelId, channelId), eq(messages.isPinned, true), isNull(messages.deletedAt)))
    .orderBy(desc(messages.id))
    .limit(20);
  return hydrateMessages(rows, viewerId);
}

export async function postSystemMessage(channelId: number, content: string, kind: "system" | "bot" = "system") {
  const bot = await getBot();
  const [row] = await db.insert(messages).values({ channelId, userId: bot.id, content, kind }).returning();
  return row;
}
