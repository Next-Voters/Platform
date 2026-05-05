"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Mail, X } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  getSubscriberReports,
  type DateCard,
} from "@/server-actions/get-subscriber-reports";

const PAGE_SIZE = 10;

const formatDate = (yyyyMmDd: string): string => {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  if (!y || !m || !d) return yyyyMmDd;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
};

export function EmailHistory() {
  const scrollRootRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const inflightRef = useRef(false);
  const initialLoadedRef = useRef(false);
  // Drops setState from any in-flight request whose response arrives after the
  // component has unmounted (the parent remounts us via key={historyVersion}
  // when settings save, and a stale fetch could otherwise paint old data into
  // the about-to-unmount instance).
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const [cards, setCards] = useState<DateCard[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);

  const loadMore = useCallback(async () => {
    if (inflightRef.current || done) return;
    inflightRef.current = true;
    if (!initialLoadedRef.current) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await getSubscriberReports({ cursor, pageSize: PAGE_SIZE });
      if (!mountedRef.current) return;
      setCards((prev) => [...prev, ...res.cards]);
      setCursor(res.nextCursor);
      if (!res.nextCursor) setDone(true);
      initialLoadedRef.current = true;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
      inflightRef.current = false;
    }
  }, [cursor, done]);

  useEffect(() => {
    loadMore();
    // Initial load only — subsequent loads driven by the observer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = scrollRootRef.current;
    if (!sentinel || !root || done) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { root, rootMargin: "0px 0px 200px 0px", threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, done]);


  return (
    <div className="w-full">
      <DialogPrimitive.Root
        open={activeUrl !== null}
        onOpenChange={(open) => { if (!open) setActiveUrl(null); }}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />
          <DialogPrimitive.Content className="fixed inset-0 z-50 flex flex-col bg-white">
            <div className="flex items-center justify-end px-4 py-2 border-b border-gray-200 shrink-0">
              <DialogPrimitive.Close className="rounded p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                <X className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            </div>
            {activeUrl && (
              <iframe
                src={activeUrl}
                className="flex-1 w-full border-0"
                title="Report"
                sandbox="allow-same-origin allow-popups"
              />
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
        Past reports
      </p>
      <p className="text-[13px] text-gray-500 mb-4">
        Reports we&apos;ve sent for your city, topics, and language.
      </p>

      <div
        ref={scrollRootRef}
        className="max-h-[calc(100vh-220px)] overflow-y-auto pr-1 -mr-1"
      >
        {loading && cards.length === 0 ? (
          <p className="text-gray-400 text-[13px] py-4">Loading…</p>
        ) : (
          <div className="flex flex-col gap-3">
            {cards.map((card) => (
              <DateCardView key={card.date} card={card} onView={setActiveUrl} />
            ))}

            {!done && (
              <div
                ref={sentinelRef}
                className="py-4 text-center text-[12px] text-gray-400"
                aria-hidden="true"
              >
                {loadingMore ? "Loading more…" : " "}
              </div>
            )}

            {done && cards.length === 0 && (
              <div className="border border-dashed border-gray-200 rounded-xl px-4 py-8 text-center">
                <Mail className="h-5 w-5 text-gray-300 mx-auto mb-2" aria-hidden="true" />
                <p className="text-[13.5px] text-gray-500">
                  No reports yet. Your first one is on the way.
                </p>
              </div>
            )}

            {done && cards.length > 0 && (
              <p className="py-4 text-center text-[12px] text-gray-400">
                You&apos;re all caught up.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DateCardView({ card, onView }: { card: DateCard; onView: (url: string) => void }) {
  return (
    <div className="border border-gray-200 rounded-xl bg-white px-4 py-2.5 flex items-center justify-between gap-3">
      <p className="text-[13.5px] font-medium text-gray-900">{formatDate(card.date)}</p>
      <button
        onClick={() => onView(card.renderUrl)}
        className="inline-flex items-center gap-1 text-[12.5px] font-bold text-brand hover:text-brand-hover shrink-0"
      >
        View
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
