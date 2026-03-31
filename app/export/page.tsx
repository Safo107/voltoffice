"use client";

import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { usePro } from "@/context/ProContext";
import { FileDown, Lock, Zap, FileText, Briefcase, Loader } from "lucide-react";

export default function ExportPage() {
  const { isPro, loadingPro } = usePro();
  const router = useRouter();

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
          <div
            className="flex items-center justify-center w-16 h-16 rounded-full"
            style={{ background: "#f5a62322", border: "1px solid #f5a62366" }}
          >
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
            Auf Pro upgraden — 9,99€/Monat
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="PDF-Export" subtitle="Angebote & Rechnungen exportieren">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { icon: <FileText size={24} />, label: "Angebote exportieren", description: "Alle Angebote als PDF herunterladen", color: "#00c6ff" },
          { icon: <Briefcase size={24} />, label: "Projekte exportieren", description: "Projektübersicht als PDF exportieren", color: "#22c55e" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl p-6 flex items-start gap-4"
            style={{ background: "#112240", border: "1px solid #1e3a5f" }}
          >
            <div
              className="flex items-center justify-center w-12 h-12 rounded-lg shrink-0"
              style={{ background: `${item.color}18`, border: `1px solid ${item.color}33` }}
            >
              <span style={{ color: item.color }}>{item.icon}</span>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold mb-1" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
                {item.label}
              </h3>
              <p className="text-xs mb-3" style={{ color: "#8b9ab5" }}>{item.description}</p>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #00c6ff, #0099cc)", color: "#0d1b2e" }}
              >
                <FileDown size={13} />
                Exportieren
              </button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
