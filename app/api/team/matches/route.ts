import { buildMetaEnvelope, getTeamData } from "@/lib/cache/read";
import { ok, serverError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [team, meta] = await Promise.all([getTeamData(), buildMetaEnvelope()]);
    return ok({ matches: team?.matches ?? [] }, meta);
  } catch (err) {
    return serverError((err as Error).message);
  }
}
