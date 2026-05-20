import { type SupportedRegion } from "@/server-actions/get-supported-regions";

export interface PhotonSuggestion {
  label: string;
  name: string;
  state: string | null;
  country: string | null;
}

/** Resolve the hierarchy of supported regions from a search result or region name. */
export function resolveRegionHierarchy(
  suggestion: PhotonSuggestion | null,
  inputText: string,
  regions: SupportedRegion[],
): SupportedRegion[] {
  const ci = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
  const result: SupportedRegion[] = [];

  const cityName = suggestion?.name ?? inputText;
  const cityMatch = regions.find((r) => r.type === "city" && ci(r.region, cityName));
  if (cityMatch) result.push(cityMatch);

  const stateName = suggestion?.state ?? cityMatch?.parent_region;
  if (stateName) {
    const stateMatch = regions.find((r) => r.type === "state" && ci(r.region, stateName));
    if (stateMatch && !result.some((r) => r.region === stateMatch.region)) {
      result.push(stateMatch);
    }
  }

  const stateInResult = result.find((r) => r.type === "state");
  const countryName = suggestion?.country ?? stateInResult?.parent_region;
  if (countryName) {
    const countryMatch = regions.find((r) => r.type === "country" && ci(r.region, countryName));
    if (countryMatch && !result.some((r) => r.region === countryMatch.region)) {
      result.push(countryMatch);
    }
  }

  // Flat match fallback: walk up parent_region chain
  if (result.length === 0) {
    const flat = regions.find((r) => ci(r.region, inputText));
    if (flat) {
      result.push(flat);
      let current: SupportedRegion | undefined = flat;
      while (current?.parent_region) {
        const parent = regions.find((r) => ci(r.region, current!.parent_region!));
        if (parent && !result.some((r) => r.region === parent.region)) {
          result.push(parent);
          current = parent;
        } else break;
      }
    }
  }

  // Sort broadest → most specific (country, state, city)
  const typeOrder: Record<string, number> = { country: 0, state: 1, city: 2 };
  result.sort((a, b) => (typeOrder[a.type] ?? 0) - (typeOrder[b.type] ?? 0));

  return result;
}
