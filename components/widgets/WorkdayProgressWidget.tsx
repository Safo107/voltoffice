"use client";

import { useEffect, useState } from "react";
import { Sun, Clock } from "lucide-react";

const WORK_START = 7 * 60; // 07:00 in Minuten
const WORK_END = 17 * 60;  // 17:00 in Minuten
const BREAK_MIN = 30;
const NET_MINUTES = WORK_END - WORK_START - BREAK_MIN; // 570 = 9,5h

function getNow() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function formatDuration(minutes: number): string {
  if (minutes <= 0) return "0 Min.";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} Min.`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m} Min.`;
}

export default function WorkdayProgressWidget() {
  const [nowMin, setNowMin] = useState(getNow());

  useEffect(() => {
    const tick = () => setNowMin(getNow());
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const elapsed = Math.max(0, Math.min(nowMin - WORK_START, WORK_END - WORK_START));
  const workElapsed = Math.max(0, elapsed - BREAK_MIN);
  const pct = Math.min(100, Math.round((workElapsed / NET_MINUTES) * 100));
  const remaining = Math.max(0, NET_MINUTES - workElapsed);

  const beforeWork = nowMin < WORK_START;
  const afterWork = nowMin >= WORK_END;

  const barColor = pct >= 100 ? "#22c55e" : pct >= 75 ? "#f5a623" : "#00c6ff";

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "#112240", border: "1px solid #1e3a5f" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#00c6ff18", border: "1px solid #00c6ff33" }}>
            <Sun size={16} style={{ color: "#00c6ff" }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>Arbeitstag</p>
            <p className="text-xs" style={{ color: "#8b9ab5" }}>07:00 – 17:00 Uhr</p>
          </div>
        </div>
        <span className="text-2xl font-bold" style={{ color: barColor, fontFamily: "var(--font-syne)" }}>
          {pct}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2.5 rounded-full mb-3 overflow-hidden" style={{ background: "#1e3a5f" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${barColor}, ${barColor}cc)` }}
        />
      </div>

      {/* Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs" style={{ color: "#8b9ab5" }}>
          <Clock size={12} />
          {beforeWork && "Noch nicht gestartet"}
          {!beforeWork && !afterWork && `Noch ${formatDuration(remaining)} verbleibend`}
          {afterWork && <span style={{ color: "#22c55e" }}>Arbeitstag beendet ✓</span>}
        </div>
        <span className="text-xs" style={{ color: "#4a5568" }}>
          {formatDuration(workElapsed)} gearbeitet
        </span>
      </div>
    </div>
  );
}
