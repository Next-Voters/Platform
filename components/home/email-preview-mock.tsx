import {
  Archive,
  ArrowLeft,
  ChevronDown,
  Clock,
  MoreVertical,
  Reply,
  Star,
  Trash2,
} from "lucide-react";

const TOPICS = [
  {
    label: "Economy & Housing",
    stories: [
      {
        headline: "Council approves $2.3M small-business relief fund",
        source: "City Council \u00b7 Finance Committee",
        summary:
          "The fund will offer grants of up to $15,000 to businesses with fewer than 20 employees. Applications open June 1.",
      },
      {
        headline: "State passes rent stabilization amendment",
        source: "State Legislature \u00b7 Senate Housing Committee",
        summary:
          "Annual rent increases capped at 5% plus inflation for buildings older than 15 years. Effective January 2027.",
      },
    ],
  },
  {
    label: "Immigration",
    stories: [
      {
        headline: "New pathway for skilled-worker visa renewals",
        source: "Congress \u00b7 House Judiciary Committee",
        summary:
          "H-1B holders with 5+ years of continuous employment can now file renewals domestically. Bipartisan vote 62\u201338.",
      },
    ],
  },
  {
    label: "Civil Rights",
    stories: [
      {
        headline: "Police oversight board gains subpoena power",
        source: "City Council \u00b7 Public Safety Committee",
        summary:
          "The civilian review board can now compel testimony from officers. Passed 8\u20133 after two public hearings.",
      },
    ],
  },
];

export function EmailPreviewMock() {
  return (
    <div
      className="rounded-2xl bg-white border border-[#e8eaed] overflow-hidden shadow-[0_1px_2px_rgba(60,64,67,0.08),0_2px_6px_rgba(60,64,67,0.06)]"
      style={{
        fontFamily:
          "'Google Sans Text', 'Google Sans', Roboto, 'Helvetica Neue', Arial, sans-serif",
        color: "#202124",
      }}
      role="img"
      aria-label="Sample Gmail preview of the Next Voters weekly brief"
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 h-12 px-2">
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#444746]"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </span>
        <span aria-hidden className="mx-1 h-6 w-px bg-[#e0e0e0]" />
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#444746]"
        >
          <Archive className="h-5 w-5" aria-hidden />
        </span>
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#444746]"
        >
          <Trash2 className="h-5 w-5" aria-hidden />
        </span>
        <span aria-hidden className="mx-1 h-6 w-px bg-[#e0e0e0]" />
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#444746]"
        >
          <Clock className="h-5 w-5" aria-hidden />
        </span>
        <span aria-hidden className="mx-1 h-6 w-px bg-[#e0e0e0]" />
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#444746]"
        >
          <MoreVertical className="h-5 w-5" aria-hidden />
        </span>
      </div>

      {/* Subject */}
      <div className="pl-5 sm:pl-20 pr-4 sm:pr-8 pt-4 flex items-start gap-3">
        <h3
          className="flex-1 text-[20px] sm:text-[22px] font-normal leading-[1.27] tracking-tight"
          style={{ color: "#202124" }}
        >
          Your weekly brief &mdash; city, state, and Congress
        </h3>
        <span
          className="shrink-0 mt-1 inline-flex items-center h-5 px-2 rounded border text-[12px] leading-4 font-medium"
          style={{ borderColor: "#dadce0", color: "#5f6368" }}
        >
          Inbox
        </span>
      </div>

      {/* Sender */}
      <div className="px-5 sm:px-8 pt-4 pb-3 flex items-start gap-4">
        <div
          className="h-10 w-10 rounded-full inline-flex items-center justify-center text-[18px] font-medium leading-none shrink-0"
          style={{ backgroundColor: "#1a73e8", color: "#ffffff" }}
          aria-hidden
        >
          N
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline flex-wrap gap-x-1">
            <span className="text-[14px] leading-5 font-bold" style={{ color: "#202124" }}>
              Next Voters
            </span>
            <span className="text-[14px] leading-5 font-normal" style={{ color: "#5f6368" }}>
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
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="text-[12px] leading-4 whitespace-nowrap" style={{ color: "#5f6368" }}>
            Sun, 9:00 AM
          </div>
          <div className="flex items-center gap-0.5 -mr-1">
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-full"
              style={{ color: "#5f6368" }}
            >
              <Star className="h-5 w-5" aria-hidden />
            </span>
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-full"
              style={{ color: "#5f6368" }}
            >
              <Reply className="h-5 w-5" aria-hidden />
            </span>
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-full"
              style={{ color: "#5f6368" }}
            >
              <MoreVertical className="h-5 w-5" aria-hidden />
            </span>
          </div>
        </div>
      </div>

      {/* Email body with fade */}
      <div className="relative">
        <div
          className="pl-5 sm:pl-20 pr-4 sm:pr-8 pt-2 max-h-[520px] overflow-hidden"
          style={{
            fontFamily: "'Google Sans Text', Roboto, Arial, sans-serif",
            fontSize: "14px",
            lineHeight: "21px",
            color: "#202124",
          }}
        >
          <p>Good morning.</p>
          <p className="mt-3">
            Here&rsquo;s what your city, the statehouse, and Washington actually
            did this week &mdash; organized by topic, every claim cited.
          </p>

          {TOPICS.map((topic) => (
            <div key={topic.label} className="mt-7">
              <hr className="border-0 border-t mb-5" style={{ borderColor: "#e8eaed" }} />
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
                    <p className="text-[12px] leading-[16px] mt-0.5" style={{ color: "#5f6368" }}>
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

          <p className="mt-8">That&rsquo;s it for this week.</p>
          <p className="mt-1">&mdash; The Next Voters team</p>
        </div>

        {/* Fade overlay */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-48"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 40%, rgba(255,255,255,1) 100%)",
          }}
        />
      </div>
    </div>
  );
}
