import "./index.css";
import "./fonts";
import { Composition } from "remotion";
import { SFBrief, SF_BRIEF } from "./Brief";
import { HowItWorks, HOW_IT_WORKS } from "./HowItWorks";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SFBrief"
        component={SFBrief}
        durationInFrames={SF_BRIEF.duration}
        fps={SF_BRIEF.fps}
        width={SF_BRIEF.width}
        height={SF_BRIEF.height}
      />
      <Composition
        id="HowItWorks"
        component={HowItWorks}
        durationInFrames={HOW_IT_WORKS.duration}
        fps={HOW_IT_WORKS.fps}
        width={HOW_IT_WORKS.width}
        height={HOW_IT_WORKS.height}
      />
    </>
  );
};
