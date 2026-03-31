"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

interface ProContextType {
  isPro: boolean;
  loadingPro: boolean;
  refreshPro: () => Promise<void>;
}

const ProContext = createContext<ProContextType>({ isPro: false, loadingPro: true, refreshPro: async () => {} });

export function ProProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isPro, setIsPro] = useState(false);
  const [loadingPro, setLoadingPro] = useState(true);

  const fetchPro = async (uid: string) => {
    try {
      const res = await fetch(`/api/user/pro?uid=${uid}`);
      const data = await res.json();
      setIsPro(data.pro === true);
    } catch {
      setIsPro(false);
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
      setLoadingPro(false);
    }
  }, [user]);

  return (
    <ProContext.Provider value={{ isPro, loadingPro, refreshPro }}>
      {children}
    </ProContext.Provider>
  );
}

export function usePro() {
  return useContext(ProContext);
}
