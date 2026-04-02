"use client";

import { useState } from "react";
import { authFetch } from "@/lib/authFetch";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { usePro } from "@/context/ProContext";
import { useRouter } from "next/navigation";
import { Database, Download, FileText, Receipt, Loader, Lock, Zap, CheckCircle } from "lucide-react";

export default function DatevPage() {
  const { isPro, loadingPro } = usePro();
  const router = useRouter();
  const [exporting, setExporting] = useState<string | null>(null);
  const [exported, setExported] = useState<string | null>(null);

  const doExport = async (type: "rechnungen" | "angebote") => {
    setExporting(type);
    setExported(null);
    try {
      const res = await authFetch(`/api/datev/export?type=${type}`);
      if (!res.ok) throw new Error("Fehler");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `DATEV-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setExported(type);
      setTimeout(() => setExported(null), 3000);
    } finally {
      setExporting(null);
    }
  };

  if (loadingPro) {
    return (
      <DashboardLayout title="DATEV-Export" subtitle="Pro-Feature">
        <div className="flex items-center justify-center py-24">
          <Loader size={24} className="animate-spin" style={{ color: "#00c6ff" }} />
        </div>
      </DashboardLayout>
    );
  }

  if (!isPro) {
    return (
      <DashboardLayout title="DATEV-Export" subtitle="Pro-Feature">
        <div className="flex flex-col items-center justify-center py-24 gap-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-full" style={{ background: "#f5a62322", border: "1px solid #f5a62366" }}>
            <Lock size={28} style={{ color: "#f5a623" }} />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
              DATEV-Export — Pro-Feature
            </h2>
            <p className="text-sm" style={{ color: "#8b9ab5" }}>
              Exportiere Rechnungen und Angebote als DATEV-kompatibles CSV für deinen Steuerberater.
            </p>
          </div>
          <button
            onClick={() => router.push("/upgrade")}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #f5a623, #c4841c)", color: "#0d1b2e" }}
          >
            <Zap size={16} />
            Jetzt upgraden — ab 19,99€/Monat
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const exportCards = [
    {
      type: "rechnungen" as const,
      icon: <Receipt size={24} />,
      label: "Rechnungen exportieren",
      description: "Alle Rechnungen als DATEV EXTF CSV für den Steuerberater",
      color: "#00c6ff",
    },
    {
      type: "angebote" as const,
      icon: <FileText size={24} />,
      label: "Angebote exportieren",
      description: "Alle Angebote als DATEV-kompatibles CSV",
      color: "#22c55e",
    },
  ];

  return (
    <DashboardLayout title="DATEV-Export" subtitle="CSV-Export für Steuerberater">
      <div className="mb-6 p-4 rounded-xl" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
        <div className="flex items-start gap-3">
          <Database size={18} style={{ color: "#00c6ff", flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: "#e6edf3" }}>DATEV EXTF Format</p>
            <p className="text-xs" style={{ color: "#8b9ab5" }}>
              Die exportierten CSV-Dateien entsprechen dem DATEV EXTF-Standard und können direkt in DATEV Unternehmen Online oder von deinem Steuerberater importiert werden.
              Enthält Belegnummer, Datum, Nettobetrag, MwSt-Konto (8400) und Buchungstext.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exportCards.map((card) => {
          const isExporting = exporting === card.type;
          const isDone = exported === card.type;
          return (
            <div key={card.type} className="rounded-xl p-6 flex items-start gap-4" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
              <div className="flex items-center justify-center w-12 h-12 rounded-lg shrink-0" style={{ background: `${card.color}18`, border: `1px solid ${card.color}33` }}>
                <span style={{ color: card.color }}>{card.icon}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold mb-1" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
                  {card.label}
                </h3>
                <p className="text-xs mb-4" style={{ color: "#8b9ab5" }}>{card.description}</p>
                <button
                  onClick={() => doExport(card.type)}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ background: isDone ? "linear-gradient(135deg,#22c55e,#16a34a)" : `linear-gradient(135deg, ${card.color}, ${card.color}cc)`, color: "#0d1b2e" }}
                >
                  {isExporting ? (
                    <><Loader size={12} className="animate-spin" /> Exportiere…</>
                  ) : isDone ? (
                    <><CheckCircle size={12} /> Heruntergeladen!</>
                  ) : (
                    <><Download size={12} /> CSV herunterladen</>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
