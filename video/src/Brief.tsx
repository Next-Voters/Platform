import { AbsoluteFill, Sequence } from "remotion";
import { FloodOpen } from "./scenes/01-FloodOpen";
import { Introducing } from "./scenes/02-Introducing";
import { Subscribe } from "./scenes/03-Subscribe";
import { Transcript } from "./scenes/04-Transcript";
import { VideoScene } from "./scenes/05-Video";
import { Outro } from "./scenes/07-Outro";

// Beat timing (30 fps, 1280×720, 26s total)
//   0-210  1 · Flood opener + question        (7s)
// 210-270  2 · Introducing Next Voters         (2s)
// 270-360  3 · Subscribe                       (3s)
// 360-510  4 · Transcript reading              (5s)
// 510-600  5 · SF Gov video                    (3s)
// 600-780  6 · Outro · flood→email + URL       (6s)
export const SF_BRIEF: {
  duration: number;
  fps: number;
  width: number;
  height: number;
} = {
  duration: 780,
  fps: 30,
  width: 1280,
  height: 720,
};

export const SFBrief: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#ffffff" }}>
      <Sequence from={0} durationInFrames={210} layout="none">
        <FloodOpen />
      </Sequence>
      <Sequence from={210} durationInFrames={60} layout="none">
        <Introducing />
      </Sequence>
      <Sequence from={270} durationInFrames={90} layout="none">
        <Subscribe />
      </Sequence>
      <Sequence from={360} durationInFrames={150} layout="none">
        <Transcript />
      </Sequence>
      <Sequence from={510} durationInFrames={90} layout="none">
        <VideoScene />
      </Sequence>
      <Sequence from={600} durationInFrames={180} layout="none">
        <Outro />
      </Sequence>
    </AbsoluteFill>
  );
};
