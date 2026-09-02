import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { channels } from "@/db/schema";
import { getCurrentUser, serializeMe } from "@/lib/auth";
import { ensureSeed } from "@/lib/server";
import BarApp from "@/components/bar/BarApp";

export const dynamic = "force-dynamic";

export default async function BarPage({ searchParams }: { searchParams: Promise<{ c?: string; r?: string }> }) {
  const me = await getCurrentUser();
  if (!me) redirect("/enter");
  await ensureSeed();
  const sp = await searchParams;
  let initialChannelId: number | null = sp.c ? Number(sp.c) : null;
  if (!initialChannelId) {
    const slug = sp.r ?? "lobby";
    const [ch] = await db.select({ id: channels.id }).from(channels).where(eq(channels.slug, slug)).limit(1);
    initialChannelId = ch?.id ?? null;
  }
  return <BarApp initialMe={serializeMe(me)} initialChannelId={initialChannelId} />;
}
