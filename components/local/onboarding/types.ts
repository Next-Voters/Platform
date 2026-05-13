export type OnboardingStep = 1 | 2 | 3;

export type OnboardingMode = "subscribe" | "request";

export interface RegionRequest {
  region: string;
}

export interface OnboardingState {
  region: string;
  regionRequest: RegionRequest | null;
  topics: string[];
}

export const INITIAL_STATE: OnboardingState = {
  region: "",
  regionRequest: null,
  topics: [],
};
