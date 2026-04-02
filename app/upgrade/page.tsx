"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePro } from "@/context/ProContext";
import {
  Zap, Check, Receipt, FileDown, Database, UserCheck, Calculator,
  ArrowRight, Shield, Clock, Briefcase, FileText, TrendingUp,
  Users, Headphones, Lock, Crown,
} from "lucide-react";

type Plan = "pro" | "business";

const FREE_FEATURES = [
  "Bis zu 5 Kunden",
  "Bis zu 2 Angebote",
  "Bis zu 3 Projekte",
  "Dashboard & Übersicht",
];

const PRO_FEATURES = [
  { icon: <Briefcase size={14} />, label: "Unbegrenzte Projekte & Kunden" },
  { icon: <FileText size={14} />, label: "Unbegrenzte Angebote mit PDF" },
  { icon: <Receipt size={14} />, label: "Rechnungen erstellen & senden" },
  { icon: <Clock size={14} />, label: "Zeiterfassung mit Timer" },
  { icon: <FileDown size={14} />, label: "PDF-Export (Angebote & Rechnungen)" },
  { icon: <TrendingUp size={14} />, label: "Finanzen & Buchhaltungsübersicht" },
  { icon: <Database size={14} />, label: "DATEV-Export für Steuerberater" },
  { icon: <Calculator size={14} />, label: "VDE-Rechner (Leitungsschutz)" },
  { icon: <Zap size={14} />, label: "VoltBase — Elektro-Wissensdatenbank" },
  { icon: <Shield size={14} />, label: "E-Mail-Versand mit PDF-Anhang" },
];

const BUSINESS_FEATURES = [
  { icon: <Check size={14} />, label: "Alles aus Pro" },
  { icon: <Users size={14} />, label: "Mitarbeiter & Teamverwaltung" },
  { icon: <UserCheck size={14} />, label: "Rollenbasierte Zugriffsrechte" },
  { icon: <Headphones size={14} />, label: "Prioritäts-Support (24h Antwortzeit)" },
  { icon: <Lock size={14} />, label: "Dokument-Signatur & Versionierung" },
  { icon: <Crown size={14} />, label: "White-Label (eigenes Logo & Firmenname)" },
  { icon: <TrendingUp size={14} />, label: "Erweiterte Umsatzberichte" },
];

export default function UpgradePage() {
  const { user } = useAuth();
  const { tier, plan: currentPlan, trialDaysLeft } = usePro();
  const router = useRouter();
  const [loading, setLoading] = useState<Plan | null>(null);
  const [error, setError] = useState("");

  const handleCheckout = async (plan: Plan) => {
    if (!user) { router.push("/"); return; }
    setLoading(plan);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, email: user.email, plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Fehler beim Erstellen der Checkout-Session.");
      }
    } catch {
      setError("Verbindungsfehler. Bitte versuche es erneut.");
    } finally {
      setLoading(null);
    }
  };

  const isActivePlan = (p: Plan) =>
    (tier === "pro" || tier === "business") && currentPlan === p;

  return (
    <div className="min-h-screen p-6 flex flex-col items-center" style={{ background: "#0d1b2e" }}>
      {/* Header */}
      <div className="text-center mb-10 mt-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
          style={{ background: "linear-gradient(135deg, #f5a623, #c4841c)" }}>
          <Zap size={26} style={{ color: "#0d1b2e" }} />
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
          Der richtige Plan für deinen Betrieb
        </h1>
        <p style={{ color: "#8b9ab5" }}>14 Tage kostenlos testen · Jederzeit kündbar</p>

        {tier === "trial" && (
          <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: "rgba(0,198,255,0.1)", border: "1px solid rgba(0,198,255,0.3)", color: "#00c6ff" }}>
            <Clock size={14} />
            Testphase läuft — noch {trialDaysLeft} {trialDaysLeft === 1 ? "Tag" : "Tage"} kostenlos
          </div>
        )}
      </div>

      {/* Pricing Grid */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 overflow-visible">

        {/* ── FREE ─────────────────────────────────────────────── */}
        <div className="rounded-2xl p-6 flex flex-col"
          style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#8b9ab5" }}>Free</p>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-3xl font-bold" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>0€</span>
              <span className="text-sm mb-1" style={{ color: "#8b9ab5" }}>/Monat</span>
            </div>
            <p className="text-xs" style={{ color: "#4a5568" }}>Für den Einstieg</p>
          </div>

          <ul className="space-y-2.5 flex-1 mb-6">
            {FREE_FEATURES.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "#8b9ab5" }}>
                <Check size={13} style={{ color: "#4a5568", flexShrink: 0 }} />
                {f}
              </li>
            ))}
          </ul>

          {tier === "free" ? (
            <div className="py-2.5 rounded-xl text-sm text-center font-medium"
              style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#8b9ab5" }}>
              Aktueller Plan
            </div>
          ) : (
            <div className="py-2.5 rounded-xl text-sm text-center font-medium"
              style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#4a5568" }}>
              Kostenlos
            </div>
          )}
        </div>

        {/* ── PRO ──────────────────────────────────────────────── */}
        <div className="rounded-2xl p-6 flex flex-col relative"
          style={{ background: "#1a2f50", border: "2px solid #f5a623", boxShadow: "0 0 30px rgba(245,166,35,0.12)" }}>
          {/* Beliebt Badge */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold"
            style={{ background: "linear-gradient(135deg, #f5a623, #c4841c)", color: "#0d1b2e" }}>
            Beliebt
          </div>

          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#f5a623" }}>Pro</p>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-3xl font-bold" style={{ color: "#f5a623", fontFamily: "var(--font-syne)" }}>19,99€</span>
              <span className="text-sm mb-1" style={{ color: "#8b9ab5" }}>/Monat</span>
            </div>
            <p className="text-xs" style={{ color: "#8b9ab5" }}>14 Tage kostenlos · danach 19,99€/Monat</p>
          </div>

          <ul className="space-y-2.5 flex-1 mb-6">
            {PRO_FEATURES.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "#c9d1d9" }}>
                <span className="flex items-center justify-center w-5 h-5 rounded-full shrink-0"
                  style={{ background: "rgba(245,166,35,0.15)", color: "#f5a623" }}>
                  {f.icon}
                </span>
                {f.label}
              </li>
            ))}
          </ul>

          {isActivePlan("pro") ? (
            <div className="py-2.5 rounded-xl text-sm text-center font-semibold"
              style={{ background: "rgba(63,185,80,0.15)", color: "#3fb950", border: "1px solid rgba(63,185,80,0.3)" }}>
              <Check size={14} className="inline mr-1.5" />Aktueller Plan
            </div>
          ) : (
            <button
              onClick={() => handleCheckout("pro")}
              disabled={loading !== null}
              className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #f5a623, #c4841c)", color: "#0d1b2e" }}>
              {loading === "pro"
                ? "Wird geladen…"
                : <><Zap size={15} />Jetzt starten <ArrowRight size={15} /></>}
            </button>
          )}
        </div>

        {/* ── BUSINESS ─────────────────────────────────────────── */}
        <div className="rounded-2xl p-6 flex flex-col"
          style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#00c6ff" }}>Business</p>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-3xl font-bold" style={{ color: "#00c6ff", fontFamily: "var(--font-syne)" }}>29,99€</span>
              <span className="text-sm mb-1" style={{ color: "#8b9ab5" }}>/Monat</span>
            </div>
            <p className="text-xs" style={{ color: "#8b9ab5" }}>Für Teams & wachsende Betriebe</p>
          </div>

          <ul className="space-y-2.5 flex-1 mb-6">
            {BUSINESS_FEATURES.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "#c9d1d9" }}>
                <span className="flex items-center justify-center w-5 h-5 rounded-full shrink-0"
                  style={{ background: "rgba(0,198,255,0.12)", color: "#00c6ff" }}>
                  {f.icon}
                </span>
                {f.label}
              </li>
            ))}
          </ul>

          {isActivePlan("business") ? (
            <div className="py-2.5 rounded-xl text-sm text-center font-semibold"
              style={{ background: "rgba(63,185,80,0.15)", color: "#3fb950", border: "1px solid rgba(63,185,80,0.3)" }}>
              <Check size={14} className="inline mr-1.5" />Aktueller Plan
            </div>
          ) : (
            <button
              onClick={() => handleCheckout("business")}
              disabled={loading !== null}
              className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #00c6ff, #0099cc)", color: "#0d1b2e" }}>
              {loading === "business"
                ? "Wird geladen…"
                : <><Crown size={15} />Jetzt upgraden <ArrowRight size={15} /></>}
            </button>
          )}
        </div>

      </div>

      {error && (
        <p className="mt-4 text-sm text-center" style={{ color: "#f85149" }}>{error}</p>
      )}

      {/* Trust footer */}
      <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-xs mt-8 mb-4" style={{ color: "#8b9ab5" }}>
        <span className="flex items-center gap-1"><Shield size={12} /> SSL-verschlüsselt</span>
        <span>Powered by Stripe</span>
        <span>Jederzeit kündbar</span>
      </div>

      <button onClick={() => router.back()} className="text-xs transition-all hover:underline mb-6" style={{ color: "#8b9ab5" }}>
        Zurück
      </button>
    </div>
  );
}
