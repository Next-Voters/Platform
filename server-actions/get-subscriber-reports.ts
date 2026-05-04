"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { citySlug, topicSlug, languageCode } from "@/lib/report-paths";
import { getUserTopics } from "@/server-actions/get-user-topics";

export type ReportLink = {
  topic: string;
  renderUrl: string;
};

export type DateCard = {
  date: string;
  reports: ReportLink[];
};

export type GetSubscriberReportsInput = {
  cursor?: string | null;
  pageSize?: number;
};

export type GetSubscriberReportsResult = {
  cards: DateCard[];
  nextCursor: string | null;
};

type CursorPayload = Record<string, number>;

const REPORT_FILE_RE = /^(\d{4}-\d{2}-\d{2})\.html$/;
const DEFAULT_PAGE_SIZE = 10;
const FETCH_MULTIPLIER = 3;

const decodeCursor = (cursor: string | null | undefined): CursorPayload => {
  if (!cursor) return {};
  try {
    const json = Buffer.from(cursor, "base64").toString("utf8");
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed === "object") {
      return parsed as CursorPayload;
    }
    return {};
  } catch {
    return {};
  }
};

const encodeCursor = (payload: CursorPayload): string =>
  Buffer.from(JSON.stringify(payload), "utf8").toString("base64");

export async function getSubscriberReports(
  input?: GetSubscriberReportsInput,
): Promise<GetSubscriberReportsResult> {
  const pageSize = Math.max(1, input?.pageSize ?? DEFAULT_PAGE_SIZE);
  const fetchPerTopic = pageSize * FETCH_MULTIPLIER;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { cards: [], nextCursor: null };

  // Match the rest of the codebase, which stores and queries `subscriptions.contact`
  // and `subscription_topics.subscription_id` using raw `user.email` (no
  // normalization). Lowercasing here would miss the row when the JWT email has
  // any uppercase characters.
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("city, preferred_language")
    .eq("contact", user.email)
    .maybeSingle();
  if (!sub?.city || !sub?.preferred_language) {
    return { cards: [], nextCursor: null };
  }

  const langCode = languageCode(sub.preferred_language);
  if (langCode === null) {
    // Unknown language → no storage path will resolve. Bail rather than
    // silently 404'ing every report URL with an `en/` fallback.
    return { cards: [], nextCursor: null };
  }

  const topics = await getUserTopics();
  if (topics.length === 0) return { cards: [], nextCursor: null };

  const offsets = decodeCursor(input?.cursor);
  const cSlug = citySlug(sub.city);

  // The cookie-based server client has no SELECT RLS on storage.objects, so
  // .list() would silently return []. Auth check above already validated the
  // user; switch to the admin client for the privileged listing only.
  const storage = createSupabaseAdminClient();

  type PerTopic = {
    topic: string;
    slug: string;
    files: { date: string; topic: string }[];
    exhausted: boolean;
  };

  const perTopic: PerTopic[] = await Promise.all(
    topics.map(async (topic): Promise<PerTopic> => {
      const slug = topicSlug(topic);
      const offset = offsets[slug] ?? 0;
      try {
        const { data, error } = await storage.storage
          .from("reports")
          .list(`${cSlug}/${slug}/${langCode}`, {
            limit: fetchPerTopic,
            offset,
            sortBy: { column: "name", order: "desc" },
          });
        if (error || !data) {
          return { topic, slug, files: [], exhausted: true };
        }
        const files = data
          .map((row) => {
            const m = row.name.match(REPORT_FILE_RE);
            return m ? { date: m[1], topic } : null;
          })
          .filter((x): x is { date: string; topic: string } => x !== null);
        return {
          topic,
          slug,
          files,
          exhausted: data.length < fetchPerTopic,
        };
      } catch {
        return { topic, slug, files: [], exhausted: true };
      }
    }),
  );

  // For each non-exhausted topic, its batch's last entry is the oldest date
  // we have visibility for in that topic — every report it has on that date
  // or newer is already in `files`. The cross-topic horizon is the MAX of
  // those last entries: at the max, every non-exhausted topic's batch still
  // covers that date (its own last entry is <= max), so we have full
  // cross-topic visibility for dates >= horizon. Below the horizon, the
  // topic that set the max may have unread reports waiting in its next page.
  const horizons = perTopic
    .filter((r) => !r.exhausted && r.files.length > 0)
    .map((r) => r.files[r.files.length - 1].date);
  const horizon =
    horizons.length === 0
      ? null
      : horizons.reduce((a, b) => (a > b ? a : b));

  // When horizon is null (all topics exhausted), include every fetched file.
  // Otherwise include dates >= horizon — those are the dates for which every
  // non-exhausted topic's batch already covers any report it might have.
  const byDate = new Map<string, Set<string>>();
  for (const r of perTopic) {
    for (const f of r.files) {
      if (horizon !== null && f.date < horizon) continue;
      let set = byDate.get(f.date);
      if (!set) {
        set = new Set<string>();
        byDate.set(f.date, set);
      }
      set.add(f.topic);
    }
  }

  const allDatesDesc = Array.from(byDate.keys()).sort((a, b) =>
    b.localeCompare(a),
  );
  const pageDates = allDatesDesc.slice(0, pageSize);
  const pageDateSet = new Set(pageDates);

  const cards: DateCard[] = pageDates.map((date) => {
    const topicSet = byDate.get(date) ?? new Set<string>();
    const sortedTopics = Array.from(topicSet).sort((a, b) => a.localeCompare(b));
    return {
      date,
      reports: sortedTopics.map((topic) => {
        const path = `${cSlug}/${topicSlug(topic)}/${langCode}/${date}.html`;
        return {
          topic,
          renderUrl: `/api/render?bucket=reports&path=${encodeURIComponent(path)}`,
        };
      }),
    };
  });

  // New offsets: old + count of files from each topic that landed in this page.
  const newOffsets: CursorPayload = { ...offsets };
  for (const r of perTopic) {
    const consumed = r.files.filter((f) => pageDateSet.has(f.date)).length;
    newOffsets[r.slug] = (offsets[r.slug] ?? 0) + consumed;
  }

  const allExhausted = perTopic.every((r) => r.exhausted);

  // Defensive: if no dates survived the horizon filter but topics aren't
  // exhausted, we'd return { cards: [], nextCursor: <unchanged offsets> } and
  // loop forever. This can happen with pathological data (multiple files
  // sharing the same date that exactly hits the horizon). Force forward
  // progress by advancing every non-exhausted topic past the current batch.
  if (cards.length === 0 && !allExhausted) {
    for (const r of perTopic) {
      if (!r.exhausted) {
        newOffsets[r.slug] = (offsets[r.slug] ?? 0) + r.files.length;
      }
    }
    return { cards: [], nextCursor: encodeCursor(newOffsets) };
  }

  const moreInBatch = allDatesDesc.length > pageDates.length;
  const hasMore = !allExhausted || moreInBatch;

  return {
    cards,
    nextCursor: hasMore ? encodeCursor(newOffsets) : null,
  };
}
