import { FileText, Link2, ListFilter } from "lucide-react";
import { EmailPreviewMock } from "./email-preview-mock";

const features = [
  {
    icon: FileText,
    title: "Your weekly brief",
    description:
      "Every Sunday, an email with the votes, motions, and decisions from your city, state, and federal government. No apps to check.",
    rounded: "rounded-2xl",
    padding: "p-6",
  },
  {
    icon: Link2,
    title: "Cited from official sources",
    description:
      "Every claim links back to the government record it came from. City council minutes, legislative text, executive orders.",
    rounded: "rounded-xl",
    padding: "p-5",
  },
  {
    icon: ListFilter,
    title: "Pick your topics",
    description:
      "Immigration, Economy, Civil Rights. Choose what matters to you and skip the rest.",
    rounded: "rounded-lg",
    padding: "p-4",
  },
];

export function WhatYouGet() {
  return (
    <section className="py-20 md:py-28 bg-page">
      <div className="max-w-[1100px] mx-auto px-6">
        <div className="max-w-[680px] mb-12 md:mb-16">
          <p className="text-[11px] tracking-[0.14em] uppercase text-gray-400 font-semibold mb-4">
            What you get
          </p>
          <h2 className="text-[28px] md:text-[38px] font-bold text-gray-900 tracking-tight leading-[1.12]">
            One email. Three levels of government.
          </h2>
          <p className="mt-4 text-[15px] md:text-[17px] text-gray-600 leading-relaxed">
            We read official government sources so you don&rsquo;t have to, then send you a
            brief every Sunday.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          {/* Left: feature cards */}
          <div className="space-y-4">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className={`bg-white border border-gray-200/80 ${f.rounded} ${f.padding}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-500">
                      <Icon className="w-4 h-4" />
                    </span>
                    <h3 className="text-[18px] font-semibold text-gray-900">{f.title}</h3>
                  </div>
                  <p className="text-[14.5px] text-gray-600 leading-relaxed pl-11">
                    {f.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right: email preview */}
          <div className="lg:sticky lg:top-24">
            <EmailPreviewMock />
          </div>
        </div>
      </div>
    </section>
  );
}
