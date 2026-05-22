"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { RegionAutocomplete } from "@/components/local/region-autocomplete";

export interface NewsletterHeroProps {
  /** Pill text above the headline. */
  badge?: ReactNode;
  /** Main headline. Defaults to the homepage civic-digest headline. */
  headline?: ReactNode;
  /** Supporting line under the headline. */
  subcopy?: ReactNode;
  /** Submit-button label. */
  ctaLabel?: string;
  /** Referral code appended to the onboarding redirect (for attribution). */
  refCode?: string;
}

const FALLBACK_PLACEHOLDER_CITY = "Vancouver";

type BackBuilding = readonly [x: number, w: number, h: number];
type FrontAccent = "antenna" | "step" | "spire" | "dome" | null;
type FrontBuilding = { x: number; w: number; h: number; a: FrontAccent };

const BACK_BUILDINGS: readonly BackBuilding[] = [
  [0, 80, 110], [78, 56, 90], [128, 72, 140], [196, 50, 100],
  [240, 84, 160], [320, 60, 120], [374, 70, 95], [438, 54, 145],
  [486, 78, 175], [560, 60, 110], [614, 88, 200], [696, 56, 130],
  [746, 72, 165], [812, 50, 100], [856, 84, 185], [934, 60, 120],
  [988, 76, 150], [1058, 54, 105], [1106, 90, 215], [1190, 56, 135],
  [1240, 70, 170], [1304, 50, 100], [1348, 80, 195], [1422, 60, 130],
];

const FRONT_BUILDINGS: readonly FrontBuilding[] = [
  { x: 0, w: 70, h: 170, a: null },
  { x: 72, w: 50, h: 120, a: null },
  { x: 124, w: 84, h: 230, a: "antenna" },
  { x: 210, w: 56, h: 150, a: null },
  { x: 268, w: 76, h: 200, a: "step" },
  { x: 346, w: 48, h: 135, a: null },
  { x: 396, w: 92, h: 260, a: "antenna" },
  { x: 490, w: 58, h: 175, a: null },
  { x: 550, w: 70, h: 145, a: null },
  // domed civic building (capitol-like)
  { x: 622, w: 110, h: 165, a: "dome" },
  { x: 734, w: 54, h: 200, a: null },
  { x: 790, w: 80, h: 245, a: "antenna" },
  { x: 872, w: 50, h: 140, a: null },
  // church/spire
  { x: 924, w: 64, h: 175, a: "spire" },
  { x: 990, w: 58, h: 150, a: null },
  { x: 1050, w: 86, h: 270, a: "antenna" },
  { x: 1138, w: 50, h: 165, a: null },
  { x: 1190, w: 74, h: 215, a: "step" },
  { x: 1266, w: 56, h: 145, a: null },
  { x: 1324, w: 80, h: 235, a: "antenna" },
  { x: 1406, w: 34, h: 160, a: null },
];

function renderFrontBuilding(b: FrontBuilding) {
  const { x, w, h, a } = b;
  const top = 316 - h;
  return (
    <g key={`f${x}`}>
      <rect x={x} y={top} width={w} height={h} />
      {a === "antenna" && (
        <rect x={x + w / 2 - 1.5} y={top - 22} width="3" height="22" />
      )}
      {a === "step" && (
        <rect x={x + 6} y={top - 12} width={w - 12} height="12" />
      )}
      {a === "spire" && (
        <>
          <polygon
            points={`${x},${top} ${x + w / 2},${top - 60} ${x + w},${top}`}
          />
          <rect x={x + w / 2 - 1.5} y={top - 78} width="3" height="20" />
        </>
      )}
      {a === "dome" && (
        <>
          <rect x={x + w / 2 - 22} y={top - 14} width="44" height="14" />
          <path
            d={`M ${x + w / 2 - 26} ${top - 14} Q ${x + w / 2 - 26} ${top - 60} ${x + w / 2} ${top - 60} Q ${x + w / 2 + 26} ${top - 60} ${x + w / 2 + 26} ${top - 14} Z`}
          />
          <rect x={x + w / 2 - 1.5} y={top - 76} width="3" height="16" />
        </>
      )}
    </g>
  );
}

// Pull a coarse city guess from the browser's IANA timezone - automatic, no
// permission prompt, and accurate enough for a placeholder. e.g.
// "America/Los_Angeles" → "Los Angeles", "Europe/Paris" → "Paris".
// Returns null on UTC-like zones with no city segment.
function cityFromTimezone(): string | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz || !tz.includes("/")) return null;
    const last = tz.split("/").pop();
    if (!last) return null;
    if (/^(UTC|GMT|Etc|Universal|Zulu)$/i.test(last)) return null;
    return last.replace(/_/g, " ");
  } catch {
    return null;
  }
}

export function NewsletterHero({
  badge,
  headline,
  subcopy,
  ctaLabel,
  refCode,
}: NewsletterHeroProps = {}) {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Initial value runs in render. SSR sees the fallback (timezone API isn't
  // useful server-side), but on client mount the initialiser fires synchronously
  // so the timezone-derived city paints on first frame, no flicker through
  // "Vancouver" → real city.
  const [placeholderCity, setPlaceholderCity] = useState<string>(() => {
    if (typeof window === "undefined") return FALLBACK_PLACEHOLDER_CITY;
    return cityFromTimezone() ?? FALLBACK_PLACEHOLDER_CITY;
  });

  // Personalise the input placeholder with the visitor's likely city via a
  // client-side IP geolocation call. Browser-direct so the visitor's IP is
  // used automatically; no key needed; CORS-enabled. If the lookup fails or
  // returns no city, the fallback stays in place - the placeholder is purely
  // cosmetic so a degraded result is fine.
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 3500);

    fetch("https://ipapi.co/json/", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: { city?: string }) => {
        if (cancelled) return;
        const detected = data?.city?.toString().trim();
        if (detected) setPlaceholderCity(detected);
      })
      .catch(() => {
        // Swallow - fallback already applied.
      })
      .finally(() => {
        window.clearTimeout(timer);
      });

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, []);

  const handleSubmit = () => {
    setError(null);
    const trimmed = city.trim();
    if (!trimmed) {
      setError("Please enter your city.");
      return;
    }
    const ref = refCode ? `&ref=${encodeURIComponent(refCode)}` : "";
    router.push(
      `/subscription/onboarding?city=${encodeURIComponent(trimmed)}${ref}`,
    );
  };

  return (
    <section className="grain-overlay relative overflow-hidden bg-gradient-to-b from-rose-50/40 via-slate-50/60 to-white">
      {/* Brand red glow behind headline */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[22%] -translate-x-1/2 h-[300px] w-[720px] rounded-full blur-3xl opacity-70"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(235, 34, 64, 0.09) 0%, rgba(235, 34, 64, 0) 65%)",
        }}
      />
      {/* Faint cityscape silhouette - two layers slowly drift left in a seamless loop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 text-slate-700"
        style={{
          maskImage:
            "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
        }}
      >
        {/* Back layer - distant skyline, fainter, slower drift */}
        <div className="absolute inset-x-0 bottom-0 h-[180px] md:h-[230px] overflow-hidden">
          <div className="flex h-full w-[200%] animate-city-drift-back">
            {[0, 1].map((i) => (
              <svg
                key={i}
                viewBox="0 0 1440 320"
                preserveAspectRatio="none"
                className="w-1/2 h-full opacity-[0.035] flex-shrink-0"
                fill="currentColor"
              >
                {BACK_BUILDINGS.map(([x, w, h]) => (
                  <rect key={`b${x}`} x={x} y={320 - h} width={w} height={h} />
                ))}
              </svg>
            ))}
          </div>
        </div>

        {/* Front layer - closer, taller, faster drift for subtle parallax */}
        <div className="relative h-[210px] md:h-[270px] overflow-hidden">
          <div className="flex h-full w-[200%] animate-city-drift-front">
            {[0, 1].map((i) => (
              <svg
                key={i}
                viewBox="0 0 1440 320"
                preserveAspectRatio="none"
                className="w-1/2 h-full opacity-[0.06] flex-shrink-0"
                fill="currentColor"
              >
                <rect x="0" y="316" width="1440" height="4" />
                {FRONT_BUILDINGS.map(renderFrontBuilding)}
              </svg>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-[2] max-w-[1100px] mx-auto px-6 pt-20 pb-32 md:pt-28 md:pb-44">
        {/* Trust badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-sm border border-gray-200/60 px-4 py-1.5 text-[12px] font-medium text-gray-500 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {badge ?? "Free weekly civic digest"}
          </span>
        </div>

        <h1 className="text-center text-[44px] sm:text-[56px] md:text-[68px] font-bold tracking-tight text-gray-900 leading-[1.08] max-w-[900px] mx-auto">
          {headline ?? (
            <>
              Know what your city council voted on{" "}
              <span className="inline-block pr-1 pb-1 italic font-extrabold bg-gradient-to-br from-red-500 via-red-500 to-rose-600 bg-clip-text text-transparent">
                this week
              </span>
            </>
          )}
        </h1>

        <p className="mt-6 text-center text-[15px] md:text-[17px] text-gray-500 leading-relaxed max-w-[620px] mx-auto">
          {subcopy ??
            "A free weekly email with the votes, motions, and decisions that shape your neighborhood. Cited from official government sources. Nonpartisan."}
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="mt-10 max-w-[720px] mx-auto"
          noValidate
        >
          <div className="relative rounded-2xl bg-white border border-gray-200/80 shadow-[0_1px_0_rgba(17,17,17,0.03),0_16px_40px_-16px_rgba(17,17,17,0.10)] p-2 transition-shadow focus-within:shadow-[0_0_0_3px_rgba(235,34,64,0.06),0_16px_40px_-16px_rgba(17,17,17,0.14)]">
            <div className="flex items-stretch gap-2">
              <div className="flex-1 min-w-0">
                <RegionAutocomplete
                  variant="hero"
                  value={city}
                  onValueChange={(next) => {
                    setCity(next);
                    setError(null);
                  }}
                  onSubmit={handleSubmit}
                  placeholder={`e.g. ${placeholderCity}`}
                  inputId="home-city"
                />
              </div>
              <button
                type="submit"
                className="shrink-0 inline-flex items-center justify-center gap-2 rounded-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-[15px] sm:text-[16px] font-semibold px-6 sm:px-8 h-12 sm:h-14 transition-colors shadow-sm"
              >
                <span>{ctaLabel ?? "Get my first briefing"}</span>
                <ArrowRight className="w-[18px] h-[18px] stroke-[2.5]" />
              </button>
            </div>
          </div>
          {error && (
            <p
              className="mt-3 text-center text-[13px] text-red-700"
              role="alert"
              aria-live="polite"
            >
              {error}
            </p>
          )}
        </form>

        {/* Trust signals */}
        <div className="mt-8 flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-[12.5px] text-gray-400 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            Cited from official sources
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            Free forever
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            Readers in 12+ cities
          </span>
        </div>
      </div>
    </section>
  );
}
