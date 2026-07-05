import { NextRequest, NextResponse } from "next/server";
import { runFullSync } from "@/lib/cache/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Manual full sync. Protected by SYNC_SECRET when set:
 *   POST /api/sync   with header  Authorization: Bearer <SYNC_SECRET>
 * If SYNC_SECRET is unset (e.g. local dev), the endpoint is open.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.SYNC_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const { buildId, discovery } = await runFullSync();
    return NextResponse.json({ ok: true, buildId, discovery });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
