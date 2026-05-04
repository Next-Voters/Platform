import { NextRequest } from "next/server";
import { marked } from "marked";

const allowedFileTypes = ["html", "md"];
const ALLOWED_BUCKETS = new Set(["next-voters-summaries", "reports"]);

export async function GET(req: NextRequest) {
  const filePath = req.nextUrl.searchParams.get("path");
  if (!filePath) {
    return new Response("Missing ?path=", { status: 400 });
  }

  // Reject anything that could escape the bucket prefix via path traversal.
  if (
    filePath.includes("..") ||
    filePath.startsWith("/") ||
    filePath.includes("\\")
  ) {
    return new Response("Invalid path", { status: 400 });
  }

  const fileExtension = filePath.split(".").pop();
  if (!fileExtension || !allowedFileTypes.includes(fileExtension)) {
    return new Response("File type not allowed", { status: 403 });
  }

  const bucket = req.nextUrl.searchParams.get("bucket") ?? "next-voters-summaries";
  if (!ALLOWED_BUCKETS.has(bucket)) {
    return new Response("Bucket not allowed", { status: 403 });
  }

  const allowedHost = "ihzytkomakaqhkqdrval.supabase.co";
  let url: URL;

  try {
    url = new URL(`https://${allowedHost}/storage/v1/object/public/${bucket}/${filePath}`);
    if (url.host !== allowedHost) {
      return new Response("Host not allowed", { status: 403 });
    }
  } catch {
    return new Response("Bad url", { status: 400 });
  }

  const upstream = await fetch(url.toString(), {
    cache: "no-store",
  });

  if (!upstream.ok) {
    const errorText = await upstream.text().catch(() => "");
    return new Response(
      `Upstream error: ${upstream.status}\nURL: ${url.toString()}\n\n${errorText.slice(0, 1000)}`,
      { status: 502 }
    );
  }

  const raw = await upstream.text();
  const sanitized = raw
    .replace(/\{\{TOPIC_SECTIONS\}\}/g, '<p style="color:#888;text-align:center;padding:2rem;">Report content is being generated — check back shortly.</p>')
    .replace(/\{\{UNSUBSCRIBE_URL\}\}/g, "#");
  let html = fileExtension === "md" ? await marked(sanitized) : sanitized;

  if (fileExtension === "md") {
    const ctaHtml = `
<div style="margin-bottom: 3rem; padding: 2rem; border-bottom: 1px solid #e5e7eb; display: flex; flex-direction: column; align-items: center; gap: 1rem; font-family: sans-serif;">
  <p style="margin: 0; color: #4b5563; font-size: 1.1rem;">Ready to discuss these results?</p>
  <a href="/chat" style="background-color: #2563eb; color: white; padding: 0.75rem 2rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    Go to Chat
  </a>
</div>
    `;
    html = ctaHtml + html;
  }

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  });
}

