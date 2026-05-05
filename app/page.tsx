"use client";

import { useEffect, useState } from "react";
import { MapPin, Layers, BookOpen, ArrowRight } from "lucide-react";
import ClientMountWrapper from "@/components/client-mount-wrapper";
import { NewsletterHero } from "@/components/home/newsletter-hero";

const HOW_IT_WORKS_STEPS = [
  {
    icon: MapPin,
    title: "Tell us your city.",
    body: "We're tracking councils and local bills in cities across North America. Pick yours and we'll start watching.",
  },
  {
    icon: Layers,
    title: "We do the reading.",
    body: "Every week we go through the agendas, motions, and votes. Then we write up what actually affects you, with no spin.",
  },
  {
    icon: BookOpen,
    title: "You read it Sunday.",
    body: "One short email. Every claim links back to the original document, so you can check our work whenever you want.",
  },
];

const Home = () => {
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion || isPaused) return;

    setActiveStep((prev) => (prev < 0 ? 0 : prev));
    const interval = setInterval(() => {
      setActiveStep((prev) => ((prev < 0 ? 0 : prev) + 1) % HOW_IT_WORKS_STEPS.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [isPaused]);

  const progressPct =
    activeStep < 0 ? 0 : (activeStep / (HOW_IT_WORKS_STEPS.length - 1)) * 66.666;

  return (
    <ClientMountWrapper className="min-h-screen bg-page">
      <div className="w-full font-plus-jakarta-sans">
        <NewsletterHero />

        {/* ───────────── Supporters strip ───────────── */}
        <section className="border-y border-gray-200/80 bg-white/60 backdrop-blur">
          <div className="max-w-[1100px] mx-auto px-6 py-10 md:py-12">
            <p className="text-center text-[11.5px] tracking-[0.14em] uppercase text-gray-500 font-medium mb-6">
              Proud to be supported by
            </p>
            <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16 opacity-80">
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
          </div>
        </section>

        {/* ───────────── How it works ───────────── */}
        <section className="relative py-20 md:py-32 bg-white border-y border-gray-200/80 overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[520px]"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 55% 60% at 50% 0%, rgba(235, 34, 64, 0.05) 0%, transparent 70%)",
            }}
          />

          <div className="relative max-w-[1100px] mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center mb-16 md:mb-24">
              <h2 className="text-[34px] md:text-[46px] font-bold text-gray-900 tracking-tight leading-[1.05]">
                Your region&apos;s public affairs,
                <br className="hidden sm:block" />{" "}
                <span className="text-red-500">without the noise.</span>
              </h2>
              <p className="mt-6 text-[16px] md:text-[17px] text-gray-600 leading-relaxed">
                Three steps. About five minutes a week. That&apos;s the whole
                thing.
              </p>
            </div>

            <ol
              className="relative grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* dashed connector — desktop only, runs through icon centers */}
              <div
                aria-hidden
                className="hidden md:block absolute left-[16.667%] right-[16.667%] top-[44px] h-px"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(90deg, rgb(209 213 219) 0 6px, transparent 6px 14px)",
                }}
              />

              {/* animated red progress — fills as active step advances */}
              <div
                aria-hidden
                className="hidden md:block absolute left-[16.667%] top-[44px] h-[2px] -translate-y-[0.5px] rounded-full bg-red-500 transition-[width] duration-[900ms] ease-out"
                style={{ width: `${progressPct}%` }}
              />

              {HOW_IT_WORKS_STEPS.map((step, i) => {
                const Icon = step.icon;
                const num = String(i + 1).padStart(2, "0");
                const isActive = activeStep === i;
                return (
                  <li
                    key={step.title}
                    className="relative group flex flex-col items-center text-center"
                  >
                    <div className="relative z-10 mb-7">
                      <div
                        className={`h-[88px] w-[88px] rounded-2xl bg-white ring-1 flex items-center justify-center transition-all duration-500 ease-out ${
                          isActive
                            ? "ring-red-300 shadow-[0_4px_12px_rgba(235,34,64,0.12),0_24px_44px_-16px_rgba(235,34,64,0.4)] -translate-y-1.5"
                            : "ring-gray-200 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.12)] group-hover:ring-red-200 group-hover:-translate-y-0.5"
                        }`}
                      >
                        <Icon
                          className={`w-8 h-8 transition-colors duration-500 ${
                            isActive ? "text-red-500" : "text-red-600"
                          }`}
                          strokeWidth={1.75}
                        />
                      </div>
                      <span
                        className={`absolute -top-2 -right-2 inline-flex items-center justify-center h-7 min-w-[28px] px-1.5 rounded-full text-white text-[10.5px] font-bold tracking-[0.08em] ring-4 ring-white transition-all duration-500 ${
                          isActive
                            ? "bg-red-500 scale-[1.08] shadow-[0_4px_10px_rgba(235,34,64,0.35)]"
                            : "bg-gray-900"
                        }`}
                      >
                        {num}
                      </span>
                      {/* soft red halo on active */}
                      <span
                        aria-hidden
                        className={`pointer-events-none absolute inset-0 -z-10 rounded-2xl transition-opacity duration-500 ${
                          isActive ? "opacity-100" : "opacity-0"
                        }`}
                        style={{
                          background:
                            "radial-gradient(closest-side, rgba(235, 34, 64, 0.18), rgba(235, 34, 64, 0) 70%)",
                          transform: "scale(1.6)",
                        }}
                      />
                    </div>

                    <h3
                      className={`text-[20px] md:text-[21px] font-semibold leading-snug transition-colors duration-500 ${
                        isActive ? "text-gray-900" : "text-gray-900/90"
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p
                      className={`mt-3 text-[15px] leading-relaxed max-w-[34ch] transition-colors duration-500 ${
                        isActive ? "text-gray-700" : "text-gray-500"
                      }`}
                    >
                      {step.body}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* ───────────── Final CTA ───────────── */}
        <section className="relative overflow-hidden border-t border-gray-200/80 bg-page">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(50% 70% at 50% 0%, rgba(235, 34, 64, 0.06) 0%, rgba(235, 34, 64, 0) 70%)",
            }}
          />
          <div className="relative max-w-[1100px] mx-auto px-6 py-20 md:py-28 text-center">
            <h2 className="text-[32px] md:text-[48px] font-bold text-gray-900 tracking-tight leading-[1.05] max-w-[760px] mx-auto">
              Stay informed with{" "}
              <span className="text-red-500">Next Voters.</span>
            </h2>
            <p className="mt-5 text-[16px] md:text-[18px] text-gray-600 leading-relaxed max-w-[560px] mx-auto">
              A free weekly digest of the votes, motions, and decisions shaping
              your block. Cited, nonpartisan, and in your inbox by Sunday.
            </p>
            <div className="mt-10 flex justify-center">
              <a
                href="/local/onboarding"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-[15px] font-semibold px-7 h-12 transition-colors w-full sm:w-auto shadow-lg shadow-red-900/20"
              >
                Subscribe to your city&apos;s weekly update
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>
      </div>
    </ClientMountWrapper>
  );
};

export default Home;
