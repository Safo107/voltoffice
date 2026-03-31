"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePro } from "@/context/ProContext";
import {
  Zap, Check, Receipt, FileDown, Database,
  UserCheck, Calculator, ArrowRight, Shield,
} from "lucide-react";

const proFeatures = [
  { icon: <Receipt size={16} />, label: "Rechnungen erstellen & versenden" },
  { icon: <FileDown size={16} />, label: "PDF-Export für Angebote & Rechnungen" },
  { icon: <Database size={16} />, label: "DATEV-Export für Steuerberater" },
  { icon: <UserCheck size={16} />, label: "Mitarbeiterverwaltung" },
  { icon: <Calculator size={16} />, label: "VDE-Rechner (Leitungsschutz, Querschnitt)" },
  { icon: <Zap size={16} />, label: "VoltBase — Elektro-Wissensdatenbank" },
  { icon: <Check size={16} />, label: "Unbegrenzte Kunden & Projekte" },
  { icon: <Shield size={16} />, label: "Prioritäts-Support" },
];

export default function UpgradePage() {
  const { user } = useAuth();
  const { isPro } = usePro();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpgrade = async () => {
    if (!user) { router.push("/"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, email: user.email }),
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
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "#0d1b2e" }}
    >
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg, #f5a623, #c4841c)" }}
          >
            <Zap size={26} style={{ color: "#0d1b2e" }} />
          </div>
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}
          >
            VoltOffice Pro
          </h1>
          <p style={{ color: "#8b9ab5" }}>
            Alles was dein Elektrobetrieb braucht — in einer App.
          </p>
        </div>

        {/* Pricing Card */}
        <div
          className="rounded-2xl p-6 mb-4"
          style={{
            background: "#112240",
            border: "1px solid #1e3a5f",
          }}
        >
          {/* Price */}
          <div className="flex items-end gap-1 mb-1">
            <span
              className="text-4xl font-bold"
              style={{ color: "#f5a623", fontFamily: "var(--font-syne)" }}
            >
              €29
            </span>
            <span className="text-sm mb-2" style={{ color: "#8b9ab5" }}>/Monat</span>
          </div>
          <p className="text-xs mb-6" style={{ color: "#8b9ab5" }}>
            Monatlich kündbar · keine Bindung · sofort aktiv
          </p>

          {/* Features */}
          <ul className="space-y-3 mb-6">
            {proFeatures.map((f, i) => (
              <li key={i} className="flex items-center gap-3">
                <span
                  className="flex items-center justify-center w-6 h-6 rounded-full shrink-0"
                  style={{ background: "rgba(245,166,35,0.15)", color: "#f5a623" }}
                >
                  {f.icon}
                </span>
                <span className="text-sm" style={{ color: "#c9d1d9" }}>{f.label}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          {isPro ? (
            <div
              className="w-full py-3 rounded-xl text-center text-sm font-semibold"
              style={{ background: "rgba(63,185,80,0.15)", color: "#3fb950", border: "1px solid rgba(63,185,80,0.3)" }}
            >
              ✓ Du hast bereits Pro aktiv
            </div>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #f5a623, #c4841c)", color: "#0d1b2e" }}
            >
              {loading ? (
                <span>Wird geladen...</span>
              ) : (
                <>
                  Jetzt upgraden <ArrowRight size={16} />
                </>
              )}
            </button>
          )}

          {error && (
            <p className="text-xs text-center mt-3" style={{ color: "#f85149" }}>{error}</p>
          )}
        </div>

        {/* Trust */}
        <div className="flex items-center justify-center gap-6 text-xs" style={{ color: "#8b9ab5" }}>
          <span className="flex items-center gap-1"><Shield size={12} /> SSL-verschlüsselt</span>
          <span>Powered by Stripe</span>
          <span>Jederzeit kündbar</span>
        </div>

        <div className="text-center mt-4">
          <button
            onClick={() => router.back()}
            className="text-xs transition-all hover:underline"
            style={{ color: "#8b9ab5" }}
          >
            Zurück
          </button>
        </div>
      </div>
    </div>
  );
}
