"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Square, Clock, Save, Loader } from "lucide-react";

function formatTime(s: number): string {
  const h = Math.floor(s / 3600).toString().padStart(2, "0");
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

export default function TimeTrackerWidget() {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [todayHours, setTodayHours] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetch("/api/zeiterfassung")
      .then((r) => r.json())
      .then((data: { date: string; hours: number }[]) => {
        if (!Array.isArray(data)) return;
        const h = data.filter((e) => e.date === today).reduce((s, e) => s + (e.hours || 0), 0);
        setTodayHours(h);
      })
      .catch(() => setTodayHours(0));
  }, [today, saved]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  const toggle = () => {
    setIsRunning(!isRunning);
    if (isRunning) setSeconds(0);
  };

  const saveEntry = async () => {
    if (seconds < 60) return;
    setSaving(true);
    const hours = Math.round((seconds / 3600) * 10) / 10;
    try {
      await fetch("/api/zeiterfassung", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: "Manuell erfasst",
          date: today,
          hours,
          description: "Via Widget",
        }),
      });
      setSeconds(0);
      setIsRunning(false);
      setSaved((v) => !v);
    } finally {
      setSaving(false);
    }
  };

  const elapsedHours = Math.round((seconds / 3600) * 10) / 10;

  return (
    <div className="rounded-xl p-5" style={{ background: "#112240", border: `1px solid ${isRunning ? "#22c55e44" : "#1e3a5f"}` }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: isRunning ? "#22c55e18" : "#00c6ff18", border: `1px solid ${isRunning ? "#22c55e33" : "#00c6ff33"}` }}>
            <Clock size={16} style={{ color: isRunning ? "#22c55e" : "#00c6ff" }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>Stunden-Tracker</p>
            <p className="text-xs" style={{ color: "#8b9ab5" }}>
              {todayHours !== null ? `Heute: ${todayHours}h erfasst` : "Lädt..."}
            </p>
          </div>
        </div>
        <span className="text-sm font-mono font-bold" style={{ color: isRunning ? "#22c55e" : "#8b9ab5" }}>
          {isRunning ? "● LÄUFT" : "■ GESTOPPT"}
        </span>
      </div>

      {/* Timer display */}
      <div className="text-center py-3 mb-4 rounded-xl" style={{ background: "#0d1b2e", border: "1px solid #1e3a5f" }}>
        <p className="text-4xl font-bold font-mono" style={{ color: isRunning ? "#22c55e" : "#e6edf3" }}>
          {formatTime(seconds)}
        </p>
        {seconds > 0 && (
          <p className="text-xs mt-1" style={{ color: "#8b9ab5" }}>{elapsedHours}h erfasst</p>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={toggle}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: isRunning ? "linear-gradient(135deg, #ef4444, #c0392b)" : "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}
        >
          {isRunning ? <Square size={15} /> : <Play size={15} />}
          {isRunning ? "Stoppen" : "Starten"}
        </button>

        {seconds > 60 && !isRunning && (
          <button
            onClick={saveEntry}
            disabled={saving}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "#00c6ff18", border: "1px solid #00c6ff44", color: "#00c6ff" }}
          >
            {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? "..." : "Speichern"}
          </button>
        )}
      </div>
    </div>
  );
}
