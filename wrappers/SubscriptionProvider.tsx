"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/wrappers/AuthProvider";
import { getSubscriptionStatus } from "@/server-actions/get-subscription-status";

interface SubscriptionState {
  isPro: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasSubscription: boolean;
  tier: "pro" | "free" | "none";
}

interface SubscriptionContextValue extends SubscriptionState {
  refetch: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function useSubscriptionContext(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscriptionContext must be used within SubscriptionProvider");
  return ctx;
}

const UNAUTHENTICATED_STATE: SubscriptionState = {
  isPro: false,
  isAuthenticated: false,
  isLoading: false,
  hasSubscription: false,
  tier: "none",
};

const LOADING_STATE: SubscriptionState = {
  isPro: false,
  isAuthenticated: false,
  isLoading: true,
  hasSubscription: false,
  tier: "none",
};

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authIsLoading } = useAuth();
  const [state, setState] = useState<SubscriptionState>(LOADING_STATE);
  // Prevents a stale in-flight fetch from overwriting a newer result
  const fetchCounterRef = useRef(0);

  const fetchSubscription = useCallback(async () => {
    const counter = ++fetchCounterRef.current;
    setState((prev) => ({ ...prev, isLoading: true }));
    const result = await getSubscriptionStatus();
    if (counter === fetchCounterRef.current) {
      setState({ ...result, isLoading: false });
    }
  }, []);

  useEffect(() => {
    if (authIsLoading) {
      setState(LOADING_STATE);
      return;
    }
    if (!user) {
      // User is definitively signed out — resolve immediately, no server call
      fetchCounterRef.current++;
      setState(UNAUTHENTICATED_STATE);
      return;
    }
    fetchSubscription();
  }, [authIsLoading, user?.id, fetchSubscription]);

  const refetch = useCallback(async () => {
    await fetchSubscription();
  }, [fetchSubscription]);

  return (
    <SubscriptionContext.Provider value={{ ...state, refetch }}>
      {children}
    </SubscriptionContext.Provider>
  );
}
