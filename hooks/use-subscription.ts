"use client";

import { useSubscriptionContext } from "@/wrappers/SubscriptionProvider";

export function useSubscription() {
  return useSubscriptionContext();
}
