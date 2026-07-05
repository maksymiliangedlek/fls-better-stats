import { NextRequest } from "next/server";
import { buildMetaEnvelope, getPlayer } from "@/lib/cache/read";
import { comparePlayers } from "@/lib/stats/compare";
import { badRequest, notFound, ok, serverError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const a = params.get("a");
    const b = params.get("b");
    if (!a || !b) return badRequest("Both 'a' and 'b' player slugs are required.");
    if (a === b) return badRequest("Choose two different players.");

    const [profileA, profileB, meta] = await Promise.all([
      getPlayer(a),
      getPlayer(b),
      buildMetaEnvelope(),
    ]);
    if (!profileA) return notFound(`Player '${a}' not found in cache.`);
    if (!profileB) return notFound(`Player '${b}' not found in cache.`);

    return ok(comparePlayers(profileA, profileB), meta);
  } catch (err) {
    return serverError((err as Error).message);
  }
}
