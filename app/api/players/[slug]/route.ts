import { NextRequest } from "next/server";
import { getPlayerDetail } from "@/lib/data/queries";
import { notFound, ok, serverError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const result = await getPlayerDetail(slug);
    if (!result) return notFound(`Player '${slug}' not found in cache. Run a sync first.`);
    return ok(result.data, result.meta);
  } catch (err) {
    return serverError((err as Error).message);
  }
}
