"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  User,
  Building,
  Bell,
  Shield,
  CreditCard,
  ChevronRight,
  Lock,
  Zap,
  Check,
} from "lucide-react";
import { useState } from "react";

const sections = [
  { id: "profil", label: "Profil & Betrieb", icon: <User size={16} />, color: "#00c6ff" },
  { id: "firma", label: "Firmendaten", icon: <Building size={16} />, color: "#f5a623" },
  { id: "benachrichtigungen", label: "Benachrichtigungen", icon: <Bell size={16} />, color: "#22c55e" },
  { id: "sicherheit", label: "Sicherheit", icon: <Shield size={16} />, color: "#8b9ab5" },
  { id: "abo", label: "Abo & Abrechnung", icon: <CreditCard size={16} />, color: "#f5a623" },
];

export default function EinstellungenPage() {
  const [active, setActive] = useState("profil");
  const [companyName, setCompanyName] = useState("Musterbetrieb GmbH");
  const [email, setEmail] = useState("max@musterbetrieb.de");
  const [phone, setPhone] = useState("030 12345678");

  return (
    <DashboardLayout title="Einstellungen" subtitle="Konto & Betrieb verwalten">
      <div className="flex gap-4">
        {/* Sidebar */}
        <div
          className="w-56 shrink-0 rounded-xl overflow-hidden"
          style={{ background: "#112240", border: "1px solid #1e3a5f", alignSelf: "flex-start" }}
        >
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-all"
              style={{
                background: active === s.id ? "#00c6ff0f" : "transparent",
                borderLeft: active === s.id ? `3px solid ${s.color}` : "3px solid transparent",
                color: active === s.id ? "#e6edf3" : "#8b9ab5",
              }}
              onMouseEnter={(e) => {
                if (active !== s.id) {
                  e.currentTarget.style.background = "#ffffff08";
                  e.currentTarget.style.color = "#e6edf3";
                }
              }}
              onMouseLeave={(e) => {
                if (active !== s.id) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#8b9ab5";
                }
              }}
            >
              <span style={{ color: active === s.id ? s.color : "inherit" }}>{s.icon}</span>
              {s.label}
              {active === s.id && (
                <ChevronRight size={13} className="ml-auto" style={{ color: s.color }} />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">
          {active === "profil" && (
            <div
              className="rounded-xl p-6"
              style={{ background: "#112240", border: "1px solid #1e3a5f" }}
            >
              <h2
                className="text-base font-bold mb-5"
                style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}
              >
                Profil & Betrieb
              </h2>
              <div className="space-y-4">
                {[
                  { label: "Firmenname", value: companyName, setter: setCompanyName },
                  { label: "E-Mail-Adresse", value: email, setter: setEmail, type: "email" },
                  { label: "Telefon", value: phone, setter: setPhone, type: "tel" },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>
                      {field.label}
                    </label>
                    <input
                      type={field.type || "text"}
                      value={field.value}
                      onChange={(e) => field.setter(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{
                        background: "#0d1b2e",
                        border: "1px solid #1e3a5f",
                        color: "#e6edf3",
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
                    />
                  </div>
                ))}
                <button
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 mt-2"
                  style={{
                    background: "linear-gradient(135deg, #00c6ff, #0099cc)",
                    color: "#0d1b2e",
                  }}
                >
                  Änderungen speichern
                </button>
              </div>
            </div>
          )}

          {active === "abo" && (
            <div className="space-y-4">
              {/* Current plan */}
              <div
                className="rounded-xl p-5"
                style={{ background: "#112240", border: "1px solid #1e3a5f" }}
              >
                <h2
                  className="text-base font-bold mb-4"
                  style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}
                >
                  Aktueller Plan
                </h2>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold mb-1" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
                      Free
                    </p>
                    <p className="text-sm" style={{ color: "#8b9ab5" }}>
                      Kostenlos — max. 5 Kunden, 3 Angebote, 3 Projekte
                    </p>
                  </div>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: "#1e3a5f", color: "#8b9ab5" }}
                  >
                    Aktuell
                  </span>
                </div>
              </div>

              {/* Pro plan */}
              <div
                className="rounded-xl p-5"
                style={{
                  background: "linear-gradient(135deg, #f5a62310, #112240)",
                  border: "1px solid #f5a62344",
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Zap size={18} style={{ color: "#f5a623" }} />
                      <span
                        className="text-xl font-bold"
                        style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}
                      >
                        Pro
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: "#8b9ab5" }}>
                      Alles unlimitiert + alle Pro-Features
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold" style={{ color: "#f5a623", fontFamily: "var(--font-syne)" }}>
                      49 €
                    </p>
                    <p className="text-xs" style={{ color: "#8b9ab5" }}>
                      /Monat
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-2 mb-5">
                  {[
                    "Unbegrenzte Kunden",
                    "Unbegrenzte Angebote",
                    "Rechnungen erstellen",
                    "PDF-Export",
                    "DATEV-Export (CSV)",
                    "Mitarbeiterverwaltung",
                    "Zeiterfassung & Auswertungen",
                    "VDE-Rechner",
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs" style={{ color: "#e6edf3" }}>
                      <Check size={12} style={{ color: "#22c55e" }} />
                      {f}
                    </div>
                  ))}
                </div>

                <button
                  className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                  style={{
                    background: "linear-gradient(135deg, #f5a623, #c4841c)",
                    color: "#0d1b2e",
                  }}
                >
                  Jetzt auf Pro upgraden
                </button>
              </div>
            </div>
          )}

          {(active === "firma" || active === "benachrichtigungen" || active === "sicherheit") && (
            <div
              className="rounded-xl p-10 flex flex-col items-center justify-center text-center"
              style={{
                background: "#112240",
                border: "1px solid #1e3a5f",
                minHeight: "240px",
              }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                style={{ background: "#1e3a5f" }}
              >
                <Lock size={20} style={{ color: "#8b9ab5" }} />
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: "#e6edf3" }}>
                Kommt bald
              </p>
              <p className="text-xs" style={{ color: "#8b9ab5" }}>
                Dieser Bereich wird in der nächsten Version verfügbar sein.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
