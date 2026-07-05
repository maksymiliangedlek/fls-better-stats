import { NextRequest } from "next/server";
import { buildMetaEnvelope, getPlayer } from "@/lib/cache/read";
import { buildPlayerStats } from "@/lib/stats/form";
import { notFound, ok, serverError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const [profile, meta] = await Promise.all([getPlayer(slug), buildMetaEnvelope()]);
    if (!profile) return notFound(`Player '${slug}' not found in cache. Run a sync first.`);

    const stats = buildPlayerStats(profile);
    return ok({ profile, stats }, meta);
  } catch (err) {
    return serverError((err as Error).message);
  }
}
