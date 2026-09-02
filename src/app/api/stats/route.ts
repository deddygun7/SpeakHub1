import { getPublicStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await getPublicStats());
}
