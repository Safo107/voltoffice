"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, FileText, Briefcase, Clock,
  Receipt, FileDown, Database, UserCheck, Calculator,
  Zap, Settings, ChevronRight, Lock, Crown,
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
  { label: "PDF-Export", href: "/export", icon: <FileDown size={18} />, pro: true },
  { label: "DATEV-Export", href: "/datev", icon: <Database size={18} />, pro: true },
  { label: "Mitarbeiter", href: "/mitarbeiter", icon: <UserCheck size={18} />, pro: true },
  { label: "VDE-Rechner", href: "/vde-rechner", icon: <Calculator size={18} />, pro: true },
  { label: "VoltBase", href: "/voltbase", icon: <Zap size={18} />, pro: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isPro } = usePro();

  return (
    <aside
      className="flex flex-col h-full w-60 shrink-0"
      style={{ background: "#112240", borderRight: "1px solid #1e3a5f" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: "1px solid #1e3a5f" }}>
        <div
          className="flex items-center justify-center w-9 h-9 rounded-lg"
          style={{ background: "linear-gradient(135deg, #00c6ff, #0099cc)" }}
        >
          <Zap size={18} style={{ color: "#0d1b2e" }} />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
            VoltOffice
          </p>
          <p className="text-xs" style={{ color: "#8b9ab5" }}>ElektroGenius</p>
        </div>
        {isPro && (
          <span
            className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded"
            style={{ background: "rgba(245,166,35,0.2)", color: "#f5a623", border: "1px solid rgba(245,166,35,0.4)" }}
          >
            PRO
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">

        {/* Free Items */}
        <div className="space-y-0.5">
          {freeItems.map((item) => {
            const active = pathname === item.href;
            const locked = item.pro && !isPro;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: active ? "#00c6ff18" : "transparent",
                  color: active ? "#00c6ff" : "#8b9ab5",
                  border: active ? "1px solid #00c6ff33" : "1px solid transparent",
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
                    e.currentTarget.style.color = "#8b9ab5";
                  }
                }}
              >
                <span style={{ color: active ? "#00c6ff" : "inherit" }}>{item.icon}</span>
                {item.label}
                {locked && !active && <Lock size={12} className="ml-auto" style={{ color: "#f5a62388" }} />}
                {active && <ChevronRight size={14} className="ml-auto" style={{ color: "#00c6ff" }} />}
              </Link>
            );
          })}
        </div>

        {/* Pro Section */}
        <div className="mt-6">
          <div className="flex items-center gap-2 px-3 mb-2">
            {isPro && <Crown size={12} style={{ color: "#f5a623" }} />}
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: isPro ? "#f5a623" : "#8b9ab5" }}>
              Pro Features
            </span>
          </div>
          <div className="space-y-0.5">
            {proItems.map((item) => {
              if (isPro) {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: active ? "#f5a62318" : "transparent",
                      color: active ? "#f5a623" : "#8b9ab5",
                      border: active ? "1px solid #f5a62333" : "1px solid transparent",
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
                        e.currentTarget.style.color = "#8b9ab5";
                      }
                    }}
                  >
                    <span style={{ color: active ? "#f5a623" : "inherit" }}>{item.icon}</span>
                    {item.label}
                    {active && <ChevronRight size={14} className="ml-auto" style={{ color: "#f5a623" }} />}
                  </Link>
                );
              }

              return (
                <div
                  key={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-not-allowed"
                  style={{ color: "#4a5568" }}
                  title="Pro-Feature — Upgrade erforderlich"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  <Lock size={12} className="ml-auto" style={{ color: "#f5a62388" }} />
                </div>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Banner — nur wenn kein Pro */}
      {!isPro && (
        <div className="px-3 pb-3">
          <div
            className="rounded-xl p-3"
            style={{ background: "linear-gradient(135deg, #f5a62318, #f5a62308)", border: "1px solid #f5a62333" }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Zap size={14} style={{ color: "#f5a623" }} />
              <span className="text-xs font-bold" style={{ color: "#f5a623", fontFamily: "var(--font-syne)" }}>
                Auf Pro upgraden
              </span>
            </div>
            <p className="text-xs mb-2" style={{ color: "#8b9ab5" }}>
              Rechnungen, PDF-Export, DATEV & mehr.
            </p>
            <button
              onClick={() => router.push("/upgrade")}
              className="w-full py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #f5a623, #c4841c)", color: "#0d1b2e" }}
            >
              Jetzt upgraden — 9,99€/Monat
            </button>
          </div>
        </div>
      )}

      {/* Settings */}
      <div style={{ borderTop: "1px solid #1e3a5f" }} className="px-3 py-3">
        <Link
          href="/einstellungen"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
          style={{ color: pathname === "/einstellungen" ? "#00c6ff" : "#8b9ab5" }}
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
          Einstellungen
        </Link>
      </div>
    </aside>
  );
}
