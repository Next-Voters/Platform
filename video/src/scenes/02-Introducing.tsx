import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { colors, ease } from "../tokens";
import { display, ui } from "../fonts";

// 2-second scene (60 frames). The "Introducing Next Voters" beat that
// pivots from problem (Scene 2) to product (Scene 4 onwards).
//    0- 14  background fades up
//   10- 30  eyebrow "INTRODUCING"
//   18- 44  giant "Next Voters" wordmark drops in
//   30- 60  underline sweep + hold
export const Introducing: React.FC = () => {
  const frame = useCurrentFrame();

  const bgIn = interpolate(frame, [0, 14], [0, 1], {
    easing: ease.enterCrisp,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const eyebrowIn = interpolate(frame, [10, 28], [0, 1], {
    easing: ease.enterCrisp,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const wordmarkIn = interpolate(frame, [18, 40], [0, 1], {
    easing: ease.enterCrisp,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const underline = interpolate(frame, [34, 56], [0, 100], {
    easing: ease.enterCrisp,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "#fafafa",
        fontFamily: display,
        opacity: bgIn,
      }}
    >
      {/* Soft red ambient light */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(254,226,226,0.5) 0%, rgba(255,255,255,0) 60%)",
        }}
      />

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontFamily: ui,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: colors.red500,
              margin: 0,
              opacity: eyebrowIn,
              transform: `translateY(${(1 - eyebrowIn) * 8}px)`,
            }}
          >
            Introducing
          </p>
          <h1
            style={{
              fontFamily: display,
              fontSize: 124,
              fontWeight: 800,
              letterSpacing: "-0.035em",
              lineHeight: 1,
              color: colors.gray900,
              margin: "20px 0 0 0",
              opacity: wordmarkIn,
              transform: `translateY(${(1 - wordmarkIn) * 18}px)`,
              position: "relative",
              display: "inline-block",
            }}
          >
            Next Voters
            <span
              style={{
                position: "absolute",
                left: 0,
                bottom: 6,
                height: 6,
                background: colors.red500,
                borderRadius: 3,
                width: `${underline}%`,
              }}
            />
          </h1>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
