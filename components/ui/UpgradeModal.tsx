"use client";

import { useRouter } from "next/navigation";
import { Zap, ArrowRight, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  resource?: string;
  limit?: number;
}

const RESOURCE_LABELS: Record<string, string> = {
  kunden:     "Kunden",
  angebote:   "Angebote",
  projekte:   "Projekte",
  rechnungen: "Rechnungen",
  mitarbeiter:"Mitarbeiter",
};

export default function UpgradeModal({ open, onClose, resource, limit }: Props) {
  const router = useRouter();
  if (!open) return null;

  const label = resource ? RESOURCE_LABELS[resource] ?? resource : "dieses Feature";
  const limitText = limit !== undefined && limit > 0 ? ` (max. ${limit})` : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 relative"
        style={{ background: "#112240", border: "1px solid #f5a62355", boxShadow: "0 0 40px rgba(245,166,35,0.15)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg transition-all"
          style={{ color: "#4a5568" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#e6edf3"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#4a5568"; }}
        >
          <X size={16} />
        </button>

        {/* Icon */}
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
          style={{ background: "linear-gradient(135deg, #f5a62320, #f5a62308)", border: "1px solid #f5a62344" }}>
          <Zap size={22} style={{ color: "#f5a623" }} />
        </div>

        <h2 className="text-lg font-bold mb-1" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
          Limit erreicht
        </h2>
        <p className="text-sm mb-5" style={{ color: "#8b9ab5" }}>
          Du hast die maximale Anzahl an {label}{limitText} im Free-Plan erreicht.
          Upgrade auf Pro für unbegrenzten Zugriff.
        </p>

        <div className="space-y-2 mb-5">
          {["Unbegrenzte Kunden, Angebote & Projekte", "Rechnungen & PDF-Export", "DATEV-Export & Buchhaltung"].map((f) => (
            <div key={f} className="flex items-center gap-2 text-xs" style={{ color: "#c9d1d9" }}>
              <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "rgba(245,166,35,0.15)", color: "#f5a623" }}>✓</span>
              {f}
            </div>
          ))}
        </div>

        <button
          onClick={() => { onClose(); router.push("/upgrade"); }}
          className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #f5a623, #c4841c)", color: "#0d1b2e" }}
        >
          <Zap size={15} /> Jetzt upgraden — ab 19,99€/Monat <ArrowRight size={15} />
        </button>

        <p className="text-xs text-center mt-2" style={{ color: "#4a5568" }}>
          14 Tage kostenlos testen · Jederzeit kündbar
        </p>
      </div>
    </div>
  );
}
