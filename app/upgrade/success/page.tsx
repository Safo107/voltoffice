"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePro } from "@/context/ProContext";
import { CheckCircle, Zap, ArrowRight } from "lucide-react";

export default function UpgradeSuccessPage() {
  const router = useRouter();
  const { refreshPro } = usePro();

  useEffect(() => {
    // Pro-Status aus DB neu laden (Webhook braucht kurz)
    const timer = setTimeout(() => refreshPro(), 2000);
    return () => clearTimeout(timer);
  }, [refreshPro]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "#0d1b2e" }}
    >
      <div className="w-full max-w-md text-center">
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
          style={{ background: "rgba(63,185,80,0.15)", border: "1px solid rgba(63,185,80,0.4)" }}
        >
          <CheckCircle size={40} style={{ color: "#3fb950" }} />
        </div>

        <h1
          className="text-2xl font-bold mb-3"
          style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}
        >
          Willkommen bei Pro!
        </h1>
        <p className="mb-2" style={{ color: "#8b9ab5" }}>
          Dein Upgrade war erfolgreich. Alle Pro-Features sind sofort aktiv.
        </p>
        <p className="text-sm mb-8" style={{ color: "#6e7681" }}>
          Eine Bestätigung wurde an deine E-Mail-Adresse gesendet.
        </p>

        <button
          onClick={() => router.replace("/dashboard")}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #f5a623, #c4841c)", color: "#0d1b2e" }}
        >
          <Zap size={16} />
          Zum Dashboard
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
