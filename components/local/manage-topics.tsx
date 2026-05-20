"use client";

import { useEffect, useState } from "react";
import { Check, Globe } from "lucide-react";
import topicOptions from "@/data/topic-options";
import { useSubscription } from "@/hooks/use-subscription";
import { TierBadge } from "@/components/local/tier-badge";
import { getUserTopics } from "@/server-actions/get-user-topics";
import { updateUserTopics } from "@/server-actions/update-user-topics";
import { getSupportedRegionsWithHierarchy, getUserSubscriptionRegions, type SupportedRegion } from "@/server-actions/get-supported-regions";
import { updateUserRegion } from "@/server-actions/update-user-region";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ManageTopics({ onSaved }: { onSaved?: () => void } = {}) {
  const { isPro, isLoading: subLoading, tier } = useSubscription();
  const MAX_TOPICS = 3;

  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [topicsLoading, setTopicsLoading] = useState(true);

  const [regions, setRegions] = useState<SupportedRegion[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [subscribedRegions, setSubscribedRegions] = useState<SupportedRegion[]>([]);
  const [regionError, setRegionError] = useState("");

  useEffect(() => {
    getSupportedRegionsWithHierarchy().then(setRegions);
    getUserSubscriptionRegions().then(setSubscribedRegions);
  }, []);

  // Initialize individual selectors from subscribed regions
  useEffect(() => {
    const country = subscribedRegions.find((r) => r.type === "country");
    const state = subscribedRegions.find((r) => r.type === "state");
    const city = subscribedRegions.find((r) => r.type === "city");
    if (country) setSelectedCountry(country.region);
    if (state) setSelectedState(state.region);
    if (city) setSelectedCity(city.region);
  }, [subscribedRegions]);

  useEffect(() => {
    if (subLoading) return;
    getUserTopics().then((topics) => {
      setSelected(topics);
      setTopicsLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subLoading]);

  const toggleTopic = (topic: string) => {
    const exists = selected.includes(topic);
    if (exists) {
      setSelected(selected.filter((t) => t !== topic));
    } else if (selected.length < MAX_TOPICS) {
      setSelected([...selected, topic]);
    }
    setSavedMsg("");
  };

  const handleSave = async () => {
    setRegionError("");
    // Prevent free users from saving a city region.
    if (selectedCity && !isPro) {
      setRegionError("City-level updates require a Pro subscription.");
      return;
    }

    const mostSpecificRegion = selectedCity || selectedState || selectedCountry;

    setSaving(true);
    setSavedMsg("");
    const [topicResult, regionResult] = await Promise.all([
      updateUserTopics(selected),
      mostSpecificRegion ? updateUserRegion(mostSpecificRegion) : Promise.resolve({} as { error?: string }),
    ]);
    setSaving(false);
    const error = topicResult.error || regionResult.error;
    if (error) {
      setSavedMsg(error);
    } else {
      setSavedMsg("Saved!");
      // Refetch subscription regions so the display reflects the new primary region.
      getUserSubscriptionRegions().then(setSubscribedRegions);
      onSaved?.();
    }
  };

  if (subLoading || topicsLoading) {
    return (
      <div className="w-full bg-page flex items-center justify-center py-20">
        <p className="text-gray-400 text-[14px]">Loading…</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-page flex flex-col">
      <div className="flex-1 w-full pt-12 pb-8">
        <div className="flex items-center gap-2.5 mb-3">
          <h1 className="text-[30px] sm:text-[38px] font-bold text-gray-950 leading-tight tracking-tight">
            Next Voters
          </h1>
          <TierBadge tier={tier} />
        </div>
        <p className="text-[15px] text-gray-500 mb-8 leading-relaxed">
          Select up to 3 topics. We&rsquo;ll only send you updates related to your choices.
        </p>

        {/* Country selector */}
        <div className="mb-6">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
            Country
          </p>
          <div className="flex items-center gap-3 mb-2">
            <Globe className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="text-[14.5px] text-gray-900 font-medium">
              {selectedCountry || "No country selected"}
            </span>
            {selectedCountry && (
              <span className="text-[11px] text-gray-400 uppercase tracking-wide">Federal</span>
            )}
          </div>
          <Select
            value={selectedCountry}
            onValueChange={(val) => {
              setSelectedCountry(val);
              setSelectedState("");
              setSelectedCity("");
            }}
          >
            <SelectTrigger className="w-full sm:w-[240px] bg-white border border-gray-200 text-gray-900 text-[14px] rounded-xl min-h-[44px]">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent className="bg-white text-gray-900 border border-gray-200 z-[50]">
              {regions
                .filter((r) => r.type === "country")
                .map((r) => (
                  <SelectItem key={r.region} value={r.region} className="hover:bg-gray-100 focus:bg-gray-100">
                    {r.region}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Region (state) selector */}
        <div className="mb-6">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
            Region
          </p>
          <div className="flex items-center gap-3 mb-2">
            <Globe className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="text-[14.5px] text-gray-900 font-medium">
              {selectedState || "No region selected"}
            </span>
            {selectedState && (
              <span className="text-[11px] text-gray-400 uppercase tracking-wide">State</span>
            )}
          </div>
          <Select
            value={selectedState}
            onValueChange={(val) => {
              setSelectedState(val);
              setSelectedCity("");
            }}
            disabled={!selectedCountry}
          >
            <SelectTrigger className="w-full sm:w-[240px] bg-white border border-gray-200 text-gray-900 text-[14px] rounded-xl min-h-[44px]">
              <SelectValue placeholder={selectedCountry ? "Select region" : "Select a country first"} />
            </SelectTrigger>
            <SelectContent className="bg-white text-gray-900 border border-gray-200 z-[50]">
              {regions
                .filter((r) => r.type === "state" && r.parent_region === selectedCountry)
                .map((r) => (
                  <SelectItem key={r.region} value={r.region} className="hover:bg-gray-100 focus:bg-gray-100">
                    {r.region}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* City selector */}
        <div className="mb-8">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
            City
          </p>
          <div className="flex items-center gap-3 mb-2">
            <Globe className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="text-[14.5px] text-gray-900 font-medium">
              {selectedCity || "No city selected"}
            </span>
            {selectedCity && (
              <span className="text-[11px] text-gray-400 uppercase tracking-wide">City</span>
            )}
            {!isPro && (
              <span className="text-[11px] text-brand font-semibold uppercase tracking-wide">Pro</span>
            )}
          </div>
          <Select
            value={selectedCity}
            onValueChange={setSelectedCity}
            disabled={!selectedState || !isPro}
          >
            <SelectTrigger className="w-full sm:w-[240px] bg-white border border-gray-200 text-gray-900 text-[14px] rounded-xl min-h-[44px]">
              <SelectValue placeholder={!isPro ? "Requires Pro" : selectedState ? "Select city" : "Select a region first"} />
            </SelectTrigger>
            <SelectContent className="bg-white text-gray-900 border border-gray-200 z-[50]">
              {regions
                .filter((r) => r.type === "city" && r.parent_region === selectedState)
                .map((r) => (
                  <SelectItem key={r.region} value={r.region} className="hover:bg-gray-100 focus:bg-gray-100">
                    {r.region}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {regionError && (
            <p className="mt-2 text-[13px] text-red-600 font-medium">{regionError}</p>
          )}
        </div>

        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
          Topics
        </p>
        <div className="flex flex-wrap gap-2.5 mb-6">
          {topicOptions.map((topic) => {
            const isActive = selected.includes(topic);
            return (
              <button
                key={topic}
                type="button"
                onClick={() => toggleTopic(topic)}
                aria-pressed={isActive}
                className={[
                  "inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 font-semibold text-[14.5px] transition-all",
                  isActive
                    ? "border-brand bg-brand text-white shadow-sm"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50",
                ].join(" ")}
              >
                {isActive && <Check className="w-4 h-4 shrink-0" />}
                {topic}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || selected.length === 0}
            className="inline-flex items-center justify-center min-h-[48px] px-8 py-3 text-[16px] font-bold text-white bg-brand rounded-xl hover:bg-brand-hover transition-colors shadow-sm disabled:opacity-50 touch-manipulation"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          {savedMsg && (
            <p className={`text-[13.5px] font-medium ${savedMsg === "Saved!" ? "text-green-600" : "text-red-500"}`}>
              {savedMsg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
