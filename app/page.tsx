"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import ClientMountWrapper from "@/components/client-mount-wrapper";
import { NewsletterHero } from "@/components/home/newsletter-hero";
import { WhatYouGet } from "@/components/home/what-you-get";
import { ProblemSection } from "@/components/home/problem-section";
import { RegionAutocomplete } from "@/components/local/region-autocomplete";

const Home = () => {
  const router = useRouter();
  const [ctaCity, setCtaCity] = useState("");
  const [ctaError, setCtaError] = useState<string | null>(null);

  const handleCtaSubmit = () => {
    setCtaError(null);
    const trimmed = ctaCity.trim();
    if (!trimmed) {
      setCtaError("Please enter your city.");
      return;
    }
    router.push(`/subscription/onboarding?city=${encodeURIComponent(trimmed)}`);
  };

  return (
    <ClientMountWrapper className="min-h-screen bg-page">
      <div className="w-full font-plus-jakarta-sans">
        {/* 1. Hero */}
        <NewsletterHero />

        {/* 2. Supporters strip */}
        <section className="border-t border-gray-200/60">
          <div className="max-w-[1100px] mx-auto px-6 py-8 md:py-10">
            <p className="text-center text-[11px] tracking-[0.14em] uppercase text-gray-400 font-medium mb-6">
              Backed by
            </p>
            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-70">
              <img
                src="/google-for-nonprofits-logo.png"
                alt="Google for Nonprofits"
                className="h-24 md:h-28 object-contain grayscale hover:grayscale-0 transition"
              />
              <img
                src="/lookup-live-logo.png"
                alt="LOOK UP"
                className="h-10 md:h-12 object-contain grayscale hover:grayscale-0 transition"
              />
            </div>
            <p className="mt-5 text-center text-[12px] text-gray-400">
              Readers in 12+ cities across North America
            </p>
          </div>
        </section>

        {/* 3. How It Works */}
        <section className="relative py-20 md:py-28 border-t border-gray-200/60">
          <div className="relative max-w-[1100px] mx-auto px-6">
            <div className="max-w-[680px] mx-auto text-center mb-12 md:mb-16">
              <h2 className="text-[28px] md:text-[38px] font-bold text-gray-900 tracking-tight leading-[1.12]">
                We do the reading,
                <br className="hidden sm:block" />{" "}
                <span className="text-red-500">so you don&apos;t have to.</span>
              </h2>
              <p className="mt-5 text-[15px] md:text-[17px] text-gray-600 leading-relaxed max-w-[560px] mx-auto">
                Every week, we visit official government sources, extract the
                decisions that matter, and write you a personal brief.
              </p>
            </div>

            <div className="max-w-[960px] mx-auto">
              <video
                src="/how-it-works.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="block w-full h-auto rounded-xl border border-gray-200/80"
                aria-label="Animation showing how Next Voters monitors government sources, extracts decisions, writes a personal brief, and sends it to your inbox"
              />
            </div>

            {/* Steps */}
            <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-center gap-4 sm:gap-0 text-[13.5px] text-gray-500 font-medium">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-[11px] font-bold inline-flex items-center justify-center shrink-0">
                  1
                </span>
                <span>We visit official sources</span>
              </div>
              <ArrowRight className="hidden sm:block w-4 h-4 mx-4 text-gray-300 shrink-0" />
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-[11px] font-bold inline-flex items-center justify-center shrink-0">
                  2
                </span>
                <span>Extract what changed</span>
              </div>
              <ArrowRight className="hidden sm:block w-4 h-4 mx-4 text-gray-300 shrink-0" />
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-[11px] font-bold inline-flex items-center justify-center shrink-0">
                  3
                </span>
                <span>Write your brief</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. What You Get */}
        <WhatYouGet />

        {/* 5. The Problem */}
        <ProblemSection />

        {/* 6. Final CTA */}
        <section className="border-t border-gray-200/60">
          <div className="max-w-[1100px] mx-auto px-6 py-20 md:py-28 text-center">
            <h2 className="text-[28px] md:text-[38px] font-bold text-gray-900 tracking-tight leading-[1.12] max-w-[600px] mx-auto">
              Your first briefing is{" "}
              <span className="text-red-500">free.</span>
            </h2>
            <p className="mt-4 text-[15px] md:text-[17px] text-gray-500 leading-relaxed max-w-[480px] mx-auto">
              A weekly digest of the votes, motions, and decisions shaping your
              block. Cited, nonpartisan, and in your inbox by Sunday.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCtaSubmit();
              }}
              className="mt-10 max-w-[560px] mx-auto"
              noValidate
            >
              <div className="relative rounded-2xl bg-white border border-gray-200/80 shadow-[0_1px_0_rgba(17,17,17,0.03),0_16px_40px_-16px_rgba(17,17,17,0.08)] p-2 transition-shadow focus-within:shadow-[0_0_0_3px_rgba(235,34,64,0.06),0_16px_40px_-16px_rgba(17,17,17,0.12)]">
                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <div className="flex-1 min-w-0">
                    <RegionAutocomplete
                      variant="hero"
                      value={ctaCity}
                      onValueChange={(next) => {
                        setCtaCity(next);
                        setCtaError(null);
                      }}
                      onSubmit={handleCtaSubmit}
                      placeholder="Enter your city"
                      inputId="cta-city"
                    />
                  </div>
                  <button
                    type="submit"
                    className="shrink-0 inline-flex items-center justify-center gap-2 rounded-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-[15px] font-semibold px-6 sm:px-8 h-12 sm:h-14 transition-colors shadow-sm"
                  >
                    <span>Get my first briefing</span>
                    <ArrowRight className="w-[18px] h-[18px] stroke-[2.5]" />
                  </button>
                </div>
              </div>
              {ctaError && (
                <p
                  className="mt-3 text-center text-[13px] text-red-700"
                  role="alert"
                  aria-live="polite"
                >
                  {ctaError}
                </p>
              )}
            </form>
          </div>
        </section>
      </div>
    </ClientMountWrapper>
  );
};

export default Home;
