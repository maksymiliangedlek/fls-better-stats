import { NextRequest } from "next/server";
import { getRosterBoard } from "@/lib/data/queries";
import { SORT_KEYS, type SortKey } from "@/lib/stats/leaderboards";
import { ok, serverError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const sortParam = params.get("sort") as SortKey | null;
    const sort: SortKey = sortParam && SORT_KEYS.includes(sortParam) ? sortParam : "goals";
    const scope = params.get("scope") === "current" ? "current" : "all";

    const { data, meta } = await getRosterBoard(scope, sort);
    return ok(data, meta);
  } catch (err) {
    return serverError((err as Error).message);
  }
}
