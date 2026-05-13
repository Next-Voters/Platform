import { AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig } from "remotion";
import { colors, ease } from "../tokens";
import { display, ui, gmail } from "../fonts";
import { Flood } from "../components/Flood";

// 6-second outro (180 frames @ 30fps).
//    0- 30  flood scrolls (callback to opener) — starts at full intensity
//   30- 75  flood warps inward — cards converge to center, shrink
//   55- 95  email card materializes from the convergence point
//   95-130  email expands fully, hold
//  110-160  "Subscribe now at NextVoters.com" caption
//  130-180  "Free · Nonpartisan · Cited" footer + final hold
export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const warp = interpolate(frame, [30, 75], [0, 1], {
    easing: ease.editorial,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const emailIn = interpolate(frame, [55, 95], [0, 1], {
    easing: ease.pop,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const lighten = interpolate(frame, [50, 90], [0, 1], {
    easing: ease.enterCrisp,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const captionIn = interpolate(frame, [110, 138], [0, 1], {
    easing: ease.enterCrisp,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const urlIn = interpolate(frame, [130, 156], [0, 1], {
    easing: ease.enterCrisp,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Email card sits a bit above center to leave room for caption
  const emailCenterX = width / 2;
  const emailCenterY = height / 2 - 40;

  return (
    <AbsoluteFill style={{ background: "#0a0a0a", fontFamily: display }}>
      {/* Dark bg fades to light as warp resolves */}
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

      {/* Flood with warp — starts at full intensity, no fade-in */}
      <Flood
        frame={frame}
        frameOffset={0}
        opacity={1}
        canvasWidth={width}
        canvasHeight={height}
        warp={{ progress: warp, x: emailCenterX, y: emailCenterY }}
      />

      {/* Vignette only while flood is dark */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0) 14%, rgba(10,10,10,0) 86%, rgba(10,10,10,0.95) 100%)",
          opacity: 1 - lighten,
          pointerEvents: "none",
        }}
      />

      {/* Glow burst at warp point as cards converge */}
      <div
        style={{
          position: "absolute",
          left: emailCenterX,
          top: emailCenterY,
          width: 4,
          height: 4,
          marginLeft: -2,
          marginTop: -2,
          background: colors.red500,
          borderRadius: 999,
          opacity: warp * (1 - emailIn),
          boxShadow: `0 0 ${20 + warp * 80}px ${10 + warp * 40}px rgba(239,68,68,${0.5 * warp})`,
        }}
      />

      {/* Email card materializes */}
      <EmailMini
        opacity={emailIn}
        scale={0.6 + emailIn * 0.4}
        centerX={emailCenterX}
        centerY={emailCenterY}
      />

      {/* Subscribe caption */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 110,
          textAlign: "center",
          opacity: captionIn,
          transform: `translateY(${(1 - captionIn) * 10}px)`,
        }}
      >
        <p
          style={{
            fontFamily: display,
            fontSize: 38,
            fontWeight: 800,
            letterSpacing: "-0.025em",
            color: colors.gray900,
            margin: 0,
          }}
        >
          Subscribe now at{" "}
          <span style={{ color: colors.red500 }}>NextVoters.com</span>
        </p>
      </div>

      {/* URL accent */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 64,
          textAlign: "center",
          opacity: urlIn,
        }}
      >
        <p
          style={{
            fontFamily: ui,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: colors.meta,
            margin: 0,
          }}
        >
          Free · Nonpartisan · Cited
        </p>
      </div>
    </AbsoluteFill>
  );
};

// Compact email card preview that pops in at the warp point.
const EmailMini: React.FC<{
  opacity: number;
  scale: number;
  centerX: number;
  centerY: number;
}> = ({ opacity, scale, centerX, centerY }) => {
  const cardWidth = 540;
  const cardHeight = 320;
  return (
    <div
      style={{
        position: "absolute",
        left: centerX - cardWidth / 2,
        top: centerY - cardHeight / 2,
        width: cardWidth,
        height: cardHeight,
        background: "white",
        border: `1px solid ${colors.border}`,
        borderRadius: 14,
        boxShadow:
          "0 24px 60px -12px rgba(239,68,68,0.25), 0 12px 36px -10px rgba(0,0,0,0.18)",
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: "center",
        overflow: "hidden",
        fontFamily: gmail,
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          height: 32,
          borderBottom: `1px solid ${colors.borderSoft}`,
          display: "flex",
          alignItems: "center",
          padding: "0 8px",
          gap: 4,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: i === 0 ? "#ff5f57" : i === 1 ? "#febc2e" : "#28c840",
            }}
          />
        ))}
      </div>

      {/* Subject */}
      <div
        style={{
          padding: "16px 24px 6px",
          fontFamily: gmail,
          fontSize: 17,
          fontWeight: 600,
          color: colors.body,
          letterSpacing: "-0.01em",
        }}
      >
        Your San Francisco brief — every government decision this week
      </div>

      {/* Sender */}
      <div
        style={{
          padding: "0 24px 12px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderBottom: `1px solid ${colors.borderSoft}`,
          paddingBottom: 12,
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 999,
            background: "#1a73e8",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          N
        </div>
        <div>
          <span
            style={{
              fontFamily: gmail,
              fontSize: 12,
              fontWeight: 700,
              color: colors.body,
            }}
          >
            Next Voters
          </span>
          <span
            style={{
              fontFamily: gmail,
              fontSize: 11,
              color: colors.meta,
              marginLeft: 4,
            }}
          >
            · Mon, 7:00 AM
          </span>
        </div>
      </div>

      {/* Topic preview */}
      <div style={{ padding: "16px 24px" }}>
        <div
          style={{
            fontFamily: ui,
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: colors.body,
            marginBottom: 6,
          }}
        >
          Economy & Housing
        </div>
        <div
          style={{
            fontFamily: gmail,
            fontSize: 13,
            fontWeight: 700,
            color: colors.body,
            lineHeight: 1.35,
            marginBottom: 12,
          }}
        >
          Supervisors send $300M housing bond to ballot, 9–2.
        </div>
        <div
          style={{
            fontFamily: ui,
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: colors.body,
            marginBottom: 6,
          }}
        >
          Civil Rights & Justice
        </div>
        <div
          style={{
            fontFamily: gmail,
            fontSize: 13,
            fontWeight: 700,
            color: colors.body,
            lineHeight: 1.35,
            marginBottom: 12,
          }}
        >
          Pretextual traffic stops banned — first such rule in California.
        </div>
        <div
          style={{
            fontFamily: ui,
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: colors.body,
            marginBottom: 6,
          }}
        >
          Transit & Infrastructure
        </div>
        <div
          style={{
            fontFamily: gmail,
            fontSize: 13,
            fontWeight: 700,
            color: colors.body,
            lineHeight: 1.35,
          }}
        >
          Muni Metro adds 18% more frequency on L-Taraval and N-Judah.
        </div>
      </div>
    </div>
  );
};
