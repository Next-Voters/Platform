"use client";

import { ArrowRight } from "lucide-react";
import ClientMountWrapper from "@/components/client-mount-wrapper";
import { NewsletterHero } from "@/components/home/newsletter-hero";

const Home = () => {
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

        {/* ───────────── How the tech works ───────────── */}
        <section className="relative py-20 md:py-28 bg-white overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[400px]"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 55% 60% at 50% 0%, rgba(235, 34, 64, 0.04) 0%, transparent 70%)",
            }}
          />

          <div className="relative max-w-[1100px] mx-auto px-6">
            <div className="max-w-[680px] mx-auto text-center mb-12 md:mb-16">
              <p className="text-[11.5px] tracking-[0.18em] uppercase text-red-600 font-semibold mb-4">
                How the tech works
              </p>
              <h2 className="text-[32px] md:text-[44px] font-bold text-gray-900 tracking-tight leading-[1.06]">
                We do the reading,
                <br className="hidden sm:block" />{" "}
                <span className="text-red-500">so you don&apos;t have to.</span>
              </h2>
              <p className="mt-6 text-[15.5px] md:text-[17px] text-gray-600 leading-relaxed max-w-[560px] mx-auto">
                Every week, we visit official government sources, extract the
                decisions that matter, write you a personal brief, and send it
                to your inbox.
              </p>
            </div>

            <div className="max-w-[960px] mx-auto">
              <video
                src="/how-it-works.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="block w-full h-auto"
                aria-label="Animation showing how Next Voters monitors government sources, extracts decisions, writes a personal brief, and sends it to your inbox"
              />
            </div>
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
                className="inline-flex items-center justify-center gap-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[18px] sm:text-[22px] font-black uppercase tracking-[0.08em] px-10 sm:px-12 h-16 sm:h-[72px] transition-colors w-full sm:w-auto shadow-lg shadow-red-900/20"
              >
                Get my weekly brief
                <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7" />
              </a>
            </div>
          </div>
        </section>

        {/* ───────────── Footer ───────────── */}
        <footer className="border-t border-gray-200/80 bg-white">
          <div className="max-w-[1100px] mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12.5px] text-gray-500">
            <span className="font-semibold text-gray-700 tracking-tight">
              Next Voters
            </span>
            <span>© {new Date().getFullYear()} Next Voters. All rights reserved.</span>
          </div>
        </footer>
      </div>
    </ClientMountWrapper>
  );
};

export default Home;
