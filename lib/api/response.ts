import { NextResponse } from "next/server";
import type { Meta } from "../cache/read";

export interface ApiEnvelope<T> {
  data: T;
  meta: Meta;
}

export function ok<T>(data: T, meta: Meta): NextResponse<ApiEnvelope<T>> {
  return NextResponse.json(
    { data, meta },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}

export function notFound(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function serverError(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 500 });
}
