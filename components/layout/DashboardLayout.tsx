"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePro } from "@/context/ProContext";
import { Zap, X } from "lucide-react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import MobileNav from "./MobileNav";
import { useState } from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const { user, loading } = useAuth();
  const { isTrial, trialDaysLeft, tier } = usePro();
  const router = useRouter();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d1b2e" }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "#00c6ff", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const showTrialBanner = isTrial && !bannerDismissed;
  const showExpiredBanner = tier === "free" && !bannerDismissed;
  const trialUrgent = isTrial && trialDaysLeft <= 3;

  return (
    <div className="flex h-full" style={{ background: "#0d1b2e", overflow: "hidden", maxWidth: "100vw" }}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar title={title} subtitle={subtitle} />

        {/* Trial Banner */}
        {showTrialBanner && (
          <div
            className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm shrink-0"
            style={{
              background: trialUrgent ? "rgba(239,68,68,0.12)" : "rgba(0,198,255,0.1)",
              borderBottom: `1px solid ${trialUrgent ? "rgba(239,68,68,0.3)" : "rgba(0,198,255,0.25)"}`,
            }}
          >
            <div className="flex items-center gap-2">
              <Zap size={14} style={{ color: trialUrgent ? "#ef4444" : "#00c6ff", flexShrink: 0 }} />
              <span style={{ color: trialUrgent ? "#ef4444" : "#00c6ff", fontWeight: 600 }}>
                {trialDaysLeft === 0
                  ? "⚡ Dein Trial endet heute!"
                  : `⚡ Noch ${trialDaysLeft} Trial-${trialDaysLeft === 1 ? "Tag" : "Tage"} — Danach Free-Plan (max. 5 Kunden, 3 Angebote)`}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => router.push("/upgrade")}
                className="px-3 py-1 rounded-lg text-xs font-bold transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #f5a623, #c4841c)", color: "#0d1b2e" }}
              >
                Jetzt Pro werden
              </button>
              <button
                onClick={() => setBannerDismissed(true)}
                className="p-1 rounded transition-all"
                style={{ color: "#8b9ab5" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#e6edf3"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#8b9ab5"; }}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Trial Expired Banner */}
        {showExpiredBanner && (
          <div
            className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm shrink-0"
            style={{ background: "rgba(245,166,35,0.1)", borderBottom: "1px solid rgba(245,166,35,0.25)" }}
          >
            <div className="flex items-center gap-2">
              <Zap size={14} style={{ color: "#f5a623", flexShrink: 0 }} />
              <span style={{ color: "#f5a623", fontWeight: 600 }}>
                Trial abgelaufen — Du bist jetzt im Free-Plan (max. 5 Kunden, 3 Angebote, 3 Projekte)
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => router.push("/upgrade")}
                className="px-3 py-1 rounded-lg text-xs font-bold transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #f5a623, #c4841c)", color: "#0d1b2e" }}
              >
                Pro — 9,99€/Monat
              </button>
              <button
                onClick={() => setBannerDismissed(true)}
                className="p-1 rounded transition-all"
                style={{ color: "#8b9ab5" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#e6edf3"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#8b9ab5"; }}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">{children}</main>
        <footer className="hidden md:flex shrink-0 items-center justify-center gap-4 px-6 py-2 text-xs" style={{ borderTop: "1px solid #1e3a5f", color: "#4a5568" }}>
          <span>© 2026 ElektroGenius</span>
          <span>·</span>
          <Link href="/impressum" className="transition-colors hover:text-[#8b9ab5]">Impressum</Link>
          <span>·</span>
          <Link href="/datenschutz" className="transition-colors hover:text-[#8b9ab5]">Datenschutz</Link>
        </footer>
        <MobileNav />
      </div>
    </div>
  );
}
