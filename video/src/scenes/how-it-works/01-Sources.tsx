import { interpolate, staticFile, Sequence } from "remotion";
import { Video } from "@remotion/media";
import { colors, ease } from "../../tokens";
import { display, ui } from "../../fonts";

type SourcesProps = {
  opacity: number;
  /** Local frame within this scene (0 = scene start). */
  localFrame: number;
};

// 6-second scene (180 frames @ 30fps). Phases:
//
//    0- 44  Google search results page; cursor moves to first result
//   44- 56  click + loading bar; URL switches to sfgov.org/bdsupvrs
//   56-100  SF.gov agenda page; cursor scrolls page down to "Watch meeting"
//  100-112  click; URL switches to sfgovtv.org/live
//  112-180  meeting video player; cursor parks; caption appears
export const Sources: React.FC<SourcesProps> = ({ opacity, localFrame }) => {
  const phase1 = localFrame < 50;
  const phase2 = localFrame >= 50 && localFrame < 112;
  const phase3 = localFrame >= 112;

  const phase1Op = interpolate(localFrame, [44, 50], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const phase2In = interpolate(localFrame, [50, 58], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const phase2Out = interpolate(localFrame, [108, 114], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const phase2Op = phase2In * phase2Out;
  const phase3Op = interpolate(localFrame, [112, 122], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Loading bar during transitions
  const loading1 = interpolate(localFrame, [44, 56], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const loading2 = interpolate(localFrame, [102, 116], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const loading =
    localFrame < 58
      ? loading1
      : localFrame > 102 && localFrame < 118
        ? loading2
        : 1;

  // Page scroll during phase 2
  const pageScroll = interpolate(localFrame, [62, 100], [0, 180], {
    easing: ease.editorial,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Determine URL by phase
  const url =
    localFrame < 50
      ? "google.com/search?q=san+francisco+board+of+supervisors+agenda"
      : localFrame < 116
        ? "sfgov.org/bdsupvrs/agenda"
        : "sfgovtv.org/live";
  const tabTitle =
    localFrame < 50
      ? "sf board of supervisors agenda - Google Search"
      : localFrame < 116
        ? "Agenda · Board of Supervisors · SF.gov"
        : "Live Meeting · SFGovTV";

  // Caption A — visible from scene start, through browser phases
  const captionAIn = interpolate(localFrame, [0, 16], [0, 1], {
    easing: ease.enterCrisp,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const captionAOut = interpolate(localFrame, [100, 114], [1, 0], {
    easing: ease.editorial,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const captionA = captionAIn * captionAOut;

  // Caption B — appears as soon as the meeting video phase starts
  const captionB = interpolate(localFrame, [112, 128], [0, 1], {
    easing: ease.enterCrisp,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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
      {/* Browser window */}
      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          top: 36,
          bottom: 144,
          background: "white",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow:
            "0 1px 2px rgba(60,64,67,0.1), 0 16px 40px -10px rgba(60,64,67,0.2)",
        }}
      >
        <BrowserChrome url={url} tabTitle={tabTitle} loading={loading} />

        {/* Content area */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 76,
            bottom: 0,
            overflow: "hidden",
            background: "white",
          }}
        >
          {phase1 && <GoogleResults opacity={phase1Op} localFrame={localFrame} />}
          {phase2 && (
            <BoSPage
              opacity={phase2Op}
              scroll={pageScroll}
              localFrame={localFrame}
            />
          )}
          {phase3 && (
            <VideoPlayer opacity={phase3Op} localFrame={localFrame} />
          )}
        </div>
      </div>

      {/* Captions — two phases, crossfaded */}
      <div
        style={{
          position: "absolute",
          bottom: 30,
          left: 60,
          right: 60,
          height: 92,
          textAlign: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p
          style={{
            position: "absolute",
            left: 40,
            right: 40,
            margin: 0,
            fontFamily: display,
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
            color: colors.gray900,
            opacity: captionA,
            transform: `translateY(${(1 - captionAIn) * 6}px)`,
          }}
        >
          We monitor your region&rsquo;s government sources.
        </p>
        <p
          style={{
            position: "absolute",
            left: 40,
            right: 40,
            margin: 0,
            fontFamily: display,
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
            color: colors.gray900,
            opacity: captionB,
            transform: `translateY(${(1 - captionB) * 6}px)`,
          }}
        >
          We learn from official sources like legislation and government
          meetings.
        </p>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────

const BrowserChrome: React.FC<{
  url: string;
  tabTitle: string;
  loading: number;
}> = ({ url, tabTitle, loading }) => {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        height: 76,
        background: "#dee1e6",
        borderBottom: "1px solid #c4c7cc",
      }}
    >
      {/* Title bar with traffic lights + tab */}
      <div
        style={{
          height: 40,
          padding: "0 12px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ width: 12, height: 12, borderRadius: 999, background: "#ff5f57" }} />
        <span style={{ width: 12, height: 12, borderRadius: 999, background: "#febc2e" }} />
        <span style={{ width: 12, height: 12, borderRadius: 999, background: "#28c840" }} />
        <div
          style={{
            marginLeft: 16,
            background: "white",
            borderRadius: "8px 8px 0 0",
            padding: "8px 14px",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            maxWidth: 320,
            fontFamily: ui,
            fontSize: 12,
            color: colors.gray700,
          }}
        >
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 3,
              background: "#1a73e8",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 9,
              fontWeight: 800,
            }}
          >
            ◆
          </span>
          <span
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 240,
            }}
          >
            {tabTitle}
          </span>
        </div>
      </div>
      {/* URL bar */}
      <div
        style={{
          height: 36,
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          position: "relative",
        }}
      >
        <span
          style={{
            color: colors.gray400,
            fontFamily: ui,
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          ← → ↻
        </span>
        <div
          style={{
            flex: 1,
            background: "#f1f3f4",
            borderRadius: 999,
            padding: "5px 14px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontFamily: ui,
            fontSize: 12,
            color: colors.gray700,
          }}
        >
          <span style={{ color: colors.gray400 }}>🔒</span>
          <span>{url}</span>
        </div>
        {/* Loading bar at bottom of URL bar */}
        {loading < 1 && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 2,
              background: "transparent",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${loading * 100}%`,
                background: "#1a73e8",
                boxShadow: "0 0 8px rgba(26,115,232,0.5)",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────

const GOOGLE_RESULTS = [
  {
    breadcrumb: "sfgov.org › bdsupvrs › agenda",
    title: "Board of Supervisors Agenda for Tuesday, May 13",
    snippet:
      "ITEM 14: affordable housing bond, $300M. Roll call vote scheduled. ITEM 15: Police Commission report on traffic stops...",
  },
  {
    breadcrumb: "sfgov.org › bdsupvrs › meetings",
    title: "Watch SF Board of Supervisors meetings live",
    snippet:
      "Live and archived meetings of the San Francisco Board of Supervisors. Tuesdays at 2 PM PT. Public comment available.",
  },
  {
    breadcrumb: "sfgovtv.org › schedule",
    title: "SFGovTV Schedule & Live Streams",
    snippet:
      "Schedule for Board of Supervisors, Planning Commission, Police Commission, and other public-body meetings...",
  },
];

const GoogleResults: React.FC<{ opacity: number; localFrame: number }> = ({
  opacity,
  localFrame,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        background: "white",
        padding: "26px 80px",
        fontFamily: ui,
      }}
    >
      {/* Google logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 28,
          marginBottom: 22,
        }}
      >
        <span
          style={{
            fontFamily: ui,
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          <span style={{ color: "#4285f4" }}>G</span>
          <span style={{ color: "#ea4335" }}>o</span>
          <span style={{ color: "#fbbc04" }}>o</span>
          <span style={{ color: "#4285f4" }}>g</span>
          <span style={{ color: "#34a853" }}>l</span>
          <span style={{ color: "#ea4335" }}>e</span>
        </span>
        {/* Search box */}
        <div
          style={{
            flex: 1,
            background: "white",
            border: "1px solid #dadce0",
            borderRadius: 999,
            padding: "8px 18px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 1px 6px rgba(32,33,36,0.08)",
            fontFamily: ui,
            fontSize: 14,
            color: colors.gray700,
            maxWidth: 620,
          }}
        >
          <span style={{ color: colors.gray400 }}>🔍</span>
          <span>san francisco board of supervisors agenda</span>
        </div>
      </div>

      {/* Result count + tabs */}
      <div
        style={{
          fontFamily: ui,
          fontSize: 12,
          color: colors.meta,
          marginBottom: 18,
        }}
      >
        About 47,300 results (0.42 seconds)
      </div>

      {/* Results */}
      {GOOGLE_RESULTS.map((r, i) => {
        const isFirst = i === 0;
        const hover = isFirst && localFrame >= 30 && localFrame < 50;
        return (
          <div
            key={i}
            style={{
              marginBottom: 22,
              padding: hover ? "6px 8px" : 0,
              background: hover ? "#f1f3f4" : "transparent",
              borderRadius: 4,
              maxWidth: 760,
            }}
          >
            <div
              style={{
                fontFamily: ui,
                fontSize: 11,
                color: colors.meta,
                marginBottom: 2,
              }}
            >
              {r.breadcrumb}
            </div>
            <div
              style={{
                fontFamily: ui,
                fontSize: 18,
                fontWeight: 500,
                color: isFirst && hover ? "#7b1fa2" : "#1a0dab",
                lineHeight: 1.3,
                marginBottom: 4,
                cursor: "pointer",
                textDecoration: hover ? "underline" : "none",
              }}
            >
              {r.title}
            </div>
            <div
              style={{
                fontFamily: ui,
                fontSize: 13,
                color: "#3c4043",
                lineHeight: 1.4,
              }}
            >
              {r.snippet}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────

const BoSPage: React.FC<{
  opacity: number;
  scroll: number;
  localFrame: number;
}> = ({ opacity, scroll, localFrame }) => {
  const watchHover = localFrame >= 92 && localFrame < 112;
  const watchPress = localFrame >= 100 && localFrame < 110;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        background: "white",
        overflow: "hidden",
      }}
    >
      {/* Header (sticky, on top of scrolled content) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          background: "#1a3a72",
          color: "white",
          padding: "14px 40px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          zIndex: 5,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: "white",
            color: "#1a3a72",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: ui,
            fontSize: 13,
            fontWeight: 800,
          }}
        >
          SF
        </div>
        <span
          style={{
            fontFamily: ui,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.04em",
          }}
        >
          San Francisco Board of Supervisors
        </span>
      </div>

      {/* Scrollable content */}
      <div
        style={{
          padding: "80px 60px 24px",
          transform: `translateY(${-scroll}px)`,
        }}
      >
        <div
          style={{
            fontFamily: ui,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#1a3a72",
            marginBottom: 8,
          }}
        >
          Meeting Agenda · Tuesday, May 13
        </div>
        <h1
          style={{
            fontFamily: display,
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: colors.gray900,
            margin: "0 0 14px 0",
          }}
        >
          Regular Meeting of the Board of Supervisors
        </h1>
        <p
          style={{
            fontFamily: ui,
            fontSize: 13,
            color: colors.gray700,
            lineHeight: 1.5,
            maxWidth: 760,
            margin: "0 0 22px 0",
          }}
        >
          The Board will convene at 2:00 PM in Legislative Chamber, Room 250,
          City Hall. Public comment is available in person and remotely.
        </p>

        {/* Agenda items */}
        {[
          {
            num: "Item 14",
            title: "Bond Issuance, Affordable Housing, $300,000,000",
            blurb:
              "Resolution placing on the November ballot a measure to authorize issuance of general obligation bonds...",
          },
          {
            num: "Item 15",
            title: "Police Commission Report on Pretextual Traffic Stops",
            blurb:
              "Hearing on Commission recommendations regarding low-level traffic stop policy reform...",
          },
          {
            num: "Item 16",
            title: "SFMTA Service Plan Update",
            blurb:
              "Briefing on Muni Metro frequency adjustments for L-Taraval and N-Judah lines...",
          },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              padding: "14px 18px",
              border: "1px solid #e8eaed",
              borderRadius: 10,
              marginBottom: 12,
              background: "#fafbfc",
            }}
          >
            <div
              style={{
                fontFamily: ui,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: colors.red500,
                marginBottom: 4,
              }}
            >
              {item.num}
            </div>
            <div
              style={{
                fontFamily: ui,
                fontSize: 15,
                fontWeight: 700,
                color: colors.gray900,
                marginBottom: 4,
              }}
            >
              {item.title}
            </div>
            <div
              style={{
                fontFamily: ui,
                fontSize: 12,
                color: colors.gray700,
                lineHeight: 1.45,
              }}
            >
              {item.blurb}
            </div>
          </div>
        ))}

        {/* Watch Meeting button */}
        <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
          <div
            style={{
              background: watchPress ? colors.red700 : colors.red500,
              color: "white",
              fontFamily: ui,
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "12px 22px",
              borderRadius: 8,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              boxShadow: watchHover
                ? "0 8px 22px -10px rgba(239,68,68,0.6)"
                : "0 2px 6px rgba(239,68,68,0.3)",
              transform: `scale(${watchPress ? 0.96 : 1})`,
            }}
          >
            <span>▶</span>
            Watch meeting live
          </div>
          <div
            style={{
              background: "white",
              border: `1px solid ${colors.gray200}`,
              color: colors.gray700,
              fontFamily: ui,
              fontSize: 14,
              fontWeight: 600,
              padding: "12px 22px",
              borderRadius: 8,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            ⤓ Download agenda PDF
          </div>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────

const VideoPlayer: React.FC<{ opacity: number; localFrame: number }> = ({
  opacity,
  localFrame,
}) => {
  const liveBadgePulse = 0.55 + 0.45 * Math.abs(Math.sin(localFrame / 6));
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        background: "#08080a",
      }}
    >
      <Sequence from={0}>
        <Video
          src={staticFile("sf-gov.mp4")}
          trimBefore={60}
          trimAfter={240}
          volume={0}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </Sequence>

      {/* LIVE badge */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 18,
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          padding: "5px 11px",
          background: "rgba(239, 68, 68, 0.85)",
          color: "white",
          borderRadius: 4,
          fontFamily: ui,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          backdropFilter: "blur(6px)",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: "white",
            opacity: liveBadgePulse,
          }}
        />
        Live
      </div>

      {/* Title overlay */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 18,
          right: 18,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%)",
          padding: "30px 18px 14px",
          fontFamily: ui,
          color: "white",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.7)",
            marginBottom: 4,
          }}
        >
          SFGovTV · Live
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          Board of Supervisors Regular Meeting
        </div>
      </div>

      {/* Player controls */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 44,
          background: "rgba(0,0,0,0.65)",
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          color: "white",
          fontFamily: ui,
          fontSize: 12,
        }}
      >
        <span style={{ fontSize: 14 }}>⏸</span>
        <span style={{ opacity: 0.9 }}>1:24:18 / 2:42:05</span>
        <div
          style={{
            flex: 1,
            height: 3,
            background: "rgba(255,255,255,0.25)",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "52%",
              height: "100%",
              background: colors.red500,
            }}
          />
        </div>
        <span style={{ opacity: 0.9 }}>HD</span>
        <span style={{ opacity: 0.9 }}>⛶</span>
      </div>
    </div>
  );
};
