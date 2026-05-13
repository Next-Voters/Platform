import { AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig } from "remotion";
import { colors, ease } from "../tokens";
import { display } from "../fonts";
import { Flood } from "../components/Flood";

// 5-second opener (150 frames @ 30fps).
//    0- 90  flood scrolling at full intensity from frame 0 (no fade-in)
//   90-130  flood blurs + fades, bg lightens
//  100-150  question fades in: "What if San Francisco politics fit in one email?"
export const FloodOpen: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const floodOut = interpolate(frame, [90, 130], [1, 0], {
    easing: ease.editorial,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const floodBlur = interpolate(frame, [90, 130], [0, 6], {
    easing: ease.editorial,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const lighten = interpolate(frame, [95, 135], [0, 1], {
    easing: ease.enterCrisp,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const questionIn = interpolate(frame, [100, 138], [0, 1], {
    easing: ease.enterCrisp,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "#0a0a0a", fontFamily: display }}>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg,#0a0a0a 0%,#1a1a1a 50%,#0a0a0a 100%)",
          opacity: 1 - lighten,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg,#ffffff 0%,#fff1f2 60%,#ffffff 100%)",
          opacity: lighten,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          filter: `blur(${floodBlur}px)`,
        }}
      >
        <Flood
          frame={frame}
          frameOffset={0}
          opacity={floodOut}
          canvasWidth={width}
          canvasHeight={height}
        />
      </div>

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0) 14%, rgba(10,10,10,0) 86%, rgba(10,10,10,0.95) 100%)",
          opacity: floodOut,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "50%",
          transform: `translateY(calc(-50% + ${(1 - questionIn) * 12}px))`,
          textAlign: "center",
          opacity: questionIn,
          padding: "0 80px",
          zIndex: 5,
        }}
      >
        <p
          style={{
            fontFamily: display,
            fontSize: 62,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.08,
            color: colors.gray900,
            margin: 0,
            maxWidth: 1100,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          What if San Francisco politics
          <br />
          fit in one email?
        </p>
      </div>
    </AbsoluteFill>
  );
};
