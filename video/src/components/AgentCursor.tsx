import { useCurrentFrame, interpolate } from "remotion";
import { colors, ease } from "../tokens";

export type Waypoint = {
  t: number;
  x: number;
  y: number;
  /** Pulse + slight scale while approaching this waypoint. */
  busy?: boolean;
  /** Trigger a click ripple at this exact moment. */
  click?: boolean;
};

function smoothStep(t: number): number {
  return t * t * (3 - 2 * t);
}

export function cursorAt(frame: number, waypoints: Waypoint[]) {
  if (waypoints.length === 0) return { x: 0, y: 0, busy: false };
  if (frame <= waypoints[0].t) {
    return { x: waypoints[0].x, y: waypoints[0].y, busy: !!waypoints[0].busy };
  }
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    if (frame >= a.t && frame <= b.t) {
      const dur = b.t - a.t || 1;
      const eased = smoothStep((frame - a.t) / dur);
      return {
        x: a.x + (b.x - a.x) * eased,
        y: a.y + (b.y - a.y) * eased,
        busy: !!b.busy,
      };
    }
  }
  const last = waypoints[waypoints.length - 1];
  return { x: last.x, y: last.y, busy: !!last.busy };
}

type Props = {
  waypoints: Waypoint[];
};

const CURSOR_SIZE = 26;

export const AgentCursor: React.FC<Props> = ({ waypoints }) => {
  const frame = useCurrentFrame();
  const { x, y, busy } = cursorAt(frame, waypoints);

  // Click ring: active for ~14 frames after any waypoint with click:true
  const activeClick = waypoints.find(
    (w) => w.click && frame >= w.t && frame < w.t + 16
  );

  // Spawn-in
  const spawn = interpolate(frame, [0, 10], [0, 1], {
    easing: ease.pop,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const pressScale = busy ? 0.93 : 1;

  return (
    <>
      {activeClick && (
        <ClickRing
          x={activeClick.x}
          y={activeClick.y}
          age={frame - activeClick.t}
        />
      )}
      <Arrow x={x} y={y} opacity={spawn} scale={pressScale} primary />
    </>
  );
};

const Arrow: React.FC<{
  x: number;
  y: number;
  opacity: number;
  scale: number;
  primary?: boolean;
}> = ({ x, y, opacity, scale, primary }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: 0,
      height: 0,
      pointerEvents: "none",
      opacity,
      zIndex: 50,
      transform: `scale(${scale})`,
      transformOrigin: "top left",
      filter: primary
        ? "drop-shadow(0 2px 4px rgba(0,0,0,0.45)) drop-shadow(0 0 8px rgba(239,68,68,0.55))"
        : "drop-shadow(0 1px 2px rgba(0,0,0,0.25))",
    }}
  >
    <svg
      width={CURSOR_SIZE}
      height={CURSOR_SIZE}
      viewBox="0 0 24 24"
      style={{ display: "block" }}
    >
      <path
        d="M 4 2 L 4 18 L 8 14 L 11 21 L 14 19.5 L 11 13 L 17 13 Z"
        fill="#0a0a0a"
        stroke="#ffffff"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

const ClickRing: React.FC<{ x: number; y: number; age: number }> = ({
  x,
  y,
  age,
}) => {
  const scale = interpolate(age, [0, 16], [0.4, 1.8], {
    easing: ease.editorial,
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(age, [0, 16], [0.7, 0], {
    extrapolateRight: "clamp",
  });
  const size = 32;
  // Anchor at the tip of the arrow (which lives at top-left of cursor div)
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2 + 4,
        top: y - size / 2 + 6,
        width: size,
        height: size,
        borderRadius: 999,
        border: `2px solid ${colors.red500}`,
        boxShadow: "0 0 16px rgba(239,68,68,0.45)",
        opacity,
        transform: `scale(${scale})`,
        pointerEvents: "none",
        zIndex: 49,
      }}
    />
  );
};
