import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");
  if (!path) return new Response("Missing path", { status: 400 });

  const upstream = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/reports/${path}`,
    { cache: "no-store" },
  );

  if (!upstream.ok) {
    return new Response("Not found", { status: upstream.status });
  }

  const html = await upstream.text();
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
