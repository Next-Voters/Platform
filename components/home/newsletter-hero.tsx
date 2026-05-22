"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { RegionAutocomplete } from "@/components/local/region-autocomplete";
import { EmailPreviewMock } from "./email-preview-mock";

const FALLBACK_PLACEHOLDER_CITY = "Vancouver";

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
  const [placeholderCity, setPlaceholderCity] = useState<string>(() => {
    if (typeof window === "undefined") return FALLBACK_PLACEHOLDER_CITY;
    return cityFromTimezone() ?? FALLBACK_PLACEHOLDER_CITY;
  });

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
      .catch(() => {})
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
    <section className="bg-page">
      <div className="max-w-[1100px] mx-auto px-6 pt-16 pb-16 md:pt-24 md:pb-20">
        {/* Trust badge */}
        <div className="flex justify-center mb-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-sm border border-gray-200/60 px-4 py-1.5 text-[12px] font-medium text-gray-500 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {badge ?? "Free weekly civic digest"}
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-center text-[40px] sm:text-[52px] md:text-[64px] font-medium tracking-tight text-gray-900 leading-[1.1] max-w-[800px] mx-auto">
          Next Voters, legislation in your inbox weekly
        </h1>

        {/* CTA form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="mt-10 max-w-[600px] mx-auto"
          noValidate
        >
          <div className="relative rounded-2xl bg-white border border-gray-200/80 shadow-[0_1px_0_rgba(17,17,17,0.03),0_16px_40px_-16px_rgba(17,17,17,0.10)] p-2 transition-shadow focus-within:shadow-[0_0_0_3px_rgba(235,34,64,0.06),0_16px_40px_-16px_rgba(17,17,17,0.14)]">
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
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

        {/* Product demo - email preview */}
        <div className="mt-14 md:mt-20 max-w-[760px] mx-auto">
          <EmailPreviewMock />
        </div>
      </div>
    </section>
  );
}
