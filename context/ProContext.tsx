"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

interface ProContextType {
  isPro: boolean;
  isTrial: boolean;
  trialDaysLeft: number;
  tier: "trial" | "free" | "pro" | "business";
  plan: "free" | "pro" | "business";
  loadingPro: boolean;
  hasStripeCustomer: boolean;
  lastPaymentFailed: string | null;
  proSince: string | null;
  refreshPro: () => Promise<void>;
}

const ProContext = createContext<ProContextType>({
  isPro: false,
  isTrial: false,
  trialDaysLeft: 0,
  tier: "free",
  plan: "free",
  loadingPro: true,
  hasStripeCustomer: false,
  lastPaymentFailed: null,
  proSince: null,
  refreshPro: async () => {},
});

export function ProProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isPro, setIsPro] = useState(false);
  const [isTrial, setIsTrial] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [tier, setTier] = useState<"trial" | "free" | "pro" | "business">("free");
  const [plan, setPlan] = useState<"free" | "pro" | "business">("free");
  const [loadingPro, setLoadingPro] = useState(true);
  const [hasStripeCustomer, setHasStripeCustomer] = useState(false);
  const [lastPaymentFailed, setLastPaymentFailed] = useState<string | null>(null);
  const [proSince, setProSince] = useState<string | null>(null);

  const fetchPro = async (uid: string) => {
    try {
      const res = await fetch(`/api/user/pro?uid=${uid}`);
      const data = await res.json();
      setIsPro(data.pro === true);
      setIsTrial(data.isTrial === true);
      setTrialDaysLeft(data.trialDaysLeft || 0);
      setTier(data.tier || "free");
      setPlan(data.plan || "free");
      setHasStripeCustomer(data.hasStripeCustomer === true);
      setLastPaymentFailed(data.lastPaymentFailed || null);
      setProSince(data.proSince || null);
    } catch {
      setIsPro(false);
      setIsTrial(false);
      setTrialDaysLeft(0);
      setTier("free");
      setPlan("free");
      setHasStripeCustomer(false);
      setLastPaymentFailed(null);
      setProSince(null);
    } finally {
      setLoadingPro(false);
    }
  };

  const refreshPro = async () => {
    if (user) await fetchPro(user.uid);
  };

  useEffect(() => {
    if (user) {
      fetchPro(user.uid);
    } else {
      setIsPro(false);
      setIsTrial(false);
      setTrialDaysLeft(0);
      setTier("free");
      setPlan("free");
      setLoadingPro(false);
    }
  }, [user]);

  return (
    <ProContext.Provider value={{ isPro, isTrial, trialDaysLeft, tier, plan, loadingPro, hasStripeCustomer, lastPaymentFailed, proSince, refreshPro }}>
      {children}
    </ProContext.Provider>
  );
}

export function usePro() {
  return useContext(ProContext);
}
