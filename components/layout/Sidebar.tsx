"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Users, FileText, Briefcase, Clock,
  Receipt, FileDown, Database, UserCheck, Calculator,
  Zap, Settings, ChevronRight, Lock, Crown,
  ChevronLeft, PanelLeftClose, PanelLeftOpen, TrendingUp,
} from "lucide-react";
import { usePro } from "@/context/ProContext";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  pro?: boolean;
}

const freeItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
  { label: "Kunden", href: "/kunden", icon: <Users size={18} /> },
  { label: "Angebote", href: "/angebote", icon: <FileText size={18} /> },
  { label: "Projekte", href: "/projekte", icon: <Briefcase size={18} /> },
  { label: "Zeiterfassung", href: "/zeiterfassung", icon: <Clock size={18} />, pro: true },
];

const proItems: NavItem[] = [
  { label: "Rechnungen", href: "/rechnungen", icon: <Receipt size={18} />, pro: true },
  { label: "Finanzen", href: "/finance", icon: <TrendingUp size={18} />, pro: true },
  { label: "PDF-Export", href: "/export", icon: <FileDown size={18} />, pro: true },
  { label: "DATEV-Export", href: "/datev", icon: <Database size={18} />, pro: true },
  { label: "Mitarbeiter", href: "/mitarbeiter", icon: <UserCheck size={18} />, pro: true },
  { label: "VDE-Rechner", href: "/vde-rechner", icon: <Calculator size={18} />, pro: true },
  { label: "VoltBase", href: "/voltbase", icon: <Zap size={18} />, pro: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isPro, isTrial, trialDaysLeft, tier } = usePro();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("sidebar_collapsed");
      if (stored !== null) setCollapsed(stored === "1");
    } catch { /* ignore */ }
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem("sidebar_collapsed", next ? "1" : "0"); } catch { /* ignore */ }
  };

  const trialUrgent = isTrial && trialDaysLeft <= 3;
  const w = collapsed ? "w-16" : "w-60";

  const navLink = (item: NavItem, accentColor = "#00c6ff") => {
    const active = pathname === item.href;
    const locked = item.pro && !isPro;
    return (
      <Link
        key={item.href}
        href={item.href}
        title={collapsed ? item.label : undefined}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
        style={{
          background: active ? `${accentColor}18` : "transparent",
          color: active ? accentColor : "#8b9ab5",
          border: active ? `1px solid ${accentColor}33` : "1px solid transparent",
          justifyContent: collapsed ? "center" : undefined,
        }}
        onMouseEnter={(e) => {
          if (!active) {
            e.currentTarget.style.background = "#ffffff0a";
            e.currentTarget.style.color = "#e6edf3";
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = active ? accentColor : "#8b9ab5";
          }
        }}
      >
        <span style={{ color: active ? accentColor : "inherit", flexShrink: 0 }}>{item.icon}</span>
        {!collapsed && <span className="truncate">{item.label}</span>}
        {!collapsed && locked && !active && <Lock size={12} className="ml-auto" style={{ color: "#f5a62388" }} />}
        {!collapsed && active && <ChevronRight size={14} className="ml-auto" style={{ color: accentColor }} />}
      </Link>
    );
  };

  const lockedLink = (item: NavItem) => (
    <div
      key={item.href}
      title={collapsed ? item.label : undefined}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-not-allowed"
      style={{ color: "#4a5568", justifyContent: collapsed ? "center" : undefined }}
    >
      <span style={{ flexShrink: 0 }}>{item.icon}</span>
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && <Lock size={12} className="ml-auto" style={{ color: "#f5a62388" }} />}
    </div>
  );

  return (
    <aside
      className={`hidden md:flex flex-col h-full ${w} shrink-0 transition-all duration-200`}
      style={{ background: "#112240", borderRight: "1px solid #1e3a5f" }}
    >
      {/* Logo + Collapse Toggle */}
      <div
        className="flex items-center px-3 py-4"
        style={{ borderBottom: "1px solid #1e3a5f", gap: collapsed ? 0 : "0.75rem", justifyContent: collapsed ? "center" : undefined }}
      >
        <div
          className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
          style={{ background: "linear-gradient(135deg, #00c6ff, #0099cc)" }}
        >
          <Zap size={18} style={{ color: "#0d1b2e" }} />
        </div>

        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-tight truncate" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
                VoltOffice
              </p>
              <p className="text-xs" style={{ color: "#8b9ab5" }}>ElektroGenius</p>
            </div>
            {(tier === "pro" || tier === "business") && (
              <span className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0"
                style={{ background: "rgba(245,166,35,0.2)", color: "#f5a623", border: "1px solid rgba(245,166,35,0.4)" }}>
                {tier === "business" ? "BIZ" : "PRO"}
              </span>
            )}
            {isTrial && (
              <span className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0"
                style={{
                  background: trialUrgent ? "rgba(239,68,68,0.2)" : "rgba(0,198,255,0.15)",
                  color: trialUrgent ? "#ef4444" : "#00c6ff",
                  border: `1px solid ${trialUrgent ? "rgba(239,68,68,0.4)" : "rgba(0,198,255,0.35)"}`,
                }}>
                TRIAL
              </span>
            )}
          </>
        )}

        <button
          onClick={toggleCollapsed}
          className="flex items-center justify-center w-7 h-7 rounded-lg transition-all shrink-0"
          style={{ color: "#4a6fa5", background: "transparent", marginLeft: collapsed ? 0 : "auto" }}
          title={collapsed ? "Sidebar aufklappen" : "Sidebar einklappen"}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#ffffff0a"; e.currentTarget.style.color = "#e6edf3"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4a6fa5"; }}
        >
          {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <div className="space-y-0.5">
          {freeItems.map((item) => navLink(item, "#00c6ff"))}
        </div>

        {/* Pro Section */}
        <div className="mt-6">
          {!collapsed && (
            <div className="flex items-center gap-2 px-3 mb-2">
              {(tier === "pro" || tier === "business") && <Crown size={12} style={{ color: "#f5a623" }} />}
              <span className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: (tier === "pro" || tier === "business") ? "#f5a623" : "#8b9ab5" }}>
                Pro Features
              </span>
            </div>
          )}
          {collapsed && <div className="border-t mx-2 mb-2" style={{ borderColor: "#1e3a5f" }} />}
          <div className="space-y-0.5">
            {proItems.map((item) =>
              isPro ? navLink(item, "#f5a623") : lockedLink(item)
            )}
          </div>
        </div>
      </nav>

      {/* Trial / Upgrade Banners — nur wenn nicht collapsed */}
      {!collapsed && isTrial && (
        <div className="px-3 pb-3">
          <div className="rounded-xl p-3"
            style={{
              background: trialUrgent ? "rgba(239,68,68,0.08)" : "rgba(0,198,255,0.08)",
              border: `1px solid ${trialUrgent ? "rgba(239,68,68,0.3)" : "rgba(0,198,255,0.25)"}`,
            }}>
            <div className="flex items-center gap-2 mb-1">
              <Zap size={14} style={{ color: trialUrgent ? "#ef4444" : "#00c6ff" }} />
              <span className="text-xs font-bold"
                style={{ color: trialUrgent ? "#ef4444" : "#00c6ff", fontFamily: "var(--font-syne)" }}>
                {trialDaysLeft === 0 ? "Trial endet heute!" : `Noch ${trialDaysLeft} Trial-${trialDaysLeft === 1 ? "Tag" : "Tage"}`}
              </span>
            </div>
            <p className="text-xs mb-2" style={{ color: "#8b9ab5" }}>
              {trialUrgent ? "Jetzt upgraden und alle Features behalten." : "Alle Pro-Features kostenlos testen."}
            </p>
            <button onClick={() => router.push("/upgrade")}
              className="w-full py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #f5a623, #c4841c)", color: "#0d1b2e" }}>
              Pro — 19,99€/Monat
            </button>
          </div>
        </div>
      )}

      {!collapsed && !isPro && !isTrial && (
        <div className="px-3 pb-3">
          <div className="rounded-xl p-3"
            style={{ background: "linear-gradient(135deg, #f5a62318, #f5a62308)", border: "1px solid #f5a62333" }}>
            <div className="flex items-center gap-2 mb-1">
              <Zap size={14} style={{ color: "#f5a623" }} />
              <span className="text-xs font-bold" style={{ color: "#f5a623", fontFamily: "var(--font-syne)" }}>
                Auf Pro upgraden
              </span>
            </div>
            <p className="text-xs mb-2" style={{ color: "#8b9ab5" }}>
              Rechnungen, PDF-Export, DATEV & mehr.
            </p>
            <button onClick={() => router.push("/upgrade")}
              className="w-full py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #f5a623, #c4841c)", color: "#0d1b2e" }}>
              Jetzt upgraden — ab 19,99€/Monat
            </button>
          </div>
        </div>
      )}

      {/* Settings */}
      <div style={{ borderTop: "1px solid #1e3a5f" }} className="px-2 py-3">
        <Link
          href="/einstellungen"
          title={collapsed ? "Einstellungen" : undefined}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
          style={{
            color: pathname === "/einstellungen" ? "#00c6ff" : "#8b9ab5",
            justifyContent: collapsed ? "center" : undefined,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#ffffff0a";
            e.currentTarget.style.color = "#e6edf3";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = pathname === "/einstellungen" ? "#00c6ff" : "#8b9ab5";
          }}
        >
          <Settings size={18} />
          {!collapsed && "Einstellungen"}
        </Link>
      </div>
    </aside>
  );
}
