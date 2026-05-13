import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  useVideoConfig,
} from "remotion";
import { SFSkyline } from "../components/SFSkyline";
import { colors, ease } from "../tokens";
import { display, ui } from "../fonts";

// 3-second scene (90 frames). Sequence:
//    0- 18  background + skyline fade up
//   12- 36  "for San Francisco" headline drops in
//   22- 46  pitch sentence (bias-free, weekly, your region)
//   30- 58  cursor travels to Subscribe button
//   58- 70  button presses
//   70- 90  success state + hold
export const Subscribe: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const bgIn = interpolate(frame, [0, 18], [0, 1], {
    easing: ease.enterCrisp,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const headlineIn = interpolate(frame, [12, 36], [0, 1], {
    easing: ease.enterCrisp,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const pitchIn = interpolate(frame, [22, 46], [0, 1], {
    easing: ease.enterCrisp,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cursorProgress = interpolate(frame, [30, 58], [0, 1], {
    easing: ease.smoothIn,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ctaPress = interpolate(frame, [58, 66], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const successIn = interpolate(frame, [70, 86], [0, 1], {
    easing: ease.enterCrisp,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ctaCenterX = width / 2;
  const ctaCenterY = 480;

  const cursorStartX = width - 180;
  const cursorStartY = height - 100;
  const cursorX = cursorStartX + (ctaCenterX + 60 - cursorStartX) * cursorProgress;
  const cursorY = cursorStartY + (ctaCenterY + 14 - cursorStartY) * cursorProgress;

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(180deg,#fff 0%,#fff1f2 60%,#fff 100%)",
        fontFamily: display,
        opacity: bgIn,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: -20,
          opacity: 0.15,
          color: colors.ink,
        }}
      >
        <SFSkyline style={{ width: "100%", height: 280 }} />
      </div>

      {/* Headline */}
      <div
        style={{
          position: "absolute",
          top: 200,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: headlineIn,
          transform: `translateY(${(1 - headlineIn) * 16}px)`,
        }}
      >
        <p
          style={{
            fontFamily: ui,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: colors.red500,
            margin: 0,
          }}
        >
          Built for
        </p>
        <h1
          style={{
            fontFamily: display,
            fontSize: 96,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: colors.gray900,
            margin: "8px 0 0 0",
            lineHeight: 1,
          }}
        >
          San Francisco
        </h1>
      </div>

      {/* Pitch sentence */}
      <div
        style={{
          position: "absolute",
          top: 380,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: pitchIn,
          transform: `translateY(${(1 - pitchIn) * 8}px)`,
          padding: "0 64px",
        }}
      >
        <p
          style={{
            fontFamily: ui,
            fontSize: 19,
            fontWeight: 500,
            color: colors.gray700,
            margin: 0,
            lineHeight: 1.4,
            maxWidth: 760,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          A bias-free weekly email summarizing every government decision in your region.
        </p>
      </div>

      {/* Subscribe button */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: ctaCenterY - 30,
          display: "flex",
          justifyContent: "center",
          opacity: pitchIn,
          transform: `translateY(${(1 - pitchIn) * 12}px) scale(${1 - ctaPress * 0.04})`,
        }}
      >
        <button
          style={{
            background: successIn > 0.5 ? "#16a34a" : colors.red500,
            color: "white",
            fontFamily: ui,
            fontSize: 17,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "16px 44px",
            borderRadius: 12,
            border: "none",
            boxShadow: successIn > 0.5
              ? "0 8px 22px -8px rgba(22,163,74,0.55)"
              : "0 8px 22px -8px rgba(239,68,68,0.55)",
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            transition: "none",
          }}
        >
          {successIn > 0.5 ? (
            <>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 18,
                  height: 18,
                  borderRadius: 999,
                  background: "white",
                  color: "#16a34a",
                  fontSize: 11,
                  fontWeight: 900,
                }}
              >
                ✓
              </span>
              Subscribed
            </>
          ) : (
            "Subscribe"
          )}
        </button>
      </div>

      {/* Cursor */}
      <div
        style={{
          position: "absolute",
          left: cursorX,
          top: cursorY,
          width: 22,
          height: 22,
          pointerEvents: "none",
          opacity: 1 - successIn,
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.25))",
        }}
      >
        <svg viewBox="0 0 24 24" fill="black" stroke="white" strokeWidth="1.5">
          <path d="M 4 2 L 4 18 L 8 14 L 11 21 L 14 19.5 L 11 13 L 17 13 Z" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
