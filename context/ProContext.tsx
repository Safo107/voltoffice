"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

interface ProContextType {
  isPro: boolean;
  isTrial: boolean;
  trialDaysLeft: number;
  tier: "trial" | "free" | "pro";
  loadingPro: boolean;
  refreshPro: () => Promise<void>;
}

const ProContext = createContext<ProContextType>({
  isPro: false,
  isTrial: false,
  trialDaysLeft: 0,
  tier: "free",
  loadingPro: true,
  refreshPro: async () => {},
});

export function ProProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isPro, setIsPro] = useState(false);
  const [isTrial, setIsTrial] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [tier, setTier] = useState<"trial" | "free" | "pro">("free");
  const [loadingPro, setLoadingPro] = useState(true);

  const fetchPro = async (uid: string) => {
    try {
      const res = await fetch(`/api/user/pro?uid=${uid}`);
      const data = await res.json();
      setIsPro(data.pro === true);
      setIsTrial(data.isTrial === true);
      setTrialDaysLeft(data.trialDaysLeft || 0);
      setTier(data.tier || "free");
    } catch {
      setIsPro(false);
      setIsTrial(false);
      setTrialDaysLeft(0);
      setTier("free");
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
      setLoadingPro(false);
    }
  }, [user]);

  return (
    <ProContext.Provider value={{ isPro, isTrial, trialDaysLeft, tier, loadingPro, refreshPro }}>
      {children}
    </ProContext.Provider>
  );
}

export function usePro() {
  return useContext(ProContext);
}
