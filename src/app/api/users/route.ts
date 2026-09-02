import { sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import { levelFromXp } from "@/lib/game";

export const dynamic = "force-dynamic";

/** Search users for the command palette / new DM. */
export async function GET(req: Request) {
  const me = await getCurrentUser();
  if (!me) return unauthorized();
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().toLowerCase();
  const like = `%${q}%`;
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      nameColor: users.nameColor,
      title: users.title,
      status: users.status,
      xp: users.xp,
      lastSeen: users.lastSeen,
    })
    .from(users)
    .where(
      q
        ? sql`(lower(${users.username}) like ${like} or lower(${users.displayName}) like ${like}) and ${users.isBot} = false and ${users.id} <> ${me.id}`
        : sql`${users.isBot} = false and ${users.id} <> ${me.id}`,
    )
    .orderBy(sql`${users.lastSeen} desc`)
    .limit(25);
  const threshold = Date.now() - 45_000;
  return Response.json({
    users: rows.map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      nameColor: u.nameColor,
      title: u.title,
      status: u.status,
      level: levelFromXp(u.xp),
      online: u.lastSeen.getTime() > threshold,
    })),
  });
}
