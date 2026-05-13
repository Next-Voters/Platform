"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ReportItem = {
  header: string;
  description: string;
};

export type ReportCard = {
  report_id: number;
  report_date: string;
  topic_name: string;
  items: ReportItem[];
  sources: string[];
};

export type GetSubscriberReportsInput = {
  cursor?: string | null;
  pageSize?: number;
};

export type GetSubscriberReportsResult = {
  cards: ReportCard[];
  nextCursor: string | null;
};

const DEFAULT_PAGE_SIZE = 10;

type ReportRow = {
  report_id: number;
  report_date: string;
  items: ReportItem[];
  sources: string[];
  supported_topics: { topic_name: string } | null;
};

type TopicRow = {
  topic_id: number;
};

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
    .select("region")
    .eq("contact", user.email)
    .maybeSingle();
  if (!sub?.region) return { cards: [], nextCursor: null };

  const { data: topicRows } = await supabase
    .from("subscription_topics")
    .select("topic_id")
    .eq("subscription_id", user.email);

  const topicIds = ((topicRows ?? []) as TopicRow[]).map((r) => r.topic_id);

  let query = supabase
    .from("reports")
    .select("report_id, report_date, items, sources, supported_topics(topic_name)")
    .eq("region", sub.region)
    .order("report_date", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (topicIds.length > 0) {
    query = query.in("topic_id", topicIds);
  }

  const { data, error } = await query;
  if (error || !data) return { cards: [], nextCursor: null };

  const cards: ReportCard[] = (data as unknown as ReportRow[]).map((row) => ({
    report_id: row.report_id,
    report_date: row.report_date,
    topic_name: row.supported_topics?.topic_name ?? "Unknown",
    items: (row.items as ReportItem[]) ?? [],
    sources: (row.sources as string[]) ?? [],
  }));

  const nextCursor = data.length === pageSize ? String(offset + data.length) : null;
  return { cards, nextCursor };
}
