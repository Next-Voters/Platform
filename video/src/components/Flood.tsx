import { colors } from "../tokens";
import { ui } from "../fonts";
import { FLOOD_HEADLINES, type FloodHeadline } from "../data/headlines";

const COLS = 4;
const COL_WIDTH = 280;
const COL_GAP = 16;
const CARD_HEIGHT = 56;
const CARD_GAP = 10;
const STRIDE = CARD_HEIGHT + CARD_GAP;
const CARDS_PER_COL = 14;
const COL_HEIGHT = CARDS_PER_COL * STRIDE;

const SPEEDS = [3.2, 4.0, 2.8, 3.6];
const PHASE_OFFSETS = [0, COL_HEIGHT * 0.25, COL_HEIGHT * 0.55, COL_HEIGHT * 0.8];

type FloodProps = {
  /** Frame at which flood begins scrolling. Cards start fading in here. */
  frameOffset: number;
  /** Current frame in the parent scene. */
  frame: number;
  /** Opacity multiplier for the whole flood (drives fade-in/out). */
  opacity: number;
  canvasWidth: number;
  canvasHeight: number;
  /**
   * Optional warp transform: cards converge to (warpX, warpY) and shrink.
   * `warp` in [0, 1]. At 1, all cards are collapsed to that point.
   */
  warp?: { progress: number; x: number; y: number };
};

export const Flood: React.FC<FloodProps> = ({
  frameOffset,
  frame,
  opacity,
  canvasWidth,
  canvasHeight,
  warp,
}) => {
  const startLeft =
    (canvasWidth - (COLS * COL_WIDTH + (COLS - 1) * COL_GAP)) / 2;

  const warpProgress = warp?.progress ?? 0;
  const warpX = warp?.x ?? canvasWidth / 2;
  const warpY = warp?.y ?? canvasHeight / 2;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        opacity,
        overflow: "hidden",
      }}
    >
      {Array.from({ length: COLS }).map((_, ci) => {
        const speed = SPEEDS[ci % SPEEDS.length];
        const phase = PHASE_OFFSETS[ci % PHASE_OFFSETS.length];
        const offset = (frame - frameOffset) * speed + phase;
        const ty = -(((offset % COL_HEIGHT) + COL_HEIGHT) % COL_HEIGHT);
        const colLeft = startLeft + ci * (COL_WIDTH + COL_GAP);
        const startSeed = ci * 7;

        return (
          <div
            key={ci}
            style={{
              position: "absolute",
              left: colLeft,
              top: 0,
              width: COL_WIDTH,
              height: canvasHeight,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: COL_WIDTH,
                height: COL_HEIGHT * 2,
                transform: `translateY(${ty}px)`,
              }}
            >
              {Array.from({ length: CARDS_PER_COL * 2 }).map((_, idx) => {
                const ri = idx % CARDS_PER_COL;
                const headlineIdx =
                  (startSeed + ri) % FLOOD_HEADLINES.length;
                const item = FLOOD_HEADLINES[headlineIdx];
                const cardCenterX = colLeft + COL_WIDTH / 2;
                const cardCenterY = idx * STRIDE + CARD_HEIGHT / 2 + ty;
                // Warp: each card moves toward (warpX, warpY) and shrinks
                const dx =
                  warpProgress > 0
                    ? (warpX - cardCenterX) * warpProgress
                    : 0;
                const dy =
                  warpProgress > 0
                    ? (warpY - cardCenterY) * warpProgress
                    : 0;
                const cardScale = 1 - warpProgress * 0.85;
                const cardOpacity = 1 - warpProgress;
                return (
                  <FloodCard
                    key={idx}
                    item={item}
                    top={idx * STRIDE}
                    rotation={((headlineIdx * 31) % 5) - 2}
                    extraTransform={`translate(${dx}px, ${dy}px) scale(${cardScale})`}
                    extraOpacity={cardOpacity}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const FloodCard: React.FC<{
  item: FloodHeadline;
  top: number;
  rotation: number;
  extraTransform?: string;
  extraOpacity?: number;
}> = ({ item, top, rotation, extraTransform = "", extraOpacity = 1 }) => {
  const badgeColor: Record<FloodHeadline["badge"], string> = {
    VOTE: "#ef4444",
    PASSED: "#16a34a",
    RULING: "#2563eb",
    MEETING: "#a855f7",
    BILL: "#f59e0b",
    ORDINANCE: "#0ea5e9",
  };
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 0,
        width: "100%",
        height: 56,
        background: "white",
        border: `1px solid ${colors.border}`,
        borderRadius: 8,
        boxShadow: "0 6px 18px -10px rgba(0,0,0,0.5)",
        padding: "8px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        transform: `rotate(${rotation}deg) ${extraTransform}`,
        opacity: extraOpacity,
      }}
    >
      <span
        style={{
          alignSelf: "flex-start",
          background: badgeColor[item.badge],
          color: "white",
          fontFamily: ui,
          fontSize: 8,
          fontWeight: 800,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          padding: "2px 6px",
          borderRadius: 3,
        }}
      >
        {item.badge}
      </span>
      <span
        style={{
          fontFamily: ui,
          fontSize: 11,
          fontWeight: 600,
          color: colors.gray900,
          lineHeight: 1.3,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {item.text}
      </span>
    </div>
  );
};
