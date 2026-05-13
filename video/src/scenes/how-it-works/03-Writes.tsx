import { interpolate } from "remotion";
import { colors, ease } from "../../tokens";
import { display, ui, gmail } from "../../fonts";

const TOPICS: { label: string; headline: string }[] = [
  {
    label: "Economy & Housing",
    headline: "Supervisors send $300M housing bond to ballot, 9 to 2.",
  },
  {
    label: "Civil Rights & Justice",
    headline: "Pretextual traffic stops banned, the first in California.",
  },
  {
    label: "Transit & Infrastructure",
    headline: "Muni Metro adds 18% more frequency on L-Taraval and N-Judah.",
  },
];

const SUBJECT_TEXT = "Your San Francisco brief for Monday, May 13";

type WritesProps = {
  opacity: number;
  localFrame: number;
};

// Email compose: write the brief, then click Send, then the email flies off.
//    0- 14  compose window mounts
//   12- 40  subject typewriter
//   30- 48  recipient pill
//   42- 56  topic 1
//   60- 74  topic 2
//   78- 92  topic 3
//  108-118  Send button press
//  118-170  email card detaches and flies straight up off-screen
//  135-180  compose fades to white
export const Writes: React.FC<WritesProps> = ({ opacity, localFrame }) => {
  const composeIn = interpolate(localFrame, [0, 14], [0, 1], {
    easing: ease.enterCrisp,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subjectProgress = interpolate(localFrame, [12, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subjectChars = Math.floor(SUBJECT_TEXT.length * subjectProgress);

  const recipientIn = interpolate(localFrame, [30, 48], [0, 1], {
    easing: ease.enterCrisp,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const captionIn = interpolate(localFrame, [0, 18], [0, 1], {
    easing: ease.enterCrisp,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Send action
  const press = interpolate(localFrame, [108, 118], [0, 1], {
    easing: ease.editorial,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fly = interpolate(localFrame, [118, 170], [0, 1], {
    easing: ease.smoothIn,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const composeFade = interpolate(localFrame, [135, 180], [1, 0], {
    easing: ease.editorial,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Flying email card — straight up from compose center to off-screen top
  const cardStartX = 640;
  const cardStartY = 360;
  const cardX = cardStartX;
  const cardY = cardStartY - fly * 600;
  const cardScale = 1 - fly * 0.55;
  const cardOpacity = fly < 0.85 ? 1 : interpolate(fly, [0.85, 1], [1, 0]);

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
      {/* Compose window */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          marginLeft: -360,
          width: 720,
          top: 110,
          background: "white",
          border: `1px solid ${colors.border}`,
          borderRadius: 14,
          overflow: "hidden",
          boxShadow:
            "0 1px 2px rgba(60,64,67,0.08), 0 16px 40px -16px rgba(60,64,67,0.22)",
          opacity: composeIn * composeFade,
          transform: `translateY(${(1 - composeIn) * 14}px)`,
          fontFamily: gmail,
        }}
      >
        {/* Title bar */}
        <div
          style={{
            background: "#404040",
            color: "white",
            padding: "8px 16px",
            fontFamily: ui,
            fontSize: 12,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>New Message</span>
          <span style={{ opacity: 0.6 }}>_ ⤢ ×</span>
        </div>

        {/* To */}
        <div
          style={{
            padding: "8px 18px",
            borderBottom: `1px solid ${colors.borderSoft}`,
            display: "flex",
            alignItems: "center",
            gap: 8,
            opacity: recipientIn,
          }}
        >
          <span
            style={{
              fontFamily: gmail,
              fontSize: 12,
              color: colors.meta,
              minWidth: 50,
            }}
          >
            To
          </span>
          <span
            style={{
              fontFamily: gmail,
              fontSize: 12,
              color: colors.body,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "3px 10px",
              border: `1px solid ${colors.border}`,
              borderRadius: 999,
              background: "#f8f9fa",
            }}
          >
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: 999,
                background: colors.red500,
                color: "white",
                fontSize: 9,
                fontWeight: 800,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              SF
            </span>
            San Franciscan
          </span>
        </div>

        {/* Subject */}
        <div
          style={{
            padding: "10px 18px",
            borderBottom: `1px solid ${colors.borderSoft}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span
            style={{
              fontFamily: gmail,
              fontSize: 12,
              color: colors.meta,
              minWidth: 50,
            }}
          >
            Subject
          </span>
          <span
            style={{
              fontFamily: gmail,
              fontSize: 14,
              fontWeight: 500,
              color: colors.body,
            }}
          >
            {SUBJECT_TEXT.slice(0, subjectChars)}
            {subjectChars < SUBJECT_TEXT.length && (
              <span
                style={{
                  display: "inline-block",
                  width: 1.5,
                  height: 16,
                  background: colors.red500,
                  marginLeft: 1,
                  verticalAlign: "middle",
                  opacity: localFrame % 16 < 8 ? 1 : 0.2,
                }}
              />
            )}
          </span>
        </div>

        {/* Body */}
        <div
          style={{
            padding: "18px 24px 26px",
            minHeight: 240,
            fontFamily: gmail,
            color: colors.body,
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          <p style={{ margin: 0, opacity: recipientIn }}>
            Good morning, San Franciscan.
          </p>
          <p style={{ margin: "10px 0 0", opacity: recipientIn }}>
            Here&rsquo;s every decision your city, the state, and Congress made
            this week.
          </p>
          {TOPICS.map((topic, ti) => {
            const start = 42 + ti * 18;
            const reveal = interpolate(
              localFrame,
              [start, start + 14],
              [0, 1],
              {
                easing: ease.enterCrisp,
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }
            );
            return (
              <div
                key={ti}
                style={{
                  marginTop: 16,
                  opacity: reveal,
                  transform: `translateY(${(1 - reveal) * 8}px)`,
                }}
              >
                <div
                  style={{
                    fontFamily: ui,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: colors.body,
                    marginBottom: 4,
                  }}
                >
                  {topic.label}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: colors.body,
                    lineHeight: 1.4,
                  }}
                >
                  {topic.headline}
                </div>
              </div>
            );
          })}
        </div>

        {/* Send bar */}
        <div
          style={{
            padding: "10px 18px",
            borderTop: `1px solid ${colors.borderSoft}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              background: press > 0.5 ? colors.red700 : colors.red500,
              color: "white",
              fontFamily: ui,
              fontSize: 13,
              fontWeight: 700,
              padding: "8px 22px",
              borderRadius: 6,
              transform: `scale(${1 - press * 0.06})`,
              boxShadow:
                press > 0.5
                  ? "0 1px 2px rgba(239,68,68,0.4)"
                  : "0 6px 16px -8px rgba(239,68,68,0.5)",
            }}
          >
            Send
          </div>
          <span
            style={{
              fontFamily: ui,
              fontSize: 11,
              color: press > 0.7 ? "#16a34a" : colors.meta,
              fontWeight: press > 0.7 ? 700 : 500,
            }}
          >
            {press > 0.7 ? "✓ Sent" : "Scheduled · Monday 7:00 AM"}
          </span>
        </div>
      </div>

      {/* Flying email card — straight up off-screen after Send is clicked */}
      {fly > 0.001 && cardOpacity > 0.001 && (
        <div
          style={{
            position: "absolute",
            left: cardX,
            top: cardY,
            width: 320,
            marginLeft: -160,
            marginTop: -90,
            background: "white",
            border: `1px solid ${colors.gray200}`,
            borderRadius: 10,
            padding: 14,
            boxShadow:
              "0 0 0 1px rgba(239,68,68,0.25), 0 18px 44px -16px rgba(239,68,68,0.45)",
            fontFamily: gmail,
            opacity: cardOpacity,
            transform: `scale(${cardScale})`,
            transformOrigin: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: 999,
                background: "#1a73e8",
                color: "white",
                fontFamily: gmail,
                fontSize: 10,
                fontWeight: 500,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              N
            </span>
            <span
              style={{
                fontFamily: gmail,
                fontSize: 11,
                fontWeight: 700,
                color: colors.body,
              }}
            >
              Next Voters
            </span>
            <span
              style={{
                fontFamily: gmail,
                fontSize: 10,
                color: colors.meta,
                marginLeft: "auto",
              }}
            >
              Mon 7:00 AM
            </span>
          </div>
          <div
            style={{
              fontFamily: gmail,
              fontSize: 12,
              fontWeight: 700,
              color: colors.body,
            }}
          >
            Your San Francisco brief
          </div>
        </div>
      )}

      {/* Caption */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
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
            fontSize: 44,
            fontWeight: 800,
            letterSpacing: "-0.025em",
            color: colors.gray900,
            margin: 0,
          }}
        >
          And write your personal brief.
        </p>
      </div>
    </div>
  );
};
