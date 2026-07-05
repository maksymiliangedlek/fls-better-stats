import { NextRequest } from "next/server";
import { getCompare } from "@/lib/data/queries";
import { badRequest, notFound, ok, serverError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const a = params.get("a") ?? "";
    const b = params.get("b") ?? "";

    const result = await getCompare(a, b);
    if (!result.ok) {
      const msg = result.error;
      return msg.includes("not found") ? notFound(msg) : badRequest(msg);
    }
    return ok(result.data, result.meta);
  } catch (err) {
    return serverError((err as Error).message);
  }
}
