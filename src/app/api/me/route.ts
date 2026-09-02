import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { userAchievements, users } from "@/db/schema";
import { badRequest, getCurrentUser, serializeMe, unauthorized } from "@/lib/auth";
import { evaluateAchievements } from "@/lib/server";
import { ACHIEVEMENT_MAP, NAME_COLORS, SHOP_TITLES, THEMES, XP_REWARDS } from "@/lib/game";
import { whiskyOfTheDay } from "@/lib/bartender";

export const dynamic = "force-dynamic";

/** Full own profile incl. achievements */
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return unauthorized();
  const ach = await db
    .select({ code: userAchievements.code, unlockedAt: userAchievements.unlockedAt })
    .from(userAchievements)
    .where(eq(userAchievements.userId, me.id));
  return Response.json({
    user: serializeMe(me),
    achievements: ach.map((a) => ({ ...ACHIEVEMENT_MAP[a.code], unlockedAt: a.unlockedAt.toISOString() })).filter((a) => a.code),
    owned: ach.map((a) => a.code).filter((c) => c.includes(":")),
  });
}

/** Update profile fields */
export async function PATCH(req: Request) {
  const me = await getCurrentUser();
  if (!me) return unauthorized();
  let body: { displayName?: string; bio?: string; status?: string; favoriteWhisky?: string; theme?: string; title?: string; nameColor?: string } = {};
  try {
    body = await req.json();
  } catch {
    return badRequest("Некорректный запрос");
  }
  const patch: Partial<typeof users.$inferInsert> = {};
  if (typeof body.displayName === "string") {
    const dn = body.displayName.trim().slice(0, 48);
    if (dn.length < 2) return badRequest("Имя — минимум 2 символа");
    patch.displayName = dn;
  }
  if (typeof body.bio === "string") patch.bio = body.bio.trim().slice(0, 240);
  if (typeof body.status === "string") patch.status = body.status.trim().slice(0, 80);
  if (typeof body.favoriteWhisky === "string") patch.favoriteWhisky = body.favoriteWhisky.trim().slice(0, 80);
  if (typeof body.theme === "string" && THEMES.some((t) => t.id === body.theme)) patch.theme = body.theme;
  if (typeof body.title === "string") {
    // may only equip a title you own (empty = none). Ownership is tracked by achievements code "title:<id>"
    if (body.title === "") patch.title = "";
    else {
      const owned = await db
        .select({ code: userAchievements.code })
        .from(userAchievements)
        .where(sql`${userAchievements.userId} = ${me.id} and ${userAchievements.code} = ${"title:" + body.title}`)
        .limit(1);
      if (!owned.length && me.title !== body.title) return badRequest("Этот титул ещё не куплен");
      patch.title = body.title.slice(0, 40);
    }
  }
  if (typeof body.nameColor === "string" && NAME_COLORS[body.nameColor]) {
    if (NAME_COLORS[body.nameColor].price > 0) {
      const owned = await db
        .select({ code: userAchievements.code })
        .from(userAchievements)
        .where(sql`${userAchievements.userId} = ${me.id} and ${userAchievements.code} = ${"color:" + body.nameColor}`)
        .limit(1);
      if (!owned.length) return badRequest("Этот цвет ещё не куплен");
    }
    patch.nameColor = body.nameColor;
  }
  if (Object.keys(patch).length === 0) return badRequest("Нечего менять");
  const [u] = await db.update(users).set(patch).where(eq(users.id, me.id)).returning();
  return Response.json({ user: serializeMe(u) });
}

/** Actions: daily (claim dram), buy (shop) */
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return unauthorized();
  let body: { action?: string; item?: string } = {};
  try {
    body = await req.json();
  } catch {
    return badRequest("Некорректный запрос");
  }

  if (body.action === "daily") {
    const now = new Date();
    const last = me.lastDailyClaim;
    const dayKey = (d: Date) => Math.floor(d.getTime() / 86_400_000);
    if (last && dayKey(last) === dayKey(now)) {
      const next = new Date((dayKey(now) + 1) * 86_400_000);
      return badRequest(`Сегодняшний дрэм уже выпит. Следующий — через ${Math.max(1, Math.round((next.getTime() - now.getTime()) / 3_600_000))} ч.`);
    }
    const streak = last && dayKey(now) - dayKey(last) === 1 ? me.dailyStreak + 1 : 1;
    const xpGain = XP_REWARDS.dailyBase + XP_REWARDS.dailyStreakBonus * Math.min(streak, 7);
    const coinGain = 10 + Math.min(streak, 7) * 2;
    const [u] = await db
      .update(users)
      .set({
        xp: sql`${users.xp} + ${xpGain}`,
        coins: sql`${users.coins} + ${coinGain}`,
        dailyClaims: sql`${users.dailyClaims} + 1`,
        dailyStreak: streak,
        lastDailyClaim: now,
      })
      .where(eq(users.id, me.id))
      .returning();
    const unlocked = await evaluateAchievements(me.id);
    const w = whiskyOfTheDay(now);
    return Response.json({
      user: serializeMe(u),
      xpGain,
      coinGain,
      streak,
      whisky: w,
      unlocked,
      message: `🥃 Бармен наливает ${w.name}. +${xpGain} XP, +${coinGain} дрэмов. Серия: ${streak} дн.`,
    });
  }

  if (body.action === "buy") {
    const item = body.item ?? "";
    let price = 0;
    let code = "";
    let apply: Partial<typeof users.$inferInsert> = {};
    if (item.startsWith("color:")) {
      const key = item.slice(6);
      const c = NAME_COLORS[key];
      if (!c) return badRequest("Нет такого цвета");
      price = c.price;
      code = item;
      apply = { nameColor: key };
    } else if (item.startsWith("title:")) {
      const key = item.slice(6);
      const t = SHOP_TITLES.find((x) => x.id === key);
      if (!t) return badRequest("Нет такого титула");
      price = t.price;
      code = item;
      apply = { title: key };
    } else {
      return badRequest("Неизвестный товар");
    }
    const owned = await db
      .select({ code: userAchievements.code })
      .from(userAchievements)
      .where(sql`${userAchievements.userId} = ${me.id} and ${userAchievements.code} = ${code}`)
      .limit(1);
    if (owned.length) {
      const [u] = await db.update(users).set(apply).where(eq(users.id, me.id)).returning();
      return Response.json({ user: serializeMe(u), unlocked: [], message: "Уже куплено — надето." });
    }
    if (me.coins < price) return badRequest(`Не хватает дрэмов: нужно ${price}, у тебя ${me.coins}. Общайся, забирай ежедневный дрэм — накопишь.`);
    await db.insert(userAchievements).values({ userId: me.id, code }).onConflictDoNothing();
    const [u] = await db
      .update(users)
      .set({ ...apply, coins: sql`${users.coins} - ${price}` })
      .where(eq(users.id, me.id))
      .returning();
    const unlocked = await evaluateAchievements(me.id, { shop: true });
    return Response.json({ user: serializeMe(u), unlocked, message: `Куплено за ${price} дрэмов. Выглядишь дорого.` });
  }

  return badRequest("Неизвестное действие");
}
