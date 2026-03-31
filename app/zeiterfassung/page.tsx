"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Clock, Plus, Play, Square, Calendar, Briefcase } from "lucide-react";
import { useState } from "react";
import type { TimeEntry } from "@/types";

const mockEntries: TimeEntry[] = [
  {
    id: "1",
    projectId: "1",
    projectName: "Wohnanlage Bergstraße",
    userId: "u1",
    date: "2024-12-09",
    hours: 6,
    description: "Kabelverlegung EG + OG",
  },
  {
    id: "2",
    projectId: "1",
    projectName: "Wohnanlage Bergstraße",
    userId: "u1",
    date: "2024-12-08",
    hours: 4,
    description: "Unterverteilung einbauen",
  },
  {
    id: "3",
    projectId: "1",
    projectName: "Wohnanlage Bergstraße",
    userId: "u1",
    date: "2024-12-07",
    hours: 2,
    description: "Aufmaß und Planung",
  },
];

const totalHours = mockEntries.reduce((sum, e) => sum + e.hours, 0);

export default function ZeiterfassungPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState("00:00:00");

  return (
    <DashboardLayout title="Zeiterfassung" subtitle="Diese Woche: 12 Stunden">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        {/* Timer widget */}
        <div
          className="xl:col-span-1 rounded-xl p-6 flex flex-col items-center justify-center"
          style={{
            background: "#112240",
            border: isRunning ? "1px solid #22c55e44" : "1px solid #1e3a5f",
          }}
        >
          <div
            className="flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{
              background: isRunning ? "#22c55e18" : "#00c6ff18",
              border: `2px solid ${isRunning ? "#22c55e44" : "#00c6ff44"}`,
            }}
          >
            <Clock size={28} style={{ color: isRunning ? "#22c55e" : "#00c6ff" }} />
          </div>

          <p
            className="text-4xl font-bold mb-1 font-mono"
            style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}
          >
            {isRunning ? elapsed : "00:00:00"}
          </p>
          <p className="text-xs mb-6" style={{ color: "#8b9ab5" }}>
            {isRunning ? "Läuft..." : "Gestoppt"}
          </p>

          <button
            onClick={() => setIsRunning(!isRunning)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-105"
            style={{
              background: isRunning
                ? "linear-gradient(135deg, #ef4444, #c0392b)"
                : "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "#fff",
            }}
          >
            {isRunning ? <Square size={16} /> : <Play size={16} />}
            {isRunning ? "Stoppen" : "Starten"}
          </button>
        </div>

        {/* Week summary */}
        <div
          className="xl:col-span-2 rounded-xl p-5"
          style={{
            background: "#112240",
            border: "1px solid #1e3a5f",
          }}
        >
          <h2
            className="text-base font-bold mb-4"
            style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}
          >
            Diese Woche
          </h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: "Gesamtstunden", value: `${totalHours}h`, color: "#00c6ff" },
              { label: "Einträge", value: mockEntries.length, color: "#f5a623" },
              { label: "Projekte", value: "1", color: "#22c55e" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-lg p-3 text-center"
                style={{ background: "#0d1b2e", border: "1px solid #1e3a5f" }}
              >
                <p className="text-xl font-bold" style={{ color: s.color, fontFamily: "var(--font-syne)" }}>
                  {s.value}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#8b9ab5" }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {/* Day bars */}
          <div className="flex items-end gap-2 h-16">
            {["Mo", "Di", "Mi", "Do", "Fr"].map((day, i) => {
              const hours = [0, 4, 2, 6, 0][i];
              const pct = (hours / 8) * 100;
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col justify-end" style={{ height: "44px" }}>
                    <div
                      className="w-full rounded-t-sm transition-all"
                      style={{
                        height: `${pct}%`,
                        background: hours > 0 ? "#00c6ff" : "#1e3a5f",
                        minHeight: hours > 0 ? "4px" : "2px",
                      }}
                    />
                  </div>
                  <span className="text-xs" style={{ color: "#8b9ab5" }}>
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Entries table */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1e3a5f" }}>
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ background: "#112240", borderBottom: "1px solid #1e3a5f" }}
        >
          <h2 className="text-sm font-bold" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
            Zeiteinträge
          </h2>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: "linear-gradient(135deg, #00c6ff, #0099cc)",
              color: "#0d1b2e",
            }}
          >
            <Plus size={13} />
            Eintrag hinzufügen
          </button>
        </div>

        {mockEntries.map((entry, i) => (
          <div
            key={entry.id}
            className="flex items-center gap-4 px-4 py-3 transition-all"
            style={{
              background: i % 2 === 0 ? "#0d1b2e" : "#112240",
              borderBottom: i < mockEntries.length - 1 ? "1px solid #1e3a5f44" : "none",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#00c6ff08"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 0 ? "#0d1b2e" : "#112240"; }}
          >
            <div className="flex items-center gap-1.5 w-24 shrink-0 text-xs" style={{ color: "#8b9ab5" }}>
              <Calendar size={11} />
              {new Date(entry.date).toLocaleDateString("de-DE", { day: "2-digit", month: "short" })}
            </div>

            <div className="flex items-center gap-1.5 flex-1 text-xs" style={{ color: "#8b9ab5" }}>
              <Briefcase size={11} />
              {entry.projectName}
            </div>

            <p className="flex-1 text-sm" style={{ color: "#e6edf3" }}>
              {entry.description}
            </p>

            <div
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{
                background: "#00c6ff18",
                color: "#00c6ff",
                border: "1px solid #00c6ff33",
              }}
            >
              {entry.hours}h
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
