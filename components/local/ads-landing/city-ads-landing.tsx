"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  Clock,
  Flag
  Forward,
  Landmark,
  Loader2,
  Mail,
  MapPin,
  MoreVertical,
  Reply,
  Star,
  Trash2,
} from "lucide-react";
import { getSupportedRegions } from "@/server-actions/get-supported-cities";

export type CoverageTierKind = "city" | "state" | "country";

export interface CoverageTier {
  /** Tier display name shown in the hero "what's included" list. */
  label: string;
  /** Which icon + accent to use for the tier badge. */
  kind: CoverageTierKind;
  /** Bullet items shown under the tier — what gets covered each week. */
  items: string[];
}

export interface EmailStory {
  /** Scannable 3-7 word headline of the actual change. */
  headline: string;
  /** Jurisdiction + body that took the action, e.g. "San Francisco · Board of Supervisors". */
  source: string;
  /** ~2 sentence elaboration of what happened. */
  summary: string;
}

export interface EmailTopic {
  /** Topic label, e.g. "Economy & Housing". */
  label: string;
  /** Stories under this topic — at least one. */
  stories: EmailStory[];
}

export interface CityAdsLandingProps {
  /** Canonical region names from the regions table we'd accept as a match
   *  (case-insensitive). If none match, we fall back to the first entry as the
   *  `?city=` param, which lands the user in the waitlist/request flow. */
  cityAliases: string[];
  /** Display name for the hero copy (e.g. "New York City"). */
  cityDisplay: string;
  /** Short label used under the hero pill (e.g. "New Yorkers"). */
  audienceLabel: string;
  /** Attribution slug written into the `ref` field (e.g. "google-ads-nyc"). */
  refCode: string;
  /** Accent gradient for the hero background (tailwind classes). */
  heroAccent: string;
  /** One-line summary of the nested coverage shown under the hero. */
  coverageSummary: string;
  /** Three tiers (city → state → country) shown in the email-preview card. */
  coverageTiers: CoverageTier[];
  /** Topic-organized stories rendered inside the Gmail email-preview body.
   *  Long content is expected — the bottom of the body fades/blurs as a
   *  paywall-style teaser. */
  emailTopics?: EmailTopic[];
  /** Hero layout. "centered" (default) keeps the original stacked design.
   *  "split" puts left-aligned headline/description on the left and an email
   *  capture form on the right. */
  heroVariant?: "centered" | "split";
  /** When true, adds a continuous shine sweep to the primary CTA buttons.
   *  Used to draw the eye on paid-traffic landings. */
  ctaShine?: boolean;
  /** Faint background illustration rendered behind the split hero. Pass an
   *  inline SVG component (e.g. SFSkyline / NYCSkyline). */
  heroBackdrop?: ReactNode;
}

const TIER_BADGE: Record<CoverageTierKind, { wrap: string; icon: ReactNode }> = {
  city: {
    wrap: "bg-red-50 text-red-600",
    icon: <Building2 className="h-3.5 w-3.5" aria-hidden />,
  },
  state: {
    wrap: "bg-amber-50 text-amber-700",
    icon: <Landmark className="h-3.5 w-3.5" aria-hidden />,
  },
  country: {
    wrap: "bg-blue-50 text-blue-700",
    icon: <Flag className="h-3.5 w-3.5" aria-hidden />,
  },
};

export function CityAdsLanding({
  cityAliases,
  cityDisplay,
  audienceLabel,
  refCode,
  heroAccent,
  coverageSummary,
  coverageTiers,
  emailTopics,
  heroVariant = "centered",
  heroBackdrop,
  ctaShine = false,
}: CityAdsLandingProps) {
  const shineClass = ctaShine ? " btn-shine" : "";
  const router = useRouter();
  const [resolvedCity, setResolvedCity] = useState<string | null>(null);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  const aliasesLower = useMemo(
    () => cityAliases.map((a) => a.toLowerCase()),
    [cityAliases],
  );

  // Rotator for the split-variant headline — cycles through the three
  // jurisdictions the weekly email covers (city → state → country).
  const rotatingPlaces = useMemo(
    () => coverageTiers.map((t) => t.label),
    [coverageTiers],
  );
  const [placeIdx, setPlaceIdx] = useState(0);
  useEffect(() => {
    if (heroVariant !== "split" || rotatingPlaces.length <= 1) return;
    const id = setInterval(() => {
      setPlaceIdx((i) => (i + 1) % rotatingPlaces.length);
    }, 2400);
    return () => clearInterval(id);
  }, [heroVariant, rotatingPlaces.length]);

  // Resolve the canonical regions row matching any of our aliases so
  // the onboarding wizard lands on subscribe-step-2 instead of request mode.
  // If no match is found, we still let the user through with the first alias;
  // the wizard will put them in the waitlist flow gracefully.
  useEffect(() => {
    getSupportedRegions()
      .then((list) => {
        const match = list.find((c) => aliasesLower.includes(c.toLowerCase()));
        setResolvedCity(match ?? cityAliases[0] ?? cityDisplay);
      })
      .catch(() => setResolvedCity(cityAliases[0] ?? cityDisplay))
      .finally(() => setCitiesLoading(false));
  }, [aliasesLower, cityAliases, cityDisplay]);
    // Fire Google Ads "Interest" page-view conversion on mount.
    // This ensures the conversion registers even on SPA navigation to the ads landing page.
    // Queues via dataLayer so it fires once gtag.js loads (afterInteractive strategy).
    useEffect(() => {
          window.dataLayer = window.dataLayer || [];
          if (typeof window.gtag !== 'function') {
                  window.gtag = function (...args: unknown[]) {
                            (window.dataLayer as unknown[]).push(args);
                  };
          }
          window.gtag('config', 'AW-18024404483');
    }, []);

  const handleStart = () => {
    if (citiesLoading || redirecting) return;
    setRedirecting(true);
    const cityParam = resolvedCity ?? cityAliases[0] ?? cityDisplay;
    router.push(
      `/local/onboarding?city=${encodeURIComponent(cityParam)}&ref=${encodeURIComponent(refCode)}`,
    );
  };

  return (
    <div className="w-full min-h-[calc(100vh-56px)] bg-page">
      {/* Hero */}
      <section className={`relative overflow-hidden ${heroAccent}`}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(17,17,17,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(17,17,17,0.05) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse at center top, black 40%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center top, black 40%, transparent 80%)",
          }}
        />

        {heroBackdrop && heroVariant === "split" && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 text-gray-900 opacity-[0.07]"
          >
            <div className="w-full">{heroBackdrop}</div>
          </div>
        )}

        {/* Inline NV mark — replaces the global site header on ad landings
            so the hero gradient runs edge-to-edge with no seam. */}
        <a
          href="/"
          className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 text-[18px] sm:text-[20px] font-bold tracking-tight text-gray-900 font-plus-jakarta-sans leading-none"
          aria-label="Next Voters home"
        >
          NV
        </a>

        <div className="relative max-w-[1020px] mx-auto px-6 pt-16 pb-12 md:pt-24 md:pb-20">
          {heroVariant === "split" ? (
            <div className="grid md:grid-cols-2 gap-10 md:gap-12">
              {/* Left column — headline + description, left-aligned */}
              <div className="text-left">
                <div className="flex justify-start mb-6">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white ring-1 ring-gray-200 shadow-sm pl-2.5 pr-3.5 py-1.5 text-[12.5px] font-medium text-gray-700">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-50 text-red-600">
                      <MapPin className="h-3 w-3" aria-hidden />
                    </span>
                    For {audienceLabel}
                  </div>
                </div>

                <h1 className="text-left text-[38px] sm:text-[44px] md:text-[50px] font-bold tracking-tight text-gray-900 leading-[1.1]">
                  Catch up with the politics in{" "}
                  <span
                    className="relative inline-block overflow-hidden align-bottom"
                    style={{ height: "1.1em", verticalAlign: "bottom" }}
                  >
                    <span className="sr-only" aria-live="polite">
                      {rotatingPlaces[placeIdx]}
                    </span>
                    <span
                      aria-hidden
                      className="block transition-transform duration-500 ease-out"
                      style={{
                        transform: `translateY(calc(-1.1em * ${placeIdx}))`,
                      }}
                    >
                      {rotatingPlaces.map((p) => (
                        <span
                          key={p}
                          className="block whitespace-nowrap"
                          style={{ height: "1.1em", lineHeight: "1.1em" }}
                        >
                          <span className="relative inline-block">
                            <span className="relative z-10">{p}</span>
                            <span
                              aria-hidden
                              className="absolute inset-x-0 bottom-1 md:bottom-2 h-2 md:h-3 bg-red-200/70 -z-0 rounded"
                            />
                          </span>
                        </span>
                      ))}
                    </span>
                  </span>
                </h1>

                <p className="mt-5 text-left text-[16px] md:text-[18px] text-gray-600 leading-relaxed">
                  {coverageSummary}
                </p>
                <p className="mt-2 text-left text-[14px] text-gray-500">
                  Free. Nonpartisan. Unsubscribe any time.
                </p>
              </div>

              {/* Right column — what's included + email capture */}
              <div className="w-full flex flex-col">
                <div>
                  <p className="text-[14px] font-semibold text-gray-900 mb-3">
                    What&rsquo;s included:
                  </p>
                  <ul className="space-y-2.5">
                    {(() => {
                      const stateName =
                        coverageTiers.find((t) => t.kind === "state")?.label ??
                        "your state";
                      const items = [
                        `What your ${cityDisplay} officials voted on this week`,
                        `New ${stateName} laws and ballot measures`,
                        `Federal action that affects ${cityDisplay}`,
                        `Every claim links back to the source`,
                      ];
                      return items.map((text) => (
                        <li
                          key={text}
                          className="flex items-start gap-2.5 text-[14.5px] text-gray-800 leading-snug"
                        >
                          <span
                            aria-hidden
                            className="shrink-0 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-50 text-red-600 mt-0.5"
                          >
                            <Check className="h-3 w-3" />
                          </span>
                          <span>{text}</span>
                        </li>
                      ));
                    })()}
                  </ul>
                </div>

                <div className="w-full mt-auto pt-6">
                  <button
                    type="button"
                    onClick={handleStart}
                    disabled={citiesLoading || redirecting}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-[14.5px] font-extrabold uppercase tracking-[0.08em] h-14 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed${shineClass}`}
                  >
                    {redirecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                        Loading…
                      </>
                    ) : (
                      <>
                        Send me the {cityDisplay} briefing
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  <p className="mt-3 text-[12px] text-gray-500 text-center">
                    Sign up with Google &middot; takes 30 seconds
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-center mb-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-white ring-1 ring-gray-200 shadow-sm pl-2.5 pr-3.5 py-1.5 text-[12.5px] font-medium text-gray-700">
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-50 text-red-600">
                    <MapPin className="h-3 w-3" aria-hidden />
                  </span>
                  For {audienceLabel}
                </div>
              </div>

              <h1 className="text-center text-[38px] sm:text-[48px] md:text-[58px] font-bold tracking-tight text-gray-900 leading-[1.05] max-w-[880px] mx-auto">
                Know what your{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">city council</span>
                  <span
                    aria-hidden
                    className="absolute inset-x-0 bottom-1 md:bottom-2 h-2 md:h-3 bg-red-200/70 -z-0 rounded"
                  />
                </span>{" "}
                is voting on this week — in {cityDisplay}.
              </h1>

              <p className="mt-5 text-center text-[16px] md:text-[18px] text-gray-600 leading-relaxed max-w-2xl mx-auto">
                {coverageSummary}
              </p>
              <p className="mt-2 text-center text-[14px] text-gray-500 max-w-2xl mx-auto">
                Free. Nonpartisan. Unsubscribe any time.
              </p>

              {/* Coverage tier pills */}
              <div className="mt-7 flex flex-wrap justify-center items-center gap-2">
                {coverageTiers.map((tier) => {
                  const badge = TIER_BADGE[tier.kind];
                  return (
                    <span
                      key={tier.label}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white ring-1 ring-gray-200 shadow-sm pl-2 pr-3 py-1 text-[12.5px] font-medium text-gray-700"
                    >
                      <span
                        className={`inline-flex items-center justify-center h-5 w-5 rounded-full ${badge.wrap}`}
                      >
                        {badge.icon}
                      </span>
                      {tier.label}
                    </span>
                  );
                })}
              </div>

              <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center items-center">
                <button
                  type="button"
                  onClick={() => handleStart()}
                  disabled={citiesLoading || redirecting}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-[14.5px] font-extrabold uppercase tracking-[0.08em] px-7 h-14 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto min-w-[280px]${shineClass}`}
                >
                  {redirecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                      Loading…
                    </>
                  ) : (
                    <>
                      Send me the {cityDisplay} briefing
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
              <p className="mt-3 text-center text-[12.5px] text-gray-500">
                Takes about 30 seconds. No credit card required.
              </p>
            </>
          )}

          {/* Credibility pill — only for the centered hero variant */}
          {heroVariant === "centered" && (
            <div className="mt-8 flex justify-center">
              <div className="inline-flex items-center gap-3 rounded-full bg-gray-950 text-white ring-1 ring-white/10 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.35)] pl-3 pr-4 py-2 text-[13px] font-medium">
                <span className="inline-flex items-center gap-2">
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded bg-white text-gray-950">
                    <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden>
                      <path
                        fill="currentColor"
                        d="M21.35 11.1H12v2.98h5.35c-.23 1.47-1.8 4.32-5.35 4.32-3.22 0-5.85-2.67-5.85-5.96S8.78 6.48 12 6.48c1.83 0 3.06.78 3.76 1.45l2.56-2.47C16.88 4.05 14.63 3 12 3 6.98 3 3 6.98 3 12s3.98 9 9 9c5.19 0 8.63-3.65 8.63-8.78 0-.59-.06-1.04-.13-1.5z"
                      />
                    </svg>
                  </span>
                  <span className="whitespace-nowrap">Google for Nonprofits</span>
                </span>
                <span aria-hidden className="h-4 w-px bg-white/20" />
                <span className="inline-flex items-center gap-2">
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded bg-white text-gray-950">
                    <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden>
                      <path
                        fill="currentColor"
                        d="M12 2 4 5v6c0 5 3.4 9.5 8 11 4.6-1.5 8-6 8-11V5l-8-3zm-1 14.17-3.59-3.58L6 14l5 5 9-9-1.41-1.42L11 16.17z"
                      />
                    </svg>
                  </span>
                  <span className="whitespace-nowrap">Nonpartisan &amp; cited</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Sample email preview */}
      <section className="border-t border-gray-200/80 bg-gradient-to-b from-gray-50/80 to-white">
        <div className="max-w-[920px] mx-auto px-6 py-16 md:py-24">
          <p className="text-center text-[11.5px] tracking-[0.14em] uppercase text-red-600 font-semibold mb-3">
            A peek at next Monday&rsquo;s email
          </p>
          <h2 className="text-center text-[28px] md:text-[36px] font-bold text-gray-900 tracking-tight leading-[1.15] max-w-[720px] mx-auto mb-10">
            City, state, and Congress — in one short email.
          </h2>

          <div
            className="mx-auto max-w-[760px] rounded-2xl bg-white border border-[#e8eaed] overflow-hidden shadow-[0_1px_2px_rgba(60,64,67,0.08),0_2px_6px_rgba(60,64,67,0.06)]"
            style={{
              fontFamily:
                "'Google Sans Text', 'Google Sans', Roboto, 'Helvetica Neue', Arial, sans-serif",
              color: "#202124",
            }}
            role="img"
            aria-label={`Sample Gmail preview of the Next Voters ${cityDisplay} weekly brief`}
          >
            {/* Toolbar (Gmail action row) */}
            <div className="flex items-center gap-1 h-12 px-2">
              <button
                type="button"
                tabIndex={-1}
                aria-label="Back"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#444746] hover:bg-[#f1f3f4] transition-colors"
              >
                <ArrowLeft className="h-5 w-5" aria-hidden />
              </button>
              <span aria-hidden className="mx-1 h-6 w-px bg-[#e0e0e0]" />
              <button
                type="button"
                tabIndex={-1}
                aria-label="Archive"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#444746] hover:bg-[#f1f3f4] transition-colors"
              >
                <Archive className="h-5 w-5" aria-hidden />
              </button>
              <button
                type="button"
                tabIndex={-1}
                aria-label="Delete"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#444746] hover:bg-[#f1f3f4] transition-colors"
              >
                <Trash2 className="h-5 w-5" aria-hidden />
              </button>
              <span aria-hidden className="mx-1 h-6 w-px bg-[#e0e0e0]" />
              <button
                type="button"
                tabIndex={-1}
                aria-label="Snooze"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#444746] hover:bg-[#f1f3f4] transition-colors"
              >
                <Clock className="h-5 w-5" aria-hidden />
              </button>
              <span aria-hidden className="mx-1 h-6 w-px bg-[#e0e0e0]" />
              <button
                type="button"
                tabIndex={-1}
                aria-label="More"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#444746] hover:bg-[#f1f3f4] transition-colors"
              >
                <MoreVertical className="h-5 w-5" aria-hidden />
              </button>
            </div>

            {/* Subject row — sits below toolbar, indented under sender name */}
            <div className="pl-5 sm:pl-20 pr-4 sm:pr-8 pt-4 flex items-start gap-3">
              <h3
                className="flex-1 text-[20px] sm:text-[22px] font-normal leading-[1.27] tracking-tight"
                style={{ color: "#202124" }}
              >
                Your {cityDisplay} brief — city, state, and Congress this week
              </h3>
              <span
                className="shrink-0 mt-1 inline-flex items-center h-5 px-2 rounded border text-[12px] leading-4 font-medium"
                style={{ borderColor: "#dadce0", color: "#5f6368" }}
              >
                Inbox
              </span>
            </div>

            {/* Sender header */}
            <div className="px-5 sm:px-8 pt-4 pb-3 flex items-start gap-4">
              {/* Avatar — single initial circle, Gmail blue */}
              <div
                className="h-10 w-10 rounded-full inline-flex items-center justify-center text-[18px] font-medium leading-none shrink-0"
                style={{
                  backgroundColor: "#1a73e8",
                  color: "#ffffff",
                  fontFamily: "Roboto, Arial, sans-serif",
                }}
                aria-hidden
              >
                N
              </div>
              {/* Name + meta block */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline flex-wrap gap-x-1">
                  <span
                    className="text-[14px] leading-5 font-bold"
                    style={{ color: "#202124" }}
                  >
                    Next Voters
                  </span>
                  <span
                    className="text-[14px] leading-5 font-normal"
                    style={{ color: "#5f6368" }}
                  >
                    &lt;brief@nextvoters.com&gt;
                  </span>
                </div>
                <div
                  className="text-[12px] leading-4 mt-0.5 inline-flex items-center gap-0.5"
                  style={{ color: "#5f6368" }}
                >
                  to me <ChevronDown className="h-4 w-4" aria-hidden />
                </div>
              </div>
              {/* Right cluster — timestamp on top, action icons below */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <div
                  className="text-[12px] leading-4 whitespace-nowrap"
                  style={{ color: "#5f6368" }}
                >
                  Mon, 7:00 AM
                </div>
                <div className="flex items-center gap-0.5 -mr-1">
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label="Star"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#f1f3f4] transition-colors"
                    style={{ color: "#5f6368" }}
                  >
                    <Star className="h-5 w-5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label="Reply"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#f1f3f4] transition-colors"
                    style={{ color: "#5f6368" }}
                  >
                    <Reply className="h-5 w-5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label="More"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#f1f3f4] transition-colors"
                    style={{ color: "#5f6368" }}
                  >
                    <MoreVertical className="h-5 w-5" aria-hidden />
                  </button>
                </div>
              </div>
            </div>

            {/* Email body — indented to align under sender name. Long
                content is intentionally truncated with a blur+fade overlay
                at the bottom so the landing reads like a paywall preview. */}
            <div className="relative">
              <div
                className="pl-5 sm:pl-20 pr-4 sm:pr-8 pt-2 max-h-[820px] overflow-hidden"
                style={{
                  fontFamily:
                    "'Google Sans Text', Roboto, Arial, sans-serif",
                  fontSize: "14px",
                  lineHeight: "21px",
                  color: "#202124",
                }}
              >
                <p>Good morning, {audienceLabel}.</p>
                <p className="mt-3">
                  Here&rsquo;s what {cityDisplay}, the statehouse, and
                  Washington actually did this week &mdash; organized by
                  topic, every claim cited.
                </p>

                {emailTopics.map((topic) => (
                  <div key={topic.label} className="mt-7">
                    <hr
                      className="border-0 border-t mb-5"
                      style={{ borderColor: "#e8eaed" }}
                    />
                    <p
                      className="text-[12px] font-bold uppercase tracking-[0.12em] mb-4"
                      style={{ color: "#202124" }}
                    >
                      {topic.label}
                    </p>
                    <div className="space-y-5">
                      {topic.stories.map((story) => (
                        <div key={story.headline}>
                          <p
                            className="text-[15px] font-bold leading-[1.35]"
                            style={{ color: "#202124" }}
                          >
                            {story.headline}
                          </p>
                          <p
                            className="text-[12px] leading-[16px] mt-0.5"
                            style={{ color: "#5f6368" }}
                          >
                            {story.source}
                          </p>
                          <p className="mt-1.5" style={{ color: "#3c4043" }}>
                            {story.summary}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Filler below the visible fold. Sits behind the blur so
                    truncation feels like a real long email rather than a
                    hard cutoff. */}
                <p className="mt-8">That&rsquo;s it for this week.</p>
                <p className="mt-1">— The Next Voters team</p>
                <div
                  className="mt-6 pt-4 border-t text-[12px] leading-[18px]"
                  style={{ borderColor: "#e8eaed", color: "#5f6368" }}
                >
                  <p>
                    You&rsquo;re getting this because you subscribed to the{" "}
                    {cityDisplay} brief at nextvoters.com.
                  </p>
                  <p className="mt-1.5">
                    <span style={{ color: "#1a73e8" }} className="underline">
                      Unsubscribe
                    </span>
                    <span className="mx-1.5">·</span>
                    <span style={{ color: "#1a73e8" }} className="underline">
                      Manage preferences
                    </span>
                  </p>
                </div>
              </div>

              {/* Blur + fade overlay. Two stacked layers: soft 3px blur
                  through the upper fade region, stronger 8px blur on the
                  bottom band so content dissolves rather than hard-clipping. */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-72"
                style={{
                  backgroundImage:
                    "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 35%, rgba(255,255,255,0.92) 70%, rgba(255,255,255,1) 100%)",
                  backdropFilter: "blur(3px)",
                  WebkitBackdropFilter: "blur(3px)",
                }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
                style={{
                  backgroundImage:
                    "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                }}
              />
            </div>

            {/* Reply / Forward chips */}
            <div className="pl-5 sm:pl-20 pr-4 sm:pr-8 pb-6 flex flex-wrap gap-3">
              <button
                type="button"
                tabIndex={-1}
                className="inline-flex items-center gap-2 h-9 pl-4 pr-6 rounded-full border bg-white hover:bg-[#f1f3f4] transition-colors"
                style={{
                  borderColor: "#dadce0",
                  color: "#202124",
                  fontFamily:
                    "'Google Sans', Roboto, Arial, sans-serif",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                <Reply
                  className="h-[18px] w-[18px]"
                  style={{ color: "#444746" }}
                  aria-hidden
                />
                Reply
              </button>
              <button
                type="button"
                tabIndex={-1}
                className="inline-flex items-center gap-2 h-9 pl-4 pr-6 rounded-full border bg-white hover:bg-[#f1f3f4] transition-colors"
                style={{
                  borderColor: "#dadce0",
                  color: "#202124",
                  fontFamily:
                    "'Google Sans', Roboto, Arial, sans-serif",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                <Forward
                  className="h-[18px] w-[18px]"
                  style={{ color: "#444746" }}
                  aria-hidden
                />
                Forward
              </button>
            </div>
          </div>

          <p className="mt-5 text-center text-[11.5px] text-gray-400">
            Illustrative Gmail preview &mdash; actual content is sourced and
            cited each week.
          </p>

          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={() => handleStart()}
              disabled={citiesLoading || redirecting}
              className={`inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-[14px] font-extrabold uppercase tracking-[0.08em] px-6 h-12 transition-colors shadow-sm disabled:opacity-60${shineClass}`}
            >
              {redirecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                  Loading…
                </>
              ) : (
                <>
                  Subscribe now — it's free
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-t border-gray-200/80 bg-gray-50/60">
        <div className="max-w-[1020px] mx-auto px-6 py-10 md:py-12">
          <p className="text-center text-[11.5px] tracking-[0.14em] uppercase text-gray-500 font-medium mb-6">
            Proud to be supported by
          </p>
          <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16 opacity-80">
            <img
              src="/google-for-nonprofits-logo.png"
              alt="Google for Nonprofits"
              className="h-16 md:h-20 object-contain grayscale hover:grayscale-0 transition"
            />
            <img
              src="/lookup-live-logo.png"
              alt="LOOK UP"
              className="h-8 md:h-10 object-contain grayscale hover:grayscale-0 transition"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
