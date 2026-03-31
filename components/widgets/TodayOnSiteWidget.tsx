"use client";

import { useEffect, useState } from "react";
import { HardHat, MapPin, Loader } from "lucide-react";

interface Eintrag {
  _id?: string;
  projectName: string;
  date: string;
  hours: number;
  description: string;
}

export default function TodayOnSiteWidget() {
  const [entries, setEntries] = useState<Eintrag[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetch("/api/zeiterfassung")
      .then((r) => r.json())
      .then((data: Eintrag[]) => {
        const todayEntries = Array.isArray(data)
          ? data.filter((e) => e.date === today)
          : [];
        setEntries(todayEntries);
        setLoading(false);
      })
      .catch(() => {
        setEntries([]);
        setLoading(false);
      });
  }, [today]);

  const todayHours = entries.reduce((s, e) => s + (e.hours || 0), 0);
  const projects = [...new Set(entries.map((e) => e.projectName).filter(Boolean))];

  return (
    <div className="rounded-xl p-5" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#22c55e18", border: "1px solid #22c55e33" }}>
            <HardHat size={16} style={{ color: "#22c55e" }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>Heute auf Baustelle</p>
            <p className="text-xs" style={{ color: "#8b9ab5" }}>
              {new Date().toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "short" })}
            </p>
          </div>
        </div>
        {todayHours > 0 && (
          <span className="text-sm font-bold px-2 py-0.5 rounded-full" style={{ background: "#22c55e18", color: "#22c55e", border: "1px solid #22c55e33" }}>
            {todayHours}h
          </span>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#8b9ab5" }}>
          <Loader size={14} className="animate-spin" />
          Wird geladen...
        </div>
      )}

      {!loading && entries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-4 gap-1">
          <MapPin size={20} style={{ color: "#1e3a5f" }} />
          <p className="text-xs text-center" style={{ color: "#4a5568" }}>
            Keine Einträge für heute.<br />
            Zeiterfassung starten.
          </p>
        </div>
      )}

      {!loading && entries.length > 0 && (
        <div className="space-y-2">
          {projects.map((proj) => {
            const projEntries = entries.filter((e) => e.projectName === proj);
            const projHours = projEntries.reduce((s, e) => s + (e.hours || 0), 0);
            return (
              <div key={proj} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: "#0d1b2e", border: "1px solid #1e3a5f" }}>
                <div className="flex items-center gap-2">
                  <MapPin size={12} style={{ color: "#22c55e" }} />
                  <span className="text-xs font-medium truncate max-w-[140px]" style={{ color: "#e6edf3" }}>{proj}</span>
                </div>
                <span className="text-xs font-semibold shrink-0" style={{ color: "#22c55e" }}>{projHours}h</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
