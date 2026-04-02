"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/authFetch";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import Modal from "@/components/ui/Modal";
import { usePro } from "@/context/ProContext";
import {
  Users, FileText, Briefcase, Clock, AlertCircle, ArrowRight,
  Search, X, Zap, Calculator, AlertTriangle, CheckCircle,
  TrendingUp, Receipt, Euro,
} from "lucide-react";
import WorkdayProgressWidget from "@/components/widgets/WorkdayProgressWidget";
import WeatherWidget from "@/components/widgets/WeatherWidget";
import OpenInvoicesWidget from "@/components/widgets/OpenInvoicesWidget";
import TodayOnSiteWidget from "@/components/widgets/TodayOnSiteWidget";
import { berechneIb, getIz, getTempFaktor, getHaeufungFaktor } from "@/lib/vde-tables";

// ─── Typen ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  customerCount: number; customerLimit: number;
  offerCount: number; offerLimit: number;
  projectCount: number; projectLimit: number;
  hoursThisWeek: number; openOfferValue: number;
  totalRevenue: number; openInvoicesTotal: number;
  openInvoicesCount: number; totalHours: number;
  zeitkosten: number; gewinn: number;
}
interface OpenOffer {
  _id?: string; number: string; customerName: string; total: number; status: string;
}
interface Projekt {
  _id?: string; name: string; status: string; customerName?: string; createdAt?: string;
}
interface Kunde {
  _id?: string; name: string; email?: string;
}

// ─── Omni-Search Modal ────────────────────────────────────────────────────────

function OmniSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ type: string; label: string; sub: string; href: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) { setQuery(""); setResults([]); return; }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const q = query.toLowerCase();
    setLoading(true);
    Promise.all([
      authFetch("/api/projekte").then(r => r.json()).catch(() => []),
      authFetch("/api/kunden").then(r => r.json()).catch(() => []),
      authFetch("/api/angebote").then(r => r.json()).catch(() => []),
    ]).then(([projekte, kunden, angebote]) => {
      const hits: typeof results = [];
      (projekte as Projekt[]).forEach(p => {
        if ((p.name || "").toLowerCase().includes(q) || (p.customerName || "").toLowerCase().includes(q))
          hits.push({ type: "Projekt", label: p.name, sub: p.customerName || "", href: "/projekte" });
      });
      (kunden as Kunde[]).forEach(k => {
        if ((k.name || "").toLowerCase().includes(q) || (k.email || "").toLowerCase().includes(q))
          hits.push({ type: "Kunde", label: k.name, sub: k.email || "", href: "/kunden" });
      });
      (angebote as OpenOffer[]).forEach(a => {
        if ((a.number || "").toLowerCase().includes(q) || (a.customerName || "").toLowerCase().includes(q))
          hits.push({ type: "Angebot", label: `Angebot #${a.number}`, sub: a.customerName, href: "/angebote" });
      });
      setResults(hits.slice(0, 8));
    }).finally(() => setLoading(false));
  }, [query]);

  const typeColor: Record<string, string> = {
    Projekt: "#22c55e", Kunde: "#00c6ff", Angebot: "#f5a623",
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "#0f2035", border: "1px solid #1e3a5f" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "#1e3a5f" }}>
          <Search size={18} style={{ color: "#00c6ff", flexShrink: 0 }} />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Projekte, Kunden, Angebote suchen…"
            className="flex-1 outline-none text-sm bg-transparent"
            style={{ color: "#e6edf3" }}
            onKeyDown={e => { if (e.key === "Escape") onClose(); }}
          />
          {loading
            ? <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#00c6ff44", borderTopColor: "#00c6ff" }} />
            : <kbd className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#1e3a5f", color: "#8b9ab5" }}>Esc</kbd>
          }
        </div>

        {/* Ergebnisse */}
        {results.length > 0 ? (
          <div className="py-2">
            {results.map((r, i) => (
              <button key={i} onClick={() => { router.push(r.href); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all"
                style={{ color: "#e6edf3" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#00c6ff0a"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                <span className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0"
                  style={{ background: `${typeColor[r.type]}18`, color: typeColor[r.type], border: `1px solid ${typeColor[r.type]}33` }}>
                  {r.type}
                </span>
                <span className="text-sm font-medium truncate">{r.label}</span>
                {r.sub && <span className="text-xs truncate ml-auto" style={{ color: "#8b9ab5" }}>{r.sub}</span>}
              </button>
            ))}
          </div>
        ) : query.trim() ? (
          <div className="py-8 text-center text-sm" style={{ color: "#8b9ab5" }}>Keine Ergebnisse für „{query}"</div>
        ) : (
          <div className="py-6 text-center text-xs" style={{ color: "#4a6fa5" }}>
            Suche nach Projekten, Kunden oder Angeboten
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Quick VDE-Tool (Mini Ib-Rechner) ────────────────────────────────────────

function QuickVdeTool() {
  const router = useRouter();
  const [leistung, setLeistung] = useState(3000);
  const [phasig, setPhasig] = useState(3);
  const [cosPhi, setCosPhi] = useState(0.9);
  const [qs, setQs] = useState(2.5);

  const ib = useMemo(() => berechneIb(leistung, phasig === 3 ? 400 : 230, cosPhi, phasig), [leistung, phasig, cosPhi]);
  const iz = useMemo(() => getIz(qs, "B2", "cu", "pvc") * getTempFaktor(30, "pvc") * getHaeufungFaktor(1), [qs]);
  const ok = ib <= iz;

  return (
    <div className="rounded-xl p-5" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calculator size={16} style={{ color: "#00c6ff" }} />
          <h2 className="text-sm font-bold" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
            Quick-Tool: Leitungsdimensionierung
          </h2>
        </div>
        <button onClick={() => router.push("/vde-rechner")}
          className="text-xs flex items-center gap-1 transition-colors"
          style={{ color: "#00c6ff" }}
          onMouseEnter={e => { (e.target as HTMLElement).style.opacity = "0.7"; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.opacity = "1"; }}
        >
          Vollrechner <ArrowRight size={12} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs mb-1" style={{ color: "#8b9ab5" }}>Leistung (W)</label>
          <input type="number" inputMode="decimal" value={leistung}
            onChange={e => setLeistung(+e.target.value || 0)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3", minHeight: 40 }}
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "#8b9ab5" }}>Querschnitt (mm²)</label>
          <select value={qs} onChange={e => setQs(+e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none appearance-none"
            style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3", minHeight: 40 }}
          >
            {[1.5,2.5,4,6,10,16,25,35,50].map(q => <option key={q} value={q}>{q} mm²</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs mb-1" style={{ color: "#8b9ab5" }}>System</label>
          <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid #1e3a5f" }}>
            {[{ v: 1, l: "1~ 230V" }, { v: 3, l: "3~ 400V" }].map(({ v, l }) => (
              <button key={v} onClick={() => setPhasig(v)}
                className="flex-1 py-2 text-xs font-bold transition-all"
                style={{
                  background: phasig === v ? "#00c6ff22" : "#0d1b2e",
                  color: phasig === v ? "#00c6ff" : "#8b9ab5",
                  minHeight: 40,
                }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs mb-1" style={{ color: "#8b9ab5" }}>cos φ</label>
          <input type="number" inputMode="decimal" value={cosPhi} min={0.1} max={1} step={0.01}
            onChange={e => setCosPhi(Math.min(1, Math.max(0.1, +e.target.value || 0.9)))}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3", minHeight: 40 }}
          />
        </div>
      </div>

      {/* Ergebnis */}
      <div className="flex items-center justify-between p-3 rounded-xl"
        style={{ background: ok ? "rgba(34,197,94,.06)" : "rgba(239,68,68,.06)", border: `1px solid ${ok ? "#22c55e33" : "#ef444433"}` }}
      >
        <div>
          <p className="text-xs mb-0.5" style={{ color: "#8b9ab5" }}>Betriebsstrom Ib</p>
          <p className="text-xl font-bold" style={{ color: "#00c6ff", fontFamily: "var(--font-syne)" }}>
            {ib.toFixed(2)} A
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs mb-0.5" style={{ color: "#8b9ab5" }}>Iz ({qs} mm², B2/Cu/PVC)</p>
          <p className="text-xl font-bold" style={{ color: ok ? "#22c55e" : "#ef4444", fontFamily: "var(--font-syne)" }}>
            {iz.toFixed(1)} A
          </p>
        </div>
        <div className="flex items-center justify-center w-9 h-9 rounded-full"
          style={{ background: ok ? "#22c55e18" : "#ef444418" }}
        >
          {ok
            ? <CheckCircle size={18} style={{ color: "#22c55e" }} />
            : <AlertTriangle size={18} style={{ color: "#ef4444" }} />
          }
        </div>
      </div>
      <p className="text-xs mt-2 text-center" style={{ color: "#4a6fa5" }}>
        Defaults: B2 · Cu · PVC · 30°C · 1 Kabel — Vollrechner für alle Parameter
      </p>
    </div>
  );
}

// ─── Haupt-Dashboard ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { isPro } = usePro();
  const [activityModal, setActivityModal] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [openOffers, setOpenOffers] = useState<OpenOffer[]>([]);
  const [recentProjekte, setRecentProjekte] = useState<Projekt[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [period, setPeriod] = useState<"week" | "month" | "all">("month");

  useEffect(() => {
    setLoadingStats(true);
    const load = async () => {
      try {
        const [statsRes, offersRes, projekteRes] = await Promise.all([
          authFetch(`/api/dashboard?period=${period}`),
          authFetch("/api/angebote"),
          authFetch("/api/projekte"),
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (offersRes.ok) {
          const all: OpenOffer[] = await offersRes.json();
          setOpenOffers(all.filter(a => a.status === "draft" || a.status === "sent").slice(0, 3));
        }
        if (projekteRes.ok) {
          const all: Projekt[] = await projekteRes.json();
          setRecentProjekte(all.slice(0, 3));
        }
      } catch { /* ignore */ }
      finally { setLoadingStats(false); }
    };
    load();
  }, [period]);

  // Cmd/Ctrl+K → Search
  const handleKeydown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setSearchOpen(true);
    }
  }, []);
  useEffect(() => {
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [handleKeydown]);

  const s = stats;
  // -1 means unlimited (Pro/Business plans)
  const effectiveOfferLimit    = (s?.offerLimit    ?? -1) === -1 ? undefined : s?.offerLimit;
  const effectiveProjectLimit  = (s?.projectLimit  ?? -1) === -1 ? undefined : s?.projectLimit;
  const effectiveCustomerLimit = (s?.customerLimit ?? -1) === -1 ? undefined : s?.customerLimit;

  // Action-Alerts berechnen (only shown when finite limits exist)
  const alerts: { type: "warn" | "error"; text: string; href: string }[] = [];
  if (s) {
    if (effectiveOfferLimit !== undefined) {
      if (s.offerCount >= effectiveOfferLimit)
        alerts.push({ type: "error", text: `Angebots-Limit erreicht (${s.offerCount}/${effectiveOfferLimit}) — Upgrade erforderlich`, href: "/upgrade" });
      else if (s.offerCount >= effectiveOfferLimit - 1)
        alerts.push({ type: "warn", text: `Nur noch 1 Angebot im Free-Plan verfügbar (${s.offerCount}/${effectiveOfferLimit})`, href: "/upgrade" });
    }
    if (effectiveProjectLimit !== undefined && s.projectCount >= effectiveProjectLimit)
      alerts.push({ type: "error", text: `Projekt-Limit erreicht (${s.projectCount}/${effectiveProjectLimit})`, href: "/upgrade" });
    if (effectiveCustomerLimit !== undefined && s.customerCount >= effectiveCustomerLimit)
      alerts.push({ type: "error", text: `Kunden-Limit erreicht (${s.customerCount}/${effectiveCustomerLimit})`, href: "/upgrade" });
  }

  const statusLabel: Record<string, string> = {
    active: "Aktiv", completed: "Abgeschlossen", paused: "Pausiert",
  };
  const statusColor: Record<string, string> = {
    active: "#22c55e", completed: "#00c6ff", paused: "#f5a623",
  };

  return (
    <DashboardLayout title="Dashboard" subtitle="Übersicht Ihres Betriebs">

      {/* ── Action-Alerts ── */}
      {alerts.length > 0 && (
        <div className="space-y-2 mb-5">
          {alerts.map((alert, i) => (
            <button key={i} onClick={() => router.push(alert.href)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
              style={{
                background: alert.type === "error" ? "rgba(239,68,68,.07)" : "rgba(245,166,35,.07)",
                border: `1px solid ${alert.type === "error" ? "rgba(239,68,68,.3)" : "rgba(245,166,35,.3)"}`,
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
            >
              <AlertCircle size={16} style={{ color: alert.type === "error" ? "#ef4444" : "#f5a623", flexShrink: 0 }} />
              <span className="text-sm" style={{ color: alert.type === "error" ? "#f87171" : "#f5a623" }}>
                {alert.text}
              </span>
              <ArrowRight size={14} className="ml-auto shrink-0" style={{ color: "#8b9ab5" }} />
            </button>
          ))}
        </div>
      )}

      {/* ── Omni-Search Trigger ── */}
      <button onClick={() => setSearchOpen(true)}
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl mb-5 text-left transition-all"
        style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#8b9ab5" }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "#00c6ff44"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
      >
        <Search size={15} style={{ color: "#4a6fa5" }} />
        <span className="text-sm flex-1">Suche: Projekte, Kunden, Angebote…</span>
        <kbd className="text-xs px-1.5 py-0.5 rounded hidden sm:block"
          style={{ background: "#1e3a5f", color: "#8b9ab5" }}>
          ⌘K
        </kbd>
      </button>

      {/* ── Betriebskennzahlen ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
            Betriebskennzahlen
          </h2>
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
            {(["week", "month", "all"] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className="px-3 py-1 rounded-md text-xs font-medium transition-all"
                style={{
                  background: period === p ? "#00c6ff" : "transparent",
                  color: period === p ? "#0d1b2e" : "#8b9ab5",
                }}>
                {p === "week" ? "Woche" : p === "month" ? "Monat" : "Gesamt"}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            {
              label: "Umsatz", icon: <TrendingUp size={18} />, color: "#00c6ff",
              value: loadingStats ? "…" : `${(s?.totalRevenue ?? 0).toLocaleString("de-DE", { minimumFractionDigits: 0 })} €`,
              sub: "Alle Rechnungen",
            },
            {
              label: "Offene Rechnungen", icon: <Receipt size={18} />, color: "#f5a623",
              value: loadingStats ? "…" : `${(s?.openInvoicesTotal ?? 0).toLocaleString("de-DE", { minimumFractionDigits: 0 })} €`,
              sub: `${s?.openInvoicesCount ?? 0} ausstehend`,
            },
            {
              label: "Stunden", icon: <Clock size={18} />, color: "#22c55e",
              value: loadingStats ? "…" : `${(s?.totalHours ?? 0).toFixed(1)}h`,
              sub: "Erfasste Arbeitszeit",
            },
            {
              label: "Ergebnis", icon: <Euro size={18} />, color: (s?.gewinn ?? 0) >= 0 ? "#22c55e" : "#ef4444",
              value: loadingStats ? "…" : `${(s?.gewinn ?? 0) >= 0 ? "+" : ""}${(s?.gewinn ?? 0).toLocaleString("de-DE", { minimumFractionDigits: 0 })} €`,
              sub: "Umsatz – Mitarbeiterkosten",
            },
          ].map((k) => (
            <div key={k.label} className="rounded-xl p-4" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: k.color }}>{k.icon}</span>
                <span className="text-xs" style={{ color: "#4a6fa5" }}>{k.sub}</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: k.color, fontFamily: "var(--font-syne)" }}>{k.value}</p>
              <p className="text-xs mt-0.5" style={{ color: "#8b9ab5" }}>{k.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Kunden" value={loadingStats ? "…" : String(s?.customerCount ?? 0)}
          icon={<Users size={20} />} accent="cyan" current={s?.customerCount} limit={effectiveCustomerLimit}
          sublabel={effectiveCustomerLimit === undefined ? "Unbegrenzt" : `Free: bis ${effectiveCustomerLimit}`} />
        <StatCard label="Offene Angebote" value={loadingStats ? "…" : String(s?.offerCount ?? 0)}
          icon={<FileText size={20} />} accent="orange" current={s?.offerCount} limit={effectiveOfferLimit}
          sublabel={s?.openOfferValue ? `${(s.openOfferValue).toLocaleString("de-DE")} €` : "–"} />
        <StatCard label="Projekte" value={loadingStats ? "…" : String(s?.projectCount ?? 0)}
          icon={<Briefcase size={20} />} accent="green" current={s?.projectCount} limit={effectiveProjectLimit}
          sublabel={effectiveProjectLimit === undefined ? "Unbegrenzt" : `Free: bis ${effectiveProjectLimit}`} />
        <StatCard label="Stunden (Woche)" value={loadingStats ? "…" : `${s?.hoursThisWeek ?? 0}h`}
          icon={<Clock size={20} />} accent="muted" sublabel="Zeiterfassung" />
      </div>

      {/* ── Widgets ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        <WorkdayProgressWidget />
        <TodayOnSiteWidget />
        <WeatherWidget />
        <OpenInvoicesWidget />
      </div>

      {/* ── Quick Resume: Letzte Projekte ── */}
      {recentProjekte.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
              <Briefcase size={15} style={{ color: "#22c55e" }} /> Zuletzt bearbeitet
            </h2>
            <button onClick={() => router.push("/projekte")}
              className="text-xs flex items-center gap-1" style={{ color: "#00c6ff" }}>
              Alle <ArrowRight size={12} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recentProjekte.map(p => (
              <button key={p._id || p.name} onClick={() => router.push("/projekte")}
                className="text-left p-4 rounded-xl transition-all"
                style={{ background: "#112240", border: "1px solid #1e3a5f" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#22c55e44"; e.currentTarget.style.background = "#22c55e08"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e3a5f"; e.currentTarget.style.background = "#112240"; }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                    style={{ background: `${statusColor[p.status] ?? "#8b9ab5"}18`, color: statusColor[p.status] ?? "#8b9ab5", border: `1px solid ${statusColor[p.status] ?? "#8b9ab5"}33` }}>
                    {statusLabel[p.status] ?? p.status}
                  </span>
                </div>
                <p className="text-sm font-semibold truncate" style={{ color: "#e6edf3" }}>{p.name}</p>
                {p.customerName && (
                  <p className="text-xs mt-0.5 truncate" style={{ color: "#8b9ab5" }}>{p.customerName}</p>
                )}
                {p.createdAt && (
                  <p className="text-xs mt-1" style={{ color: "#4a6fa5" }}>
                    {new Date(p.createdAt).toLocaleDateString("de-DE")}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Two-column ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        {/* Offene Angebote */}
        <div className="space-y-4">
          <div className="rounded-xl p-5" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>Offene Angebote</h2>
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "#f5a62322", color: "#f5a623", border: "1px solid #f5a62344" }}>
                {openOffers.length} offen
              </span>
            </div>
            {openOffers.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: "#8b9ab5" }}>Keine offenen Angebote</p>
            ) : (
              <div className="space-y-2">
                {openOffers.map(offer => (
                  <div key={offer._id || offer.number}
                    className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all"
                    style={{ background: "#0d1b2e", border: "1px solid #1e3a5f" }}
                    onClick={() => router.push("/angebote")}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#00c6ff33"; e.currentTarget.style.background = "#00c6ff08"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e3a5f"; e.currentTarget.style.background = "#0d1b2e"; }}
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#e6edf3" }}>#{offer.number}</p>
                      <p className="text-xs" style={{ color: "#8b9ab5" }}>{offer.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold" style={{ color: "#00c6ff" }}>
                        {(offer.total || 0).toLocaleString("de-DE")} €
                      </p>
                      <span className="text-xs px-1.5 py-0.5 rounded"
                        style={offer.status === "sent"
                          ? { background: "#00c6ff18", color: "#00c6ff" }
                          : { background: "#8b9ab518", color: "#8b9ab5" }}>
                        {offer.status === "sent" ? "Versendet" : "Entwurf"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Schnellaktionen */}
          <div className="rounded-xl p-5" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
            <h2 className="text-sm font-bold mb-3" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>Schnellaktionen</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Angebot erstellen", icon: <FileText size={14} />, color: "#00c6ff", href: "/angebote" },
                { label: "Kunde anlegen",    icon: <Users size={14} />,    color: "#f5a623", href: "/kunden" },
                { label: "Zeit erfassen",    icon: <Clock size={14} />,    color: "#22c55e", href: "/zeiterfassung" },
                { label: "VDE-Rechner",      icon: <Zap size={14} />,      color: "#f5a623", href: "/vde-rechner" },
              ].map(action => (
                <button key={action.label} onClick={() => router.push(action.href)}
                  className="flex items-center gap-2 p-3 rounded-lg text-xs font-medium text-left transition-all"
                  style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${action.color}44`; e.currentTarget.style.background = `${action.color}0a`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e3a5f"; e.currentTarget.style.background = "#0d1b2e"; }}
                >
                  <span style={{ color: action.color }}>{action.icon}</span>
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick VDE-Tool */}
        <QuickVdeTool />
      </div>

      {/* Omni-Search Modal */}
      <OmniSearch open={searchOpen} onClose={() => setSearchOpen(false)} />

      <Modal open={activityModal} onClose={() => setActivityModal(false)} title="Alle Aktivitäten">
        <div className="flex flex-col items-center justify-center py-10 gap-3" style={{ color: "#4a5568" }}>
          <Clock size={28} />
          <p className="text-sm" style={{ color: "#8b9ab5" }}>Aktivitäts-Feed kommt bald.</p>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
