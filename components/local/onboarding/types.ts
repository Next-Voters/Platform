export type OnboardingStep = 1 | 2 | 3;

export type OnboardingMode = "subscribe" | "request";

export interface RegionRequest {
  region: string;
}

export interface SelectedRegion {
  region: string;
  type: "city" | "state" | "country";
}

export interface OnboardingState {
  region: string;
  regionRequest: RegionRequest | null;
  topics: string[];
  regionType: "city" | "state" | "country" | null;
  selectedRegions: SelectedRegion[];
}

export const INITIAL_STATE: OnboardingState = {
  region: "",
  regionRequest: null,
  topics: [],
  regionType: null,
  selectedRegions: [],
};
