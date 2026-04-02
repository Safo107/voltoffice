"use client";

import { useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { usePro } from "@/context/ProContext";
import { useRouter } from "next/navigation";
import { Zap, ExternalLink, BookOpen, Calculator, FileText, Lock, Loader } from "lucide-react";

export default function VoltBasePage() {
  const { isPro, loadingPro } = usePro();
  const router = useRouter();

  useEffect(() => {
    if (!loadingPro && isPro) {
      window.location.href = "https://lernportal.elektrogenius.de";
    }
  }, [isPro, loadingPro]);

  if (loadingPro) {
    return (
      <DashboardLayout title="VoltBase" subtitle="Elektro-Wissensdatenbank">
        <div className="flex items-center justify-center py-24">
          <Loader size={24} className="animate-spin" style={{ color: "#00c6ff" }} />
        </div>
      </DashboardLayout>
    );
  }

  if (!isPro) {
    return (
      <DashboardLayout title="VoltBase" subtitle="Elektro-Wissensdatenbank">
        <div className="flex flex-col items-center justify-center py-24 gap-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-full" style={{ background: "#f5a62322", border: "1px solid #f5a62366" }}>
            <Lock size={28} style={{ color: "#f5a623" }} />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
              VoltBase — Pro-Feature
            </h2>
            <p className="text-sm" style={{ color: "#8b9ab5" }}>
              Zugang zur ElektroGenius Lernplattform: Quiz, Formeln, VDE-Normen, Rechner.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
            {[
              { icon: <BookOpen size={18} />, label: "Lernportal" },
              { icon: <Calculator size={18} />, label: "Rechner" },
              { icon: <FileText size={18} />, label: "VDE-Normen" },
            ].map((f) => (
              <div key={f.label} className="flex flex-col items-center gap-2 p-3 rounded-xl" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
                <span style={{ color: "#8b9ab5" }}>{f.icon}</span>
                <span className="text-xs" style={{ color: "#8b9ab5" }}>{f.label}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => router.push("/upgrade")}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #f5a623, #c4841c)", color: "#0d1b2e" }}
          >
            <Zap size={16} />
            Jetzt upgraden — ab 19,99€/Monat
          </button>
          <a
            href="https://lernportal.elektrogenius.de"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm transition-all hover:underline"
            style={{ color: "#00c6ff" }}
          >
            <ExternalLink size={14} />
            Vorschau: lernportal.elektrogenius.de
          </a>
        </div>
      </DashboardLayout>
    );
  }

  // Pro: redirect läuft via useEffect
  return (
    <DashboardLayout title="VoltBase" subtitle="Weiterleitung...">
      <div className="flex items-center justify-center py-24">
        <Loader size={24} className="animate-spin" style={{ color: "#00c6ff" }} />
      </div>
    </DashboardLayout>
  );
}
