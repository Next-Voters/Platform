import { interpolate } from "remotion";
import { colors, ease } from "../../tokens";
import { display, ui } from "../../fonts";

type ExtractsProps = {
  opacity: number;
  localFrame: number;
};

type DocLine = {
  text: string;
  key?: boolean;
};

const DOC_LINES: DocLine[] = [
  { text: "WHEREAS the City and County of San Francisco" },
  { text: "finds an urgent need for affordable housing;" },
  {
    text: "the Board hereby places a $300M bond on the November ballot, 9 to 2.",
    key: true,
  },
  { text: "" },
  { text: "Regarding traffic-stop policy reform, the" },
  {
    text: "Commission unanimously bans pretextual stops, the first such rule in CA.",
    key: true,
  },
  { text: "" },
  { text: "SFMTA service plan: 18% more frequency on" },
  {
    text: "L-Taraval and N-Judah Muni lines starting February.",
    key: true,
  },
];

const DECISIONS: { topic: string; accent: string; text: string }[] = [
  {
    topic: "Economy & Housing",
    accent: "#ef4444",
    text: "$300M housing bond → November ballot, 9 to 2.",
  },
  {
    topic: "Civil Rights & Justice",
    accent: "#2563eb",
    text: "Pretextual traffic stops banned, the first in California.",
  },
  {
    topic: "Transit & Infrastructure",
    accent: "#a855f7",
    text: "Muni +18% on L-Taraval and N-Judah.",
  },
];

// 5-second scene (150 frames @ 30fps).
//    0- 14  document mounts
//   18- 34  cursor hits line A, highlight grows
//   38- 54  cursor hits line B
//   58- 74  cursor hits line C
//   78-100  document dims; "Key Decisions" card slides up
//   95-130  bullets type/fade in inside card, staggered
//  118-150  caption + hold
export const Extracts: React.FC<ExtractsProps> = ({ opacity, localFrame }) => {
  const docIn = interpolate(localFrame, [0, 14], [0, 1], {
    easing: ease.enterCrisp,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const docDim = interpolate(localFrame, [78, 100], [1, 0.18], {
    easing: ease.editorial,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cardIn = interpolate(localFrame, [82, 106], [0, 1], {
    easing: ease.enterCrisp,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const captionIn = interpolate(localFrame, [0, 18], [0, 1], {
    easing: ease.enterCrisp,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Highlight schedule for each key line
  const highlightSchedule = [
    { start: 18, end: 34 },
    { start: 38, end: 54 },
    { start: 58, end: 74 },
  ];

  let keyIdx = -1;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        background: "#ffffff",
        fontFamily: display,
      }}
    >
      {/* Document — centered, full focus */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          marginLeft: -380,
          width: 760,
          top: 86,
          height: 420,
          background: "white",
          border: `1px solid ${colors.gray200}`,
          borderRadius: 14,
          overflow: "hidden",
          opacity: docIn * docDim,
          transform: `translateY(${(1 - docIn) * 12}px)`,
          boxShadow: "0 12px 36px -16px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            padding: "14px 24px",
            borderBottom: `1px solid ${colors.borderSoft}`,
            fontFamily: ui,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: colors.meta,
            background: "#fafbfc",
          }}
        >
          San Francisco · Board of Supervisors · Item 14
        </div>
        <div
          style={{
            padding: "28px 38px",
            fontFamily: ui,
            fontSize: 15,
            lineHeight: 1.6,
            color: colors.gray700,
          }}
        >
          {DOC_LINES.map((line, i) => {
            const isKey = !!line.key;
            const idx = isKey ? ++keyIdx : keyIdx;
            const sched = isKey ? highlightSchedule[idx] : null;
            const highlight = sched
              ? interpolate(
                  localFrame,
                  [sched.start, sched.start + 14],
                  [0, 1],
                  {
                    easing: ease.enterCrisp,
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }
                )
              : 0;
            return (
              <div
                key={i}
                style={{
                  position: "relative",
                  minHeight: line.text === "" ? 14 : undefined,
                  marginBottom: 2,
                  padding: "1px 6px",
                  color: isKey && highlight > 0.5 ? colors.gray900 : colors.gray700,
                  fontWeight: isKey && highlight > 0.5 ? 600 : 400,
                }}
              >
                {isKey && (
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 4,
                      bottom: 4,
                      width: `${highlight * 100}%`,
                      background: "rgba(254, 202, 202, 0.6)",
                      borderLeft: `3px solid ${colors.red500}`,
                      borderRadius: 3,
                      zIndex: 0,
                    }}
                  />
                )}
                <span style={{ position: "relative", zIndex: 1 }}>
                  {line.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Key Decisions card — emerges over the dimmed document */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          marginLeft: -360,
          width: 720,
          top: 180,
          background: "white",
          borderRadius: 18,
          overflow: "hidden",
          boxShadow:
            "0 0 0 1px rgba(239,68,68,0.12), 0 28px 60px -16px rgba(239,68,68,0.25), 0 16px 40px -10px rgba(0,0,0,0.18)",
          opacity: cardIn,
          transform: `translateY(${(1 - cardIn) * 56}px) scale(${0.96 + cardIn * 0.04})`,
        }}
      >
        {/* Red accent bar on left edge */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: 4,
            background: colors.red500,
          }}
        />

        {/* Header */}
        <div
          style={{
            padding: "18px 32px 8px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              fontFamily: ui,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: colors.red500,
            }}
          >
            Key Decisions
          </span>
          <span
            style={{
              fontFamily: ui,
              fontSize: 11,
              fontWeight: 600,
              color: colors.meta,
              letterSpacing: "0.04em",
            }}
          >
            · Item 14
          </span>
        </div>

        {/* Bullets */}
        <div style={{ padding: "8px 32px 22px" }}>
          {DECISIONS.map((d, di) => {
            const start = 96 + di * 8;
            const reveal = interpolate(localFrame, [start, start + 18], [0, 1], {
              easing: ease.enterCrisp,
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={di}
                style={{
                  marginTop: di === 0 ? 4 : 14,
                  opacity: reveal,
                  transform: `translateY(${(1 - reveal) * 10}px)`,
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                }}
              >
                <span
                  style={{
                    marginTop: 4,
                    width: 24,
                    height: 24,
                    borderRadius: 7,
                    background: d.accent,
                    color: "white",
                    fontFamily: ui,
                    fontSize: 11,
                    fontWeight: 900,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: `0 4px 10px -4px ${d.accent}80`,
                  }}
                >
                  {di + 1}
                </span>
                <div>
                  <div
                    style={{
                      fontFamily: ui,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: colors.meta,
                      marginBottom: 3,
                    }}
                  >
                    {d.topic}
                  </div>
                  <div
                    style={{
                      fontFamily: display,
                      fontSize: 18,
                      fontWeight: 700,
                      color: colors.gray900,
                      lineHeight: 1.35,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {d.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Caption */}
      <div
        style={{
          position: "absolute",
          bottom: 50,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: captionIn,
          transform: `translateY(${(1 - captionIn) * 8}px)`,
        }}
      >
        <p
          style={{
            fontFamily: display,
            fontSize: 36,
            fontWeight: 800,
            letterSpacing: "-0.025em",
            color: colors.gray900,
            margin: 0,
          }}
        >
          We then extract the main takeaways.
        </p>
      </div>
    </div>
  );
};
