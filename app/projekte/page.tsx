"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Briefcase, Plus, Search, MoreVertical, Calendar, User } from "lucide-react";
import { useState } from "react";
import type { Project } from "@/types";

const mockProjects: Project[] = [
  {
    id: "1",
    title: "Wohnanlage Bergstraße",
    customerId: "1",
    customerName: "Schulz GmbH",
    status: "active",
    startDate: "2024-11-01",
    description: "Elektroinstallation Neubau, 12 Einheiten",
  },
];

const statusConfig = {
  active: { label: "Aktiv", color: "#22c55e" },
  paused: { label: "Pausiert", color: "#f5a623" },
  completed: { label: "Abgeschlossen", color: "#8b9ab5" },
};

const FREE_LIMIT = 3;

export default function ProjektePage() {
  const [search, setSearch] = useState("");

  const filtered = mockProjects.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.customerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title="Projekte" subtitle={`${mockProjects.length} von ${FREE_LIMIT} Projekten (Free)`}>
      <div className="flex items-center justify-between mb-6">
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
          style={{
            background: "#112240",
            border: "1px solid #1e3a5f",
            color: "#8b9ab5",
            flex: 1,
            maxWidth: "320px",
          }}
        >
          <Search size={15} />
          <input
            type="text"
            placeholder="Projekt suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "#e6edf3" }}
          />
        </div>

        <button
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ml-3"
          style={{
            background: "linear-gradient(135deg, #00c6ff, #0099cc)",
            color: "#0d1b2e",
          }}
        >
          <Plus size={16} />
          Neues Projekt
        </button>
      </div>

      {/* Project cards */}
      {filtered.length === 0 ? (
        <div
          className="py-20 text-center rounded-xl"
          style={{ background: "#112240", border: "1px solid #1e3a5f" }}
        >
          <Briefcase size={40} className="mx-auto mb-3" style={{ color: "#1e3a5f" }} />
          <p className="text-sm" style={{ color: "#8b9ab5" }}>
            Keine Projekte gefunden.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project) => {
            const sc = statusConfig[project.status];
            return (
              <div
                key={project.id}
                className="rounded-xl p-5 cursor-pointer transition-all hover:scale-[1.01]"
                style={{
                  background: "#112240",
                  border: "1px solid #1e3a5f",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#00c6ff33";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#1e3a5f";
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-lg"
                    style={{ background: "#22c55e18", border: "1px solid #22c55e33" }}
                  >
                    <Briefcase size={18} style={{ color: "#22c55e" }} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: `${sc.color}22`,
                        color: sc.color,
                        border: `1px solid ${sc.color}44`,
                      }}
                    >
                      {sc.label}
                    </span>
                    <button
                      className="p-1 rounded transition-all"
                      style={{ color: "#8b9ab5" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#e6edf3"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#8b9ab5"; }}
                    >
                      <MoreVertical size={14} />
                    </button>
                  </div>
                </div>

                <h3
                  className="text-base font-bold mb-1"
                  style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}
                >
                  {project.title}
                </h3>
                <p className="text-xs mb-3" style={{ color: "#8b9ab5" }}>
                  {project.description}
                </p>

                <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid #1e3a5f" }}>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: "#8b9ab5" }}>
                    <User size={11} />
                    {project.customerName}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: "#8b9ab5" }}>
                    <Calendar size={11} />
                    {new Date(project.startDate).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty slots */}
          {Array.from({ length: FREE_LIMIT - mockProjects.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all"
              style={{
                background: "transparent",
                border: "2px dashed #1e3a5f",
                minHeight: "160px",
                color: "#8b9ab5",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#00c6ff44";
                e.currentTarget.style.background = "#00c6ff08";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#1e3a5f";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <Plus size={22} className="mb-2" style={{ color: "#1e3a5f" }} />
              <p className="text-xs">Projekt hinzufügen</p>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
