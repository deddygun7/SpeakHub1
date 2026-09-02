import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { messages, users } from "@/db/schema";
import { badRequest, getCurrentUser, unauthorized } from "@/lib/auth";
import { canAccess, hydrateMessages, messageSelect } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const me = await getCurrentUser();
  if (!me) return unauthorized();
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const channelId = Number(url.searchParams.get("channelId") ?? 0);
  if (q.length < 2) return badRequest("Минимум 2 символа");
  if (!channelId || !(await canAccess(channelId, me.id))) return badRequest("Нет доступа", 403);
  const rows = await db
    .select(messageSelect)
    .from(messages)
    .leftJoin(users, eq(messages.userId, users.id))
    .where(and(eq(messages.channelId, channelId), isNull(messages.deletedAt), sql`${messages.content} ilike ${"%" + q + "%"}`))
    .orderBy(desc(messages.id))
    .limit(30);
  return Response.json({ results: await hydrateMessages(rows, me.id) });
}
