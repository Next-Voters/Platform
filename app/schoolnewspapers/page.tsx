import type { Metadata } from "next";
import { NewsletterHero } from "@/components/home/newsletter-hero";

export const metadata: Metadata = {
  title: "The Civic Desk for School Newspapers — Next Voters",
  description:
    "A free, nonpartisan weekly briefing that monitors your city council, state legislature, and Congress — so student editors never miss a local story. Cited leads, ready to assign.",
  alternates: { canonical: "/schoolnewspapers" },
  openGraph: {
    title: "The Civic Desk for School Newspapers — Next Voters",
    description:
      "Cited, nonpartisan story leads from local government — delivered weekly. Built for student editors who want to cover what their community is actually deciding.",
    url: "https://nextvoters.com/schoolnewspapers",
  },
};

const ONBOARD_HREF = "/local/onboarding?ref=school-newspapers";

// Floated as a credibility wall under the hero. Logos live in /public/logos and
// are sized per-mark (heights differ) so their visual weight balances in the row.
const SCHOOLS = [
  { name: "Stanford University", src: "/logos/stanford.svg", h: "h-14 sm:h-16" },
  { name: "UC Berkeley", src: "/logos/berkeley.svg", h: "h-12 sm:h-14" },
  { name: "Harvard University", src: "/logos/harvard.svg", h: "h-9 sm:h-10" },
  { name: "Yale University", src: "/logos/yale.svg", h: "h-11 sm:h-12" },
  { name: "Princeton University", src: "/logos/princeton.svg", h: "h-6 sm:h-7" },
  { name: "MIT", src: "/logos/mit.svg", h: "h-9 sm:h-10" },
];

const beats = [
  {
    label: "Education",
    blurb:
      "Board votes, budget cuts, curriculum changes, and the policies that land directly on your classmates.",
  },
  {
    label: "Housing & Cost of Living",
    blurb:
      "Rent rules, zoning fights, and affordability measures shaping where your readers and their families live.",
  },
  {
    label: "Public Safety",
    blurb:
      "Policing oversight, court rulings, and safety ordinances — the stories campuses care about most.",
  },
  {
    label: "Transit & Infrastructure",
    blurb:
      "Bus routes, bike lanes, and capital projects that decide how students actually get to school.",
  },
  {
    label: "Climate & Environment",
    blurb:
      "Emissions rules and green initiatives — the long-game beats student readers consistently click.",
  },
  {
    label: "Civil Rights & Justice",
    blurb:
      "Voting access, free-expression cases, and equity measures with real weight on a young audience.",
  },
];

const steps = [
  {
    n: "01",
    title: "Tell us your community",
    body: "Pick your city. We map it to your local council, your state legislature, and the federal action that reaches your readers.",
  },
  {
    n: "02",
    title: "We do the reading",
    body: "Every week we comb official sources — agendas, roll-call votes, signed bills — and pull out what's genuinely newsworthy.",
  },
  {
    n: "03",
    title: "You get assignable leads",
    body: "One email lands by Sunday: tight summaries, the level of government, and a citation your reporters can verify and build on.",
  },
];

const features = [
  {
    title: "Cited, never invented",
    body: "Every item points back to an official source — a vote, a signed bill, an agency ruling. Your reporters start from a verifiable fact, not a rumor.",
  },
  {
    title: "Rigorously nonpartisan",
    body: "We summarize what happened, not who should win. That neutrality is exactly what a student paper's masthead needs to defend.",
  },
  {
    title: "Three levels, one inbox",
    body: "City, state, and federal action — covering the same beat — arrive together, so you see the full picture without chasing five sites.",
  },
  {
    title: "Built for a newsroom's clock",
    body: "It arrives by Sunday, in time for a Monday budget meeting. Skim it, mark the leads, hand them out, publish.",
  },
];

export default function SchoolNewspapersPage() {
  return (
    <div className="min-h-screen bg-page font-plus-jakarta-sans">
      {/* ───────────── Hero (shared with homepage) ───────────── */}
      <NewsletterHero
        badge="Free for students"
        ctaLabel="Start my newsroom's briefing"
        refCode="school-newspapers"
        headline={
          <>
            The local stories your{" "}
            <span className="inline-block pr-1 pb-1 italic font-extrabold bg-gradient-to-br from-red-500 via-red-500 to-rose-600 bg-clip-text text-transparent">
              student paper
            </span>{" "}
            is missing
          </>
        }
        subcopy="Local government decides the stories your readers live — but no student newsroom can read every council agenda. We do that reading and send cited, assignable leads to your inbox every week. Free."
      />

      {/* ───────────── Trusted by students at ───────────── */}
      <section className="relative overflow-hidden border-y border-gray-200/80 bg-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 80% at 50% 0%, rgba(235, 34, 64, 0.04) 0%, rgba(235, 34, 64, 0) 70%)",
          }}
        />
        <div className="relative max-w-[1100px] mx-auto px-6 py-14 md:py-16">
          <p className="text-center text-[11.5px] tracking-[0.16em] uppercase text-gray-400 font-semibold mb-10">
            Trusted by students at
          </p>

          <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-8 sm:gap-x-14 md:gap-x-16">
            {SCHOOLS.map((school, i) => (
              <img
                key={school.name}
                src={school.src}
                alt={school.name}
                loading="lazy"
                className={`animate-float w-auto object-contain select-none transition-all ${school.h}`}
                style={{
                  animationDelay: `${(i % 5) * 0.6}s`,
                  animationDuration: `${6 + (i % 3)}s`,
                }}
              />
            ))}
          </div>

          <p className="text-center text-[12px] text-gray-400 mt-10">
            Independent and nonpartisan. Not affiliated with or endorsed by any
            university.
          </p>
        </div>
      </section>

      {/* ───────────── How it works ───────────── */}
      <section
        id="how-it-works"
        className="max-w-[720px] mx-auto px-5 sm:px-6 py-14 sm:py-20 scroll-mt-20"
      >
        <div className="text-center mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400 mb-3">
            How it works
          </p>
          <h2 className="text-[24px] sm:text-[32px] font-bold text-gray-950 tracking-tight">
            From council chamber to your inbox
          </h2>
        </div>

        <div className="space-y-4">
          {steps.map((step) => (
            <div
              key={step.n}
              className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-5">
                <span className="text-[15px] font-bold text-red-500 shrink-0 mt-0.5 tabular-nums">
                  {step.n}
                </span>
                <div>
                  <h3 className="text-[16px] font-bold text-gray-950 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-[14px] text-gray-600 leading-relaxed">
                    {step.body}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="w-full max-w-[600px] mx-auto px-5">
        <hr className="border-gray-200" />
      </div>

      {/* ───────────── Sample lead ───────────── */}
      <section className="max-w-[720px] mx-auto px-5 sm:px-6 py-14 sm:py-20">
        <div className="text-center mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400 mb-3">
            What a lead looks like
          </p>
          <h2 className="text-[24px] sm:text-[32px] font-bold text-gray-950 tracking-tight">
            One item. One assignment.
          </h2>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm max-w-[560px] mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-red-600 bg-red-50 border border-red-100 rounded-full px-2.5 py-1">
              Education
            </span>
            <span className="text-[12px] text-gray-400">· City Council</span>
          </div>
          <h3 className="text-[18px] font-bold text-gray-950 mb-3 leading-snug">
            Council votes 8–3 to redraw three high-school attendance zones
          </h3>
          <p className="text-[14px] text-gray-600 leading-relaxed mb-5">
            The new boundaries take effect next fall and reassign roughly 1,200
            students. Backers cite overcrowding; opponents warn of longer commutes
            for students in the east district. Implementation guidance is due from
            the district within 60 days.
          </p>
          <div className="flex items-center gap-2 text-[12.5px] text-gray-500 border-t border-gray-100 pt-4">
            <svg
              className="w-3.5 h-3.5 text-gray-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              width="14"
              height="14"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5M10.172 13.828a4 4 0 010-5.656l3-3a4 4 0 015.656 5.656l-1.5 1.5"
              />
            </svg>
            <span>Source: City Council roll-call, Resolution 24-118</span>
          </div>
        </div>
        <p className="text-[12.5px] text-gray-400 text-center mt-5">
          Illustrative example. Your briefing reflects your real community.
        </p>
      </section>

      <div className="w-full max-w-[600px] mx-auto px-5">
        <hr className="border-gray-200" />
      </div>

      {/* ───────────── Beats ───────────── */}
      <section className="max-w-[840px] mx-auto px-5 sm:px-6 py-14 sm:py-20">
        <div className="text-center mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400 mb-3">
            Coverage
          </p>
          <h2 className="text-[24px] sm:text-[32px] font-bold text-gray-950 tracking-tight">
            Pick the beats your paper covers
          </h2>
          <p className="mt-5 text-[15px] text-gray-500 leading-relaxed max-w-md mx-auto">
            Choose your topics and we tailor the briefing — at the city, state,
            and federal level — to the desks you actually staff.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {beats.map((beat) => (
            <div
              key={beat.label}
              className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <h3 className="text-[15px] font-bold text-gray-950 mb-2">
                {beat.label}
              </h3>
              <p className="text-[13px] text-gray-600 leading-relaxed">
                {beat.blurb}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="w-full max-w-[600px] mx-auto px-5">
        <hr className="border-gray-200" />
      </div>

      {/* ───────────── Why editors ───────────── */}
      <section className="max-w-[720px] mx-auto px-5 sm:px-6 py-14 sm:py-20">
        <div className="text-center mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400 mb-3">
            Why editors use it
          </p>
          <h2 className="text-[24px] sm:text-[32px] font-bold text-gray-950 tracking-tight">
            A research desk you don&apos;t have to staff
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-7 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <h3 className="text-[15.5px] font-bold text-gray-950 mb-2">
                {feature.title}
              </h3>
              <p className="text-[13.5px] text-gray-600 leading-relaxed">
                {feature.body}
              </p>
            </div>
          ))}
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
        <div className="relative max-w-[720px] mx-auto px-5 sm:px-6 py-20 sm:py-28 text-center">
          <h2 className="text-[26px] sm:text-[40px] font-bold text-gray-950 mb-5 tracking-tight leading-[1.08]">
            Give your newsroom a head start.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-gray-500 mb-9 max-w-md mx-auto leading-relaxed">
            Free for students. Your first cited briefing arrives this
            Sunday — start covering the stories that matter to your readers.
          </p>
          <a
            href={ONBOARD_HREF}
            className="inline-flex items-center justify-center min-h-[48px] px-8 py-3 text-[15px] font-semibold text-white bg-brand rounded-xl hover:bg-brand-hover transition-colors shadow-sm touch-manipulation"
          >
            Start my newsroom&apos;s briefing
          </a>
          <p className="text-[12.5px] text-gray-400 mt-5">
            Questions about a class or club plan?{" "}
            <a
              href="mailto:hello@nextvoters.com"
              className="text-gray-600 underline underline-offset-2 hover:text-gray-800"
            >
              hello@nextvoters.com
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
