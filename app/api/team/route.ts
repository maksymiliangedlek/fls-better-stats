import { getTeamOverview } from "@/lib/data/queries";
import { ok, serverError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, meta } = await getTeamOverview();
    return ok(data, meta);
  } catch (err) {
    return serverError((err as Error).message);
  }
}
