import { NextRequest, NextResponse } from "next/server";
import { runCronSync } from "@/lib/cache/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Daily cron sync (Hobby: once per day). Vercel Cron sends
 * `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await runCronSync();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
