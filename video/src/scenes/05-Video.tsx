import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  staticFile,
  Sequence,
} from "remotion";
import { Video } from "@remotion/media";
import { colors, ease } from "../tokens";
import { display, ui } from "../fonts";

// 3-second scene (90 frames). A short live-footage moment.
//   0- 14  frame mounts
//  10- 90  video plays + scanner sweeps
//  18- 90  caption: "Watch every meeting."
//
// Annotations pop briefly to reinforce "agent watching"

type Annotation = {
  text: string;
  x: number;
  y: number;
  start: number;
  end: number;
};

const ANNOTATIONS: Annotation[] = [
  { text: "VOTE DETECTED · 9–2", x: 8, y: 14, start: 18, end: 70 },
  { text: "SPEAKER · Sup. Chan", x: 56, y: 70, start: 38, end: 88 },
];

export const VideoScene: React.FC = () => {
  const frame = useCurrentFrame();

  const mountIn = interpolate(frame, [0, 14], [0, 1], {
    easing: ease.enterCrisp,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const captionIn = interpolate(frame, [12, 30], [0, 1], {
    easing: ease.enterCrisp,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scannerCycle = (frame % 60) / 60;
  const scannerY = scannerCycle * 100;
  const scannerOpacity = Math.sin(scannerCycle * Math.PI) * 0.6 * mountIn;

  return (
    <AbsoluteFill
      style={{
        background: "#08080a",
        fontFamily: display,
      }}
    >
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(239,68,68,0.2) 0%, rgba(8,8,10,0) 60%)",
          opacity: mountIn,
        }}
      />

      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: 30,
          left: 0,
          right: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          opacity: mountIn,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "5px 11px",
            background: "rgba(239, 68, 68, 0.18)",
            color: "#fca5a5",
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
              boxShadow: `0 0 8px ${colors.red500}`,
              opacity: 0.5 + 0.5 * Math.abs(Math.sin(frame / 6)),
            }}
          />
          Agent · watching
        </span>
        <span
          style={{
            fontFamily: ui,
            fontSize: 12,
            fontWeight: 600,
            color: "rgba(255,255,255,0.66)",
          }}
        >
          San Francisco · Board of Supervisors
        </span>
      </div>

      {/* Video frame */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 80,
          width: 880,
          height: 495,
          marginLeft: -440,
          borderRadius: 14,
          overflow: "hidden",
          opacity: mountIn,
          transform: `translateY(${(1 - mountIn) * 12}px) scale(${0.97 + mountIn * 0.03})`,
          boxShadow:
            "0 0 0 1px rgba(239,68,68,0.45), 0 24px 80px -20px rgba(239,68,68,0.45), 0 12px 40px -10px rgba(0,0,0,0.6)",
        }}
      >
        <Sequence from={0}>
          <Video
            src={staticFile("sf-gov.mp4")}
            trimBefore={120}
            trimAfter={210}
            volume={0}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "saturate(0.85) contrast(1.05)",
            }}
          />
        </Sequence>

        {/* Scanner */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${scannerY}%`,
            height: 2,
            background:
              "linear-gradient(90deg, rgba(239,68,68,0) 0%, rgba(239,68,68,0.9) 50%, rgba(239,68,68,0) 100%)",
            boxShadow: "0 0 18px rgba(239,68,68,0.6)",
            opacity: scannerOpacity,
            pointerEvents: "none",
          }}
        />

        <Reticle position="tl" opacity={mountIn} />
        <Reticle position="tr" opacity={mountIn} />
        <Reticle position="bl" opacity={mountIn} />
        <Reticle position="br" opacity={mountIn} />

        {ANNOTATIONS.map((a, i) => {
          const aIn = interpolate(frame, [a.start, a.start + 8], [0, 1], {
            easing: ease.pop,
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const aOut = interpolate(frame, [a.end - 8, a.end], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const op = aIn * aOut;
          if (op <= 0) return null;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${a.x}%`,
                top: `${a.y}%`,
                opacity: op,
                transform: `translateY(${(1 - aIn) * 6}px) scale(${0.92 + aIn * 0.08})`,
              }}
            >
              <AnnotationPill text={a.text} />
            </div>
          );
        })}

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,0.45) 100%)",
            pointerEvents: "none",
          }}
        />
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
            fontSize: 40,
            fontWeight: 800,
            letterSpacing: "-0.025em",
            color: "white",
            margin: 0,
            textShadow: "0 2px 16px rgba(0,0,0,0.6)",
          }}
        >
          Watching every meeting.
        </p>
      </div>
    </AbsoluteFill>
  );
};

const Reticle: React.FC<{
  position: "tl" | "tr" | "bl" | "br";
  opacity: number;
}> = ({ position, opacity }) => {
  const placement: Record<string, React.CSSProperties> = {
    tl: { top: 12, left: 12, transform: "rotate(0deg)" },
    tr: { top: 12, right: 12, transform: "rotate(90deg)" },
    bl: { bottom: 12, left: 12, transform: "rotate(-90deg)" },
    br: { bottom: 12, right: 12, transform: "rotate(180deg)" },
  };
  return (
    <div
      style={{
        position: "absolute",
        width: 22,
        height: 22,
        opacity: opacity * 0.85,
        ...placement[position],
      }}
    >
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M 1 1 L 1 8 M 1 1 L 8 1"
          stroke={colors.red500}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

const AnnotationPill: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "5px 10px",
      background: "rgba(8, 8, 10, 0.85)",
      border: "1px solid rgba(239, 68, 68, 0.55)",
      borderRadius: 6,
      fontFamily: ui,
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: "#fca5a5",
      whiteSpace: "nowrap",
      boxShadow: "0 6px 18px -10px rgba(239,68,68,0.5)",
    }}
  >
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 14,
        height: 14,
        borderRadius: 999,
        background: colors.red500,
        color: "white",
        fontSize: 9,
        fontWeight: 900,
      }}
    >
      ✓
    </span>
    {text}
  </div>
);
