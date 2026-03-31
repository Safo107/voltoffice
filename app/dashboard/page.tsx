"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import {
  Users,
  FileText,
  Briefcase,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

const recentActivity = [
  {
    id: 1,
    type: "offer",
    icon: <FileText size={14} />,
    text: "Angebot #2024-003 an Schulz GmbH",
    status: "sent",
    statusLabel: "Versendet",
    time: "vor 2 Std.",
    color: "#00c6ff",
  },
  {
    id: 2,
    type: "project",
    icon: <Briefcase size={14} />,
    text: "Projekt Wohnanlage Bergstr. aktualisiert",
    status: "active",
    statusLabel: "Aktiv",
    time: "vor 4 Std.",
    color: "#22c55e",
  },
  {
    id: 3,
    type: "customer",
    icon: <Users size={14} />,
    text: "Neuer Kunde: Weber Elektrotechnik",
    status: "new",
    statusLabel: "Neu",
    time: "gestern",
    color: "#f5a623",
  },
  {
    id: 4,
    type: "time",
    icon: <Clock size={14} />,
    text: "6h Zeiterfassung — Projekt Bergstr.",
    status: "done",
    statusLabel: "Erfasst",
    time: "gestern",
    color: "#8b9ab5",
  },
];

const openOffers = [
  { id: "2024-003", customer: "Schulz GmbH", value: 3840, status: "sent" },
  { id: "2024-002", customer: "Müller & Söhne", value: 1250, status: "draft" },
];

export default function DashboardPage() {
  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Übersicht Ihres Betriebs"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Kunden"
          value="3"
          icon={<Users size={20} />}
          accent="cyan"
          current={3}
          limit={5}
          sublabel="Free: bis zu 5 Kunden"
        />
        <StatCard
          label="Offene Angebote"
          value="2"
          icon={<FileText size={20} />}
          accent="orange"
          current={2}
          limit={3}
          sublabel="Gesamtwert: 5.090 €"
        />
        <StatCard
          label="Aktive Projekte"
          value="1"
          icon={<Briefcase size={20} />}
          accent="green"
          current={1}
          limit={3}
          sublabel="Free: bis zu 3 Projekte"
        />
        <StatCard
          label="Stunden diese Woche"
          value="12h"
          icon={<Clock size={20} />}
          accent="muted"
          sublabel="3 Einträge"
        />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <div
          className="rounded-xl p-5"
          style={{
            background: "#112240",
            border: "1px solid #1e3a5f",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-base font-bold"
              style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}
            >
              Letzte Aktivitäten
            </h2>
            <button
              className="flex items-center gap-1 text-xs transition-colors"
              style={{ color: "#00c6ff" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#00c6ffcc"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#00c6ff"; }}
            >
              Alle anzeigen
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="space-y-3">
            {recentActivity.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg transition-all"
                style={{ background: "#0d1b2e", border: "1px solid #1e3a5f" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#1e3a5f88";
                  e.currentTarget.style.background = "#112240";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#1e3a5f";
                  e.currentTarget.style.background = "#0d1b2e";
                }}
              >
                <div
                  className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
                  style={{ background: `${item.color}22`, color: item.color }}
                >
                  {item.icon}
                </div>
                <p className="flex-1 text-sm" style={{ color: "#e6edf3" }}>
                  {item.text}
                </p>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: `${item.color}22`,
                      color: item.color,
                      border: `1px solid ${item.color}44`,
                    }}
                  >
                    {item.statusLabel}
                  </span>
                  <span className="text-xs" style={{ color: "#4a5568" }}>
                    {item.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Open Offers */}
        <div className="space-y-4">
          <div
            className="rounded-xl p-5"
            style={{
              background: "#112240",
              border: "1px solid #1e3a5f",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-base font-bold"
                style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}
              >
                Offene Angebote
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#f5a62322", color: "#f5a623", border: "1px solid #f5a62344" }}>
                2 offen
              </span>
            </div>

            <div className="space-y-2">
              {openOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all"
                  style={{ background: "#0d1b2e", border: "1px solid #1e3a5f" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#00c6ff33";
                    e.currentTarget.style.background = "#00c6ff08";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#1e3a5f";
                    e.currentTarget.style.background = "#0d1b2e";
                  }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#e6edf3" }}>
                      #{offer.id}
                    </p>
                    <p className="text-xs" style={{ color: "#8b9ab5" }}>
                      {offer.customer}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold" style={{ color: "#00c6ff" }}>
                      {offer.value.toLocaleString("de-DE")} €
                    </p>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={
                        offer.status === "sent"
                          ? { background: "#00c6ff18", color: "#00c6ff" }
                          : { background: "#8b9ab518", color: "#8b9ab5" }
                      }
                    >
                      {offer.status === "sent" ? "Versendet" : "Entwurf"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Free limit hint */}
          <div
            className="rounded-xl p-4 flex items-start gap-3"
            style={{
              background: "#00c6ff08",
              border: "1px solid #00c6ff22",
            }}
          >
            <AlertCircle size={16} className="shrink-0" style={{ color: "#00c6ff", marginTop: 1 }} />
            <div>
              <p className="text-sm font-medium mb-0.5" style={{ color: "#e6edf3" }}>
                Free-Plan: 2 von 3 Angeboten genutzt
              </p>
              <p className="text-xs" style={{ color: "#8b9ab5" }}>
                Mit Pro unbegrenzte Angebote und Rechnungen erstellen.
              </p>
            </div>
          </div>

          {/* Quick actions */}
          <div
            className="rounded-xl p-5"
            style={{
              background: "#112240",
              border: "1px solid #1e3a5f",
            }}
          >
            <h2
              className="text-base font-bold mb-3"
              style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}
            >
              Schnellaktionen
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Angebot erstellen", icon: <FileText size={14} />, color: "#00c6ff" },
                { label: "Kunde anlegen", icon: <Users size={14} />, color: "#f5a623" },
                { label: "Zeit erfassen", icon: <Clock size={14} />, color: "#22c55e" },
                { label: "Projekt erstellen", icon: <Briefcase size={14} />, color: "#8b9ab5" },
              ].map((action) => (
                <button
                  key={action.label}
                  className="flex items-center gap-2 p-3 rounded-lg text-xs font-medium text-left transition-all"
                  style={{
                    background: "#0d1b2e",
                    border: "1px solid #1e3a5f",
                    color: "#e6edf3",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${action.color}44`;
                    e.currentTarget.style.background = `${action.color}0a`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#1e3a5f";
                    e.currentTarget.style.background = "#0d1b2e";
                  }}
                >
                  <span style={{ color: action.color }}>{action.icon}</span>
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
