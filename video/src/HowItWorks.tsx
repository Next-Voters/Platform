import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Sources } from "./scenes/how-it-works/01-Sources";
import { Extracts } from "./scenes/how-it-works/02-Extracts";
import { Writes } from "./scenes/how-it-works/03-Writes";
import { AgentCursor, type Waypoint } from "./components/AgentCursor";

// 17-second explainer (510 frames @ 30fps, 1280×720).
//   0-180   1 · Browse + watch (Google → SF.gov → meeting)         6s
// 180-330   2 · Extract (Key Decisions emerges)                     5s
// 330-510   3 · Write + Send (compose + click Send + email flies)   6s
export const HOW_IT_WORKS: {
  duration: number;
  fps: number;
  width: number;
  height: number;
} = {
  duration: 510,
  fps: 30,
  width: 1280,
  height: 720,
};

const WAYPOINTS: Waypoint[] = [
  // Beat 1 — Browser flow
  { t: 0, x: 1240, y: 280 },
  { t: 24, x: 360, y: 238, busy: true },
  { t: 42, x: 360, y: 238, busy: true, click: true },
  { t: 56, x: 360, y: 238 },
  { t: 72, x: 640, y: 350 },
  { t: 96, x: 220, y: 470, busy: true },
  { t: 104, x: 220, y: 470, busy: true, click: true },
  { t: 120, x: 640, y: 350 },
  { t: 178, x: 640, y: 350 },

  // Beat 2 — Extract
  { t: 196, x: 480, y: 250, busy: true },
  { t: 224, x: 480, y: 318, busy: true },
  { t: 252, x: 480, y: 388, busy: true },
  { t: 274, x: 700, y: 480 },
  { t: 328, x: 700, y: 480 },

  // Beat 3 — Write (topics), then Send click, then email fly
  { t: 346, x: 480, y: 250, busy: true },
  { t: 372, x: 480, y: 380, busy: true },
  { t: 398, x: 480, y: 440, busy: true },
  { t: 424, x: 480, y: 500, busy: true },
  { t: 438, x: 380, y: 540 },
  { t: 452, x: 320, y: 537, busy: true },
  { t: 458, x: 320, y: 537, busy: true, click: true },
  { t: 488, x: 320, y: 537 },
  { t: 510, x: 320, y: 537 },
];

function beatOpacity(
  frame: number,
  start: number,
  fadeInEnd: number,
  fadeOutStart: number,
  end: number
): number {
  if (frame < start) return 0;
  if (frame > end) return 0;
  const fadeIn =
    fadeInEnd > start
      ? interpolate(frame, [start, fadeInEnd], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;
  const fadeOut =
    end > fadeOutStart
      ? interpolate(frame, [fadeOutStart, end], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;
  return fadeIn * fadeOut;
}

export const HowItWorks: React.FC = () => {
  const frame = useCurrentFrame();

  const op1 = beatOpacity(frame, 0, 0, 175, 185);
  const op2 = beatOpacity(frame, 180, 192, 320, 332);
  const op3 = beatOpacity(frame, 330, 342, 500, 510);

  return (
    <AbsoluteFill style={{ background: "#ffffff" }}>
      {op1 > 0 && <Sources opacity={op1} localFrame={frame - 0} />}
      {op2 > 0 && <Extracts opacity={op2} localFrame={frame - 180} />}
      {op3 > 0 && <Writes opacity={op3} localFrame={frame - 330} />}
      <AgentCursor waypoints={WAYPOINTS} />
    </AbsoluteFill>
  );
};
