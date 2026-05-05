"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { citySlug } from "@/lib/report-paths";

export type DateCard = {
  date: string;
  renderUrl: string;
};

export type GetSubscriberReportsInput = {
  cursor?: string | null;
  pageSize?: number;
};

export type GetSubscriberReportsResult = {
  cards: DateCard[];
  nextCursor: string | null;
};

const REPORT_FILE_RE = /^(\d{4}-\d{2}-\d{2})\.html$/;
const DEFAULT_PAGE_SIZE = 10;

export async function getSubscriberReports(
  input?: GetSubscriberReportsInput,
): Promise<GetSubscriberReportsResult> {
  const pageSize = Math.max(1, input?.pageSize ?? DEFAULT_PAGE_SIZE);
  const offset = input?.cursor ? parseInt(input.cursor, 10) : 0;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { cards: [], nextCursor: null };

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("city")
    .eq("contact", user.email)
    .maybeSingle();
  if (!sub?.city) return { cards: [], nextCursor: null };

  const cSlug = citySlug(sub.city);

  // Admin client required — cookie-based client has no SELECT RLS on storage.objects.
  const storage = createSupabaseAdminClient();
  const { data, error } = await storage.storage
    .from("reports")
    .list(cSlug, {
      limit: pageSize,
      offset,
      sortBy: { column: "name", order: "desc" },
    });

  if (error || !data) return { cards: [], nextCursor: null };

  const cards: DateCard[] = data
    .map((row) => {
      const m = row.name.match(REPORT_FILE_RE);
      if (!m) return null;
      const date = m[1];
      return {
        date,
        renderUrl: `/api/render?path=${encodeURIComponent(`${cSlug}/${date}.html`)}`,
      };
    })
    .filter((x): x is DateCard => x !== null);

  const nextCursor = data.length === pageSize ? String(offset + data.length) : null;
  return { cards, nextCursor };
}
