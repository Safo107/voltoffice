"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/authFetch";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { usePro } from "@/context/ProContext";
import { FileDown, Lock, Zap, FileText, Receipt, Database, Loader, CheckCircle } from "lucide-react";

interface Angebot {
  _id: string;
  number: string;
  customerName: string;
  total: number;
  createdAt?: string;
}

export default function ExportPage() {
  const { isPro, loadingPro } = usePro();
  const router = useRouter();
  const [angebote, setAngebote] = useState<Angebot[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState("");

  useEffect(() => {
    if (isPro) {
      setLoadingList(true);
      authFetch("/api/angebote")
        .then((r) => r.json())
        .then((d) => setAngebote(Array.isArray(d) ? d : []))
        .finally(() => setLoadingList(false));
    }
  }, [isPro]);

  const downloadPdf = async (id: string) => {
    setDownloading(id);
    setDone(null);
    try {
      const res = await authFetch(`/api/angebote/${id}/pdf`);
      if (!res.ok) { setPdfError("PDF konnte nicht erstellt werden."); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Angebot.pdf`;
      try { a.click(); } finally { URL.revokeObjectURL(url); }
      setPdfError("");
      setDone(id);
      setTimeout(() => setDone(null), 3000);
    } finally {
      setDownloading(null);
    }
  };

  if (loadingPro) {
    return (
      <DashboardLayout title="PDF-Export" subtitle="Pro-Feature">
        <div className="flex items-center justify-center py-24">
          <Loader size={24} className="animate-spin" style={{ color: "#00c6ff" }} />
        </div>
      </DashboardLayout>
    );
  }

  if (!isPro) {
    return (
      <DashboardLayout title="PDF-Export" subtitle="Pro-Feature">
        <div className="flex flex-col items-center justify-center py-24 gap-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-full" style={{ background: "#f5a62322", border: "1px solid #f5a62366" }}>
            <Lock size={28} style={{ color: "#f5a623" }} />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
              PDF-Export — Pro-Feature
            </h2>
            <p className="text-sm" style={{ color: "#8b9ab5" }}>
              Exportiere Angebote und Rechnungen als professionelle PDFs. Nur im Pro-Plan verfügbar.
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

  return (
    <DashboardLayout title="PDF-Export" subtitle="Angebote als PDF exportieren">
      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => router.push("/rechnungen")}
          className="flex items-start gap-4 p-5 rounded-xl text-left transition-all hover:opacity-90"
          style={{ background: "#112240", border: "1px solid #1e3a5f" }}
        >
          <div className="flex items-center justify-center w-11 h-11 rounded-lg shrink-0" style={{ background: "#00c6ff18", border: "1px solid #00c6ff33" }}>
            <Receipt size={20} style={{ color: "#00c6ff" }} />
          </div>
          <div>
            <p className="text-sm font-bold mb-0.5" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>Rechnungen</p>
            <p className="text-xs" style={{ color: "#8b9ab5" }}>Rechnungen erstellen und als PDF herunterladen</p>
          </div>
        </button>
        <button
          onClick={() => router.push("/datev")}
          className="flex items-start gap-4 p-5 rounded-xl text-left transition-all hover:opacity-90"
          style={{ background: "#112240", border: "1px solid #1e3a5f" }}
        >
          <div className="flex items-center justify-center w-11 h-11 rounded-lg shrink-0" style={{ background: "#22c55e18", border: "1px solid #22c55e33" }}>
            <Database size={20} style={{ color: "#22c55e" }} />
          </div>
          <div>
            <p className="text-sm font-bold mb-0.5" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>DATEV-Export</p>
            <p className="text-xs" style={{ color: "#8b9ab5" }}>CSV für Steuerberater herunterladen</p>
          </div>
        </button>
      </div>

      {/* Angebote PDF Export */}
      <div className="mb-4">
        <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
          <FileText size={16} style={{ color: "#00c6ff" }} /> Angebote als PDF exportieren
        </h2>
      </div>

      {loadingList ? (
        <div className="flex justify-center py-12"><Loader size={22} className="animate-spin" style={{ color: "#00c6ff" }} /></div>
      ) : angebote.length === 0 ? (
        <div className="text-center py-12" style={{ color: "#8b9ab5" }}>
          <FileText size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Noch keine Angebote vorhanden.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {angebote.map((a) => (
            <div key={a._id} className="flex items-center gap-4 px-5 py-3.5 rounded-xl" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "#e6edf3" }}>{a.customerName}</p>
                <p className="text-xs" style={{ color: "#8b9ab5" }}>{a.number} · {a.createdAt ? new Date(a.createdAt).toLocaleDateString("de-DE") : ""}</p>
              </div>
              <p className="text-sm font-bold shrink-0" style={{ color: "#00c6ff" }}>
                {(a.total || 0).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
              </p>
              <button
                onClick={() => downloadPdf(a._id)}
                disabled={downloading === a._id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-60 shrink-0"
                style={{
                  background: done === a._id ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#00c6ff,#0099cc)",
                  color: "#0d1b2e",
                }}
              >
                {downloading === a._id ? (
                  <Loader size={12} className="animate-spin" />
                ) : done === a._id ? (
                  <><CheckCircle size={12} /> Fertig!</>
                ) : (
                  <><FileDown size={12} /> PDF</>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
      {pdfError && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-xl cursor-pointer"
          style={{ background: "#ef444420", border: "1px solid #ef444440", color: "#ef4444" }}
          onClick={() => setPdfError("")}
        >
          {pdfError}
        </div>
      )}
    </DashboardLayout>
  );
}
