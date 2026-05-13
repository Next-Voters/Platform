// Client-side cookie that carries onboarding state across the Google OAuth
// round-trip without embedding it in the OAuth redirect URL. Embedding state
// in `redirectTo` runs into Supabase's redirect-URL whitelist matching: an
// encoded query-string-inside-a-query-string can fail strict-matching and
// Supabase falls back to the project's Site URL, stranding the user at home.
//
// A cookie with SameSite=Lax survives top-level cross-site GET redirects,
// so it's preserved through the Google → Supabase → /auth/callback → /local
// redirect chain. Cleared on success or explicit failure. Stale cookies
// older than MAX_AGE_SECONDS are ignored on read even if the browser hasn't
// evicted them yet.

export type PendingAction =
  | {
      type: "subscribe";
      plan: "free" | "pro";
      region: string;
      topics: string[];
      regionRequest: { region: string } | null;
      referralCode: string | null;
    }
  | {
      type: "request";
      region: string;
      referralCode: string | null;
    };

interface StoredPendingAction {
  ts: number;
  action: PendingAction;
}

// Bumped from `nv_pending_action` to `_v2` for a clean cutover after the
// post-OAuth flow rewrite (PRs #98 / #101 / #102). Anyone with a stale
// legacy cookie set by the older code is intentionally ignored — they
// fall back to a fresh wizard run, which is the desired behavior.
const COOKIE_NAME = "nv_pending_action_v2";
const LEGACY_COOKIE_NAME = "nv_pending_action";
const MAX_AGE_SECONDS = 15 * 60;
const MAX_AGE_MS = MAX_AGE_SECONDS * 1000;

function encodeUtf8ToBase64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decodeBase64ToUtf8(input: string): string {
  const binary = atob(input);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

function isRegionRequest(value: unknown): value is { region: string } | null {
  if (value === null) return true;
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.region === "string";
}

function isPendingAction(value: unknown): value is PendingAction {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (v.type === "subscribe") {
    return (
      (v.plan === "free" || v.plan === "pro") &&
      typeof v.region === "string" &&
      isStringArray(v.topics) &&
      isRegionRequest(v.regionRequest) &&
      (v.referralCode === null || typeof v.referralCode === "string")
    );
  }
  if (v.type === "request") {
    return (
      typeof v.region === "string" &&
      (v.referralCode === null || typeof v.referralCode === "string")
    );
  }
  return false;
}

export function writePendingAction(action: PendingAction): void {
  if (typeof document === "undefined") return;
  const stored: StoredPendingAction = { ts: Date.now(), action };
  const encoded = encodeUtf8ToBase64(JSON.stringify(stored));
  const secure =
    typeof location !== "undefined" && location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${COOKIE_NAME}=${encoded}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

export function readPendingAction(): PendingAction | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`),
  );
  if (!match) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(decodeBase64ToUtf8(match[1]));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const stored = parsed as Partial<StoredPendingAction>;
  if (typeof stored.ts !== "number") return null;
  if (Date.now() - stored.ts > MAX_AGE_MS) return null;
  if (!isPendingAction(stored.action)) return null;
  return stored.action;
}

export function clearPendingAction(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
  // Defensive: also wipe any legacy cookie still sitting in the browser
  // from a session that started before the rename. The new code never
  // reads it, but actively clearing keeps the cookie jar clean.
  document.cookie = `${LEGACY_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}
