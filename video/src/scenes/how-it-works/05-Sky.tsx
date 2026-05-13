import { interpolate, useVideoConfig } from "remotion";
import { ease } from "../../tokens";

type SkyProps = {
  opacity: number;
  localFrame: number;
};

const NUM_ENVELOPES = 70;

// Buildings: tile a wide city across ~2× canvas width so we can pan
// continuously without seams. We'll position them in screen space
// and then translate the whole group horizontally over time.
type Building = {
  x: number; // x position within the city strip
  width: number;
  height: number;
};

const BUILDINGS: Building[] = [
  { x: 0, width: 90, height: 160 },
  { x: 90, width: 70, height: 220 },
  { x: 160, width: 95, height: 145 },
  { x: 255, width: 75, height: 250 },
  { x: 330, width: 85, height: 175 },
  { x: 415, width: 100, height: 195 },
  { x: 515, width: 70, height: 235 },
  { x: 585, width: 90, height: 160 },
  { x: 675, width: 80, height: 210 },
  { x: 755, width: 95, height: 175 },
  { x: 850, width: 70, height: 245 },
  { x: 920, width: 85, height: 165 },
  { x: 1005, width: 100, height: 200 },
  { x: 1105, width: 70, height: 230 },
  { x: 1175, width: 90, height: 165 },
  { x: 1265, width: 80, height: 195 },
  { x: 1345, width: 95, height: 240 },
  { x: 1440, width: 70, height: 175 },
  { x: 1510, width: 90, height: 210 },
  { x: 1600, width: 85, height: 150 },
  { x: 1685, width: 100, height: 225 },
  { x: 1785, width: 75, height: 180 },
  { x: 1860, width: 90, height: 200 },
  { x: 1950, width: 80, height: 235 },
  { x: 2030, width: 95, height: 160 },
  { x: 2125, width: 70, height: 215 },
  { x: 2195, width: 90, height: 170 },
  { x: 2285, width: 100, height: 240 },
  { x: 2385, width: 70, height: 165 },
  { x: 2455, width: 90, height: 200 },
];
const CITY_WIDTH = BUILDINGS[BUILDINGS.length - 1].x + BUILDINGS[BUILDINGS.length - 1].width;

// Pan speed: ~7 px per frame ≈ 210 px/s. City wraps after CITY_WIDTH.
const PAN_SPEED = 7;
const CITY_AREA_HEIGHT = 280; // bottom 280px of canvas

// Each envelope targets a window in a specific building.
type EnvelopeDescriptor = {
  spawnFrame: number;
  startX: number;
  speed: number;
  baseRotation: number;
  rotSpin: number;
  targetBuildingIdx: number;
  targetWindowYOffset: number; // 0 to 1, fraction up the building
  catchAt: number; // frame at which envelope reaches building
  size: number;
};

function makeEnvelopes(): EnvelopeDescriptor[] {
  const envs: EnvelopeDescriptor[] = [];
  for (let i = 0; i < NUM_ENVELOPES; i++) {
    const spawnFrame = (i * 3) % 110;
    const startX = ((i * 137) % 1180) + 50;
    const speed = 4.5 + ((i * 31) % 7) * 0.4;
    const baseRotation = ((i * 73) % 36) - 18;
    const rotSpin = (((i * 17) % 5) - 2) * 0.18;
    const targetBuildingIdx = (i * 7) % BUILDINGS.length;
    const targetWindowYOffset = 0.25 + ((i * 23) % 50) / 100; // 0.25 – 0.75
    const catchAt = spawnFrame + 38 + ((i * 11) % 25);
    const size = 0.85 + ((i * 19) % 7) * 0.04;
    envs.push({
      spawnFrame,
      startX,
      speed,
      baseRotation,
      rotSpin,
      targetBuildingIdx,
      targetWindowYOffset,
      catchAt,
      size,
    });
  }
  return envs;
}

const ENVELOPES = makeEnvelopes();

// Returns the visible canvas x for a given building at the current frame,
// accounting for horizontal pan and wrapping the strip seamlessly.
function buildingScreenX(
  baseX: number,
  frame: number,
  canvasWidth: number
): number {
  // City moves leftward; raw offset is negative
  const rawX = baseX - frame * PAN_SPEED;
  // Wrap so building reappears after going off-screen left
  const range = CITY_WIDTH;
  const wrapped = ((rawX % range) + range) % range;
  // Now wrapped is in [0, CITY_WIDTH). If > canvasWidth, building is off-screen right
  // (will scroll into view as frame advances). If small, it's visible.
  // To allow buildings to span left of x=0, shift so range maps to [-CITY_WIDTH/2 ... CITY_WIDTH/2]
  // But easier: just render two copies (offset by CITY_WIDTH) so the seam is invisible.
  return wrapped - (wrapped > canvasWidth ? range : 0);
}

// 5-second scene (150 frames @ 30fps).
//    0- 30  sky fades in, city slides into view from right
//   30-130  envelopes fly into building windows
//  120-150  whole scene fades to pure white
export const Sky: React.FC<SkyProps> = ({ opacity, localFrame }) => {
  const { width } = useVideoConfig();

  const skyIn = interpolate(localFrame, [0, 28], [0, 1], {
    easing: ease.enterCrisp,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const buildingRise = interpolate(localFrame, [0, 28], [0, 1], {
    easing: ease.enterCrisp,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const endFade = interpolate(localFrame, [120, 150], [0, 1], {
    easing: ease.editorial,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity,
      }}
    >
      {/* Pure white base */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#ffffff",
        }}
      />

      {/* Sky gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, #a7c4eb 0%, #fbcfd4 45%, #ffe0bf 75%, #fff5d6 100%)",
          opacity: skyIn * (1 - endFade),
        }}
      />

      {/* Soft sun glow at top-right */}
      <div
        style={{
          position: "absolute",
          left: width - 320,
          top: 40,
          width: 320,
          height: 320,
          background:
            "radial-gradient(circle, rgba(255,240,200,0.75) 0%, rgba(255,240,200,0) 70%)",
          opacity: skyIn * (1 - endFade),
        }}
      />

      {/* City panning */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: CITY_AREA_HEIGHT,
          overflow: "hidden",
          pointerEvents: "none",
          opacity: 1 - endFade,
        }}
      >
        {/* Render two copies of the city strip, side by side, so panning wraps seamlessly */}
        {[0, 1].map((copyIdx) => {
          const baseShift = -((localFrame * PAN_SPEED) % CITY_WIDTH);
          const copyOffset = copyIdx * CITY_WIDTH;
          return (
            <div
              key={copyIdx}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: CITY_WIDTH,
                height: CITY_AREA_HEIGHT,
                transform: `translateX(${baseShift + copyOffset}px)`,
              }}
            >
              {BUILDINGS.map((b, bi) => {
                const baseTop = CITY_AREA_HEIGHT - b.height;
                const riseOffset = (1 - buildingRise) * (b.height + 20);
                return (
                  <div
                    key={bi}
                    style={{
                      position: "absolute",
                      left: b.x,
                      top: baseTop + riseOffset,
                      width: b.width,
                      height: b.height,
                      background: "#1c1c30",
                      borderRadius: "2px 2px 0 0",
                    }}
                  >
                    <BuildingWindows
                      building={b}
                      buildingIndex={bi + copyIdx * BUILDINGS.length}
                      frame={localFrame}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Envelopes — falling into buildings */}
      <div style={{ opacity: 1 - endFade }}>
        {ENVELOPES.map((env, i) => {
          const age = localFrame - env.spawnFrame;
          if (age < 0) return null;
          const catchAge = env.catchAt - env.spawnFrame;
          if (age > catchAge + 14) return null;

          // Determine target position (window in building, accounting for city pan)
          const target = BUILDINGS[env.targetBuildingIdx];
          const targetScreenX = buildingScreenX(
            target.x + target.width / 2,
            localFrame,
            width
          );
          const targetY =
            720 -
            CITY_AREA_HEIGHT +
            (CITY_AREA_HEIGHT - target.height) +
            target.height * env.targetWindowYOffset;

          // Trajectory: starts in sky, ends at building window
          const catchProgress = Math.min(1, age / Math.max(1, catchAge));
          const fallStartX = env.startX;
          const fallStartY = -50;
          const fallEndY = targetY;
          // Linear/ease toward target
          const eased = catchProgress * (2 - catchProgress); // ease-out
          const x = fallStartX + (targetScreenX - fallStartX) * eased;
          const y = fallStartY + (fallEndY - fallStartY) * eased;
          const rotation = env.baseRotation + age * env.rotSpin * (1 - catchProgress * 0.7);
          let scale = env.size * (1 - catchProgress * 0.35);
          let envOpacity = 1;

          if (age >= catchAge) {
            const sparkleAge = age - catchAge;
            envOpacity = 1 - sparkleAge / 14;
            scale = scale * (1 + sparkleAge * 0.08);
          }

          return (
            <Envelope
              key={i}
              x={x}
              y={y}
              rotation={rotation}
              scale={scale}
              opacity={envOpacity}
            />
          );
        })}

        {/* Window-light sparkles where envelopes land */}
        {ENVELOPES.map((env, i) => {
          const age = localFrame - env.spawnFrame;
          const catchAge = env.catchAt - env.spawnFrame;
          if (age < catchAge || age > catchAge + 16) return null;
          const target = BUILDINGS[env.targetBuildingIdx];
          const targetScreenX = buildingScreenX(
            target.x + target.width / 2,
            localFrame,
            width
          );
          const targetY =
            720 -
            CITY_AREA_HEIGHT +
            (CITY_AREA_HEIGHT - target.height) +
            target.height * env.targetWindowYOffset;
          const sparkleAge = age - catchAge;
          return (
            <Sparkle
              key={`s-${i}`}
              x={targetScreenX}
              y={targetY}
              age={sparkleAge}
            />
          );
        })}
      </div>

      {/* Final fade to pure white */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#ffffff",
          opacity: endFade,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────

const BuildingWindows: React.FC<{
  building: Building;
  buildingIndex: number;
  frame: number;
}> = ({ building, buildingIndex, frame }) => {
  const cols = Math.max(2, Math.floor(building.width / 14));
  const rows = Math.max(3, Math.floor((building.height - 8) / 18));
  const cellW = building.width / cols;
  const cellH = (building.height - 8) / rows;
  const windows = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const noise = Math.sin(r * 4.1 + c * 2.7 + buildingIndex * 1.31);
      if (noise > 0.55) continue;
      const lightDelay = 18 + (noise * 0.5 + 0.5) * 40;
      const lightAmt = interpolate(
        frame,
        [lightDelay, lightDelay + 10],
        [0, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      );
      const flicker = 0.7 + 0.3 * Math.abs(Math.sin((frame + r * 3 + c) / 9));
      windows.push(
        <div
          key={`${r}-${c}`}
          style={{
            position: "absolute",
            left: c * cellW + cellW * 0.22,
            top: r * cellH + cellH * 0.22 + 4,
            width: cellW * 0.5,
            height: cellH * 0.45,
            background: `rgba(255, 218, 130, ${lightAmt * flicker * 0.95})`,
            borderRadius: 1,
            boxShadow:
              lightAmt > 0.5
                ? `0 0 6px rgba(255, 200, 90, ${lightAmt * 0.5})`
                : undefined,
          }}
        />
      );
    }
  }
  return <>{windows}</>;
};

const Envelope: React.FC<{
  x: number;
  y: number;
  rotation: number;
  scale: number;
  opacity: number;
}> = ({ x, y, rotation, scale, opacity }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: 0,
      height: 0,
      transform: `rotate(${rotation}deg) scale(${scale})`,
      opacity,
      pointerEvents: "none",
    }}
  >
    <div
      style={{
        position: "absolute",
        left: -28,
        top: -20,
        width: 56,
        height: 40,
        filter:
          "drop-shadow(0 6px 14px rgba(30, 30, 60, 0.25)) drop-shadow(0 2px 4px rgba(0,0,0,0.15))",
      }}
    >
      <svg width="56" height="40" viewBox="0 0 56 40">
        <rect
          x="0.5"
          y="0.5"
          width="55"
          height="39"
          rx="3"
          fill="#ffffff"
          stroke="#d9dde6"
          strokeWidth="1"
        />
        <path
          d="M 0.5 0.5 L 28 22 L 55.5 0.5"
          fill="none"
          stroke="#c9ced9"
          strokeWidth="1"
        />
        <path
          d="M 0.5 0.5 L 28 22 L 55.5 0.5 L 55.5 4 L 28 24 L 0.5 4 Z"
          fill="rgba(220, 224, 232, 0.5)"
        />
        <circle cx="28" cy="30" r="3.4" fill="#ef4444" />
      </svg>
    </div>
  </div>
);

const Sparkle: React.FC<{ x: number; y: number; age: number }> = ({
  x,
  y,
  age,
}) => {
  const scale = interpolate(age, [0, 16], [0.3, 1.8], {
    easing: ease.editorial,
    extrapolateRight: "clamp",
  });
  const op = interpolate(age, [0, 16], [0.95, 0], {
    extrapolateRight: "clamp",
  });
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x - 22,
          top: y - 22,
          width: 44,
          height: 44,
          borderRadius: 999,
          background: `radial-gradient(circle, rgba(255,235,170,0.95) 0%, rgba(255,218,130,0.5) 40%, rgba(255,218,130,0) 80%)`,
          transform: `scale(${scale})`,
          opacity: op,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x - 5,
          top: y - 5,
          width: 10,
          height: 10,
          borderRadius: 2,
          background: "rgba(255, 245, 200, 0.98)",
          boxShadow: "0 0 16px rgba(255, 218, 130, 0.85)",
          opacity: op,
          pointerEvents: "none",
        }}
      />
    </>
  );
};
