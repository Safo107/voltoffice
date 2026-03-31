"use client";

import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { usePro } from "@/context/ProContext";
import { UserCheck, Lock, Zap, Loader, Plus, User } from "lucide-react";

export default function MitarbeiterPage() {
  const { isPro, loadingPro } = usePro();
  const router = useRouter();

  if (loadingPro) {
    return (
      <DashboardLayout title="Mitarbeiter" subtitle="Pro-Feature">
        <div className="flex items-center justify-center py-24">
          <Loader size={24} className="animate-spin" style={{ color: "#00c6ff" }} />
        </div>
      </DashboardLayout>
    );
  }

  if (!isPro) {
    return (
      <DashboardLayout title="Mitarbeiter" subtitle="Pro-Feature">
        <div className="flex flex-col items-center justify-center py-24 gap-6">
          <div
            className="flex items-center justify-center w-16 h-16 rounded-full"
            style={{ background: "#f5a62322", border: "1px solid #f5a62366" }}
          >
            <Lock size={28} style={{ color: "#f5a623" }} />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
              Mitarbeiter — Pro-Feature
            </h2>
            <p className="text-sm" style={{ color: "#8b9ab5" }}>
              Verwalte dein Team, weise Projekte zu und behalte den Überblick. Nur im Pro-Plan verfügbar.
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
    <DashboardLayout title="Mitarbeiter" subtitle="Teamverwaltung">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm" style={{ color: "#8b9ab5" }}>Noch keine Mitarbeiter angelegt.</p>
        <button
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #00c6ff, #0099cc)", color: "#0d1b2e" }}
        >
          <Plus size={16} />
          Mitarbeiter hinzufügen
        </button>
      </div>
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div
          className="flex items-center justify-center w-14 h-14 rounded-xl"
          style={{ background: "#f5a62318", border: "1px solid #f5a62333" }}
        >
          <UserCheck size={26} style={{ color: "#f5a623" }} />
        </div>
        <p className="text-sm font-semibold" style={{ color: "#e6edf3" }}>Noch keine Mitarbeiter</p>
        <p className="text-xs" style={{ color: "#8b9ab5" }}>Füge Teammitglieder hinzu, um Projekte zuzuweisen.</p>
      </div>
    </DashboardLayout>
  );
}
