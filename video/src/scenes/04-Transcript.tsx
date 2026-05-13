import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { colors, ease } from "../tokens";
import { display, ui } from "../fonts";

const TRANSCRIPT: { speaker: string; text: string }[] = [
  { speaker: "President Walton", text: "We'll resume the regular meeting." },
  { speaker: "Clerk", text: "Item 14 — affordable housing bond, $300 million." },
  { speaker: "Sup. Chan", text: "I want to thank the housing coalition for their work." },
  { speaker: "Sup. Mandelman", text: "This funds roughly 2,400 below-market units citywide." },
  { speaker: "Sup. Stefani", text: "I have concerns about debt service projections." },
  { speaker: "Sup. Preston", text: "We've waited long enough — let's get it on the ballot." },
  { speaker: "Clerk", text: "On Item 14, the motion is to place on November ballot." },
  { speaker: "Clerk", text: "Roll call. Ayes: 9. Noes: 2." },
  { speaker: "President Walton", text: "Motion passes. Item 14 is on the November ballot." },
  { speaker: "Clerk", text: "Item 15 — Police Commission report on traffic stops." },
  { speaker: "Sup. Chan", text: "Pretextual stops disproportionately affect Black drivers." },
];

const HIGHLIGHT_INDEXES = [3, 7];
const LINE_HEIGHT = 38;

// 5-second scene (150 frames @ 30fps).
//    0- 14  panel mounts
//   14-100  transcript scrolls upward
//   40- 70  AI marker sweeps line 3
//   78-110  AI marker sweeps line 7
//   95-125  highlighted lines collapse out
//  108-145  bullet drops into Monday Brief panel
export const Transcript: React.FC = () => {
  const frame = useCurrentFrame();

  const panelIn = interpolate(frame, [0, 14], [0, 1], {
    easing: ease.enterCrisp,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const briefIn = interpolate(frame, [16, 36], [0, 1], {
    easing: ease.enterCrisp,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scroll = interpolate(frame, [14, 110], [0, LINE_HEIGHT * 4], {
    easing: ease.editorial,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const sweep1 = interpolate(frame, [40, 70], [0, 1], {
    easing: ease.smoothIn,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sweep2 = interpolate(frame, [78, 108], [0, 1], {
    easing: ease.smoothIn,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const collapse = interpolate(frame, [95, 125], [0, 1], {
    easing: ease.enterCrisp,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const bulletDrop = interpolate(frame, [108, 144], [0, 1], {
    easing: ease.enterCrisp,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const captionIn = interpolate(frame, [4, 28], [0, 1], {
    easing: ease.enterCrisp,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "#fafafa",
        fontFamily: display,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 32,
          left: 0,
          right: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          opacity: panelIn,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "5px 11px",
            background: "#fee2e2",
            color: "#b91c1c",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            borderRadius: 999,
            fontFamily: ui,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: colors.red500,
              opacity: 0.5 + 0.5 * Math.abs(Math.sin(frame / 6)),
            }}
          />
          Agent · reading
        </span>
        <span
          style={{
            fontFamily: ui,
            fontSize: 12,
            fontWeight: 600,
            color: colors.gray700,
          }}
        >
          San Francisco · Item 14 transcript
        </span>
      </div>

      {/* Transcript panel */}
      <div
        style={{
          position: "absolute",
          left: 110,
          width: 580,
          top: 80,
          height: 510,
          background: "white",
          border: `1px solid ${colors.gray200}`,
          borderRadius: 14,
          overflow: "hidden",
          opacity: panelIn,
          transform: `translateY(${(1 - panelIn) * 12}px)`,
          boxShadow: "0 10px 30px -14px rgba(0,0,0,0.12)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 12%, rgba(255,255,255,0) 88%, rgba(255,255,255,1) 100%)",
            zIndex: 5,
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 24,
            left: 22,
            right: 22,
            transform: `translateY(${-scroll}px)`,
          }}
        >
          {TRANSCRIPT.map((line, i) => {
            const isH1 = i === HIGHLIGHT_INDEXES[0];
            const isH2 = i === HIGHLIGHT_INDEXES[1];
            const sweep = isH1 ? sweep1 : isH2 ? sweep2 : 0;
            const collapseOut = isH1 || isH2 ? collapse : 0;

            return (
              <div
                key={i}
                style={{
                  position: "relative",
                  height: LINE_HEIGHT,
                  paddingLeft: 10,
                  display: "flex",
                  alignItems: "center",
                  opacity: 1 - collapseOut,
                  transform: `translateY(${collapseOut * (isH1 ? 60 : 24)}px) scale(${1 - collapseOut * 0.05})`,
                }}
              >
                {(isH1 || isH2) && (
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 4,
                      bottom: 4,
                      width: `${sweep * 100}%`,
                      background: "rgba(254, 202, 202, 0.55)",
                      borderLeft: `3px solid ${colors.red500}`,
                      borderRadius: 3,
                      zIndex: 0,
                    }}
                  />
                )}
                <div style={{ position: "relative", zIndex: 1 }}>
                  <span
                    style={{
                      fontFamily: ui,
                      fontSize: 11,
                      fontWeight: 700,
                      color: colors.meta,
                      marginRight: 8,
                    }}
                  >
                    {line.speaker}
                  </span>
                  <span
                    style={{
                      fontFamily: ui,
                      fontSize: 13,
                      color: colors.gray900,
                      fontWeight: (isH1 || isH2) && sweep > 0.6 ? 600 : 400,
                    }}
                  >
                    {line.text}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monday brief panel */}
      <div
        style={{
          position: "absolute",
          right: 110,
          width: 360,
          top: 80,
          background: "white",
          border: `1px solid ${colors.gray200}`,
          borderRadius: 14,
          padding: 22,
          boxShadow: "0 10px 30px -14px rgba(0,0,0,0.10)",
          opacity: briefIn,
          transform: `translateY(${(1 - briefIn) * 12}px)`,
        }}
      >
        <div
          style={{
            fontFamily: ui,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: colors.red500,
            marginBottom: 6,
          }}
        >
          Monday Brief
        </div>
        <div
          style={{
            fontFamily: display,
            fontSize: 18,
            fontWeight: 700,
            color: colors.gray900,
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}
        >
          San Francisco · This week
        </div>
        <div
          style={{
            marginTop: 16,
            paddingTop: 14,
            borderTop: `1px solid ${colors.borderSoft}`,
            minHeight: 140,
          }}
        >
          <div
            style={{
              opacity: bulletDrop,
              transform: `translateY(${(1 - bulletDrop) * 18}px)`,
              display: "flex",
              gap: 10,
            }}
          >
            <span
              style={{
                marginTop: 7,
                width: 5,
                height: 5,
                borderRadius: 999,
                background: colors.red500,
                flexShrink: 0,
              }}
            />
            <div>
              <div
                style={{
                  fontFamily: ui,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: colors.meta,
                  marginBottom: 4,
                }}
              >
                Economy & Housing
              </div>
              <div
                style={{
                  fontFamily: ui,
                  fontSize: 13,
                  fontWeight: 600,
                  color: colors.gray900,
                  lineHeight: 1.35,
                }}
              >
                Supervisors send $300M affordable housing bond to November
                ballot, 9–2.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Caption */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 50,
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
          Tracking every vote. Reading every bill.
        </p>
      </div>
    </AbsoluteFill>
  );
};
