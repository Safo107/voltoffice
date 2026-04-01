"use client";

import { useEffect, useState } from "react";
import { Sun, Clock, Settings, X, Check } from "lucide-react";

interface WorkSettings {
  startH: number;
  startM: number;
  endH: number;
  endM: number;
  breakMin: number;
}

const DEFAULTS: WorkSettings = { startH: 7, startM: 0, endH: 17, endM: 0, breakMin: 30 };

function loadSettings(): WorkSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem("voltoffice_workday");
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { /* */ }
  return DEFAULTS;
}

function pad(n: number) { return String(n).padStart(2, "0"); }
function toMin(h: number, m: number) { return h * 60 + m; }

function formatDuration(minutes: number): string {
  if (minutes <= 0) return "0 Min.";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} Min.`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m} Min.`;
}

function getNowMin() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export default function WorkdayProgressWidget() {
  const [settings, setSettings] = useState<WorkSettings>(DEFAULTS);
  const [nowMin, setNowMin] = useState(getNowMin());
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<WorkSettings>(DEFAULTS);

  // Einstellungen laden
  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    setDraft(s);
  }, []);

  // Uhr tickt jede Minute
  useEffect(() => {
    const id = setInterval(() => setNowMin(getNowMin()), 60_000);
    return () => clearInterval(id);
  }, []);

  const startMin  = toMin(settings.startH, settings.startM);
  const endMin    = toMin(settings.endH, settings.endM);
  const netMin    = Math.max(0, endMin - startMin - settings.breakMin);
  const elapsed   = Math.max(0, Math.min(nowMin - startMin, endMin - startMin));
  const worked    = Math.max(0, elapsed - settings.breakMin);
  const pct       = netMin > 0 ? Math.min(100, Math.round((worked / netMin) * 100)) : 0;
  const remaining = Math.max(0, netMin - worked);

  const beforeWork = nowMin < startMin;
  const afterWork  = nowMin >= endMin;
  const barColor   = pct >= 100 ? "#22c55e" : pct >= 75 ? "#f5a623" : "#00c6ff";

  const openEdit = () => { setDraft({ ...settings }); setEditing(true); };

  const saveEdit = () => {
    setSettings({ ...draft });
    localStorage.setItem("voltoffice_workday", JSON.stringify(draft));
    setEditing(false);
  };

  const timeLabel = `${pad(settings.startH)}:${pad(settings.startM)} – ${pad(settings.endH)}:${pad(settings.endM)} Uhr`;

  if (editing) {
    return (
      <div className="rounded-xl p-5" style={{ background: "#112240", border: "1px solid #00c6ff44" }}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>Arbeitstag einstellen</p>
          <button onClick={() => setEditing(false)} style={{ color: "#8b9ab5" }}><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: "#8b9ab5" }}>Startzeit</label>
              <input
                type="time"
                value={`${pad(draft.startH)}:${pad(draft.startM)}`}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(":").map(Number);
                  setDraft((d) => ({ ...d, startH: h, startM: m }));
                }}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "#8b9ab5" }}>Endzeit</label>
              <input
                type="time"
                value={`${pad(draft.endH)}:${pad(draft.endM)}`}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(":").map(Number);
                  setDraft((d) => ({ ...d, endH: h, endM: m }));
                }}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "#8b9ab5" }}>Pausenzeit (Minuten)</label>
            <input
              type="number"
              min={0}
              max={120}
              value={draft.breakMin}
              onChange={(e) => setDraft((d) => ({ ...d, breakMin: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }}
            />
          </div>
          {/* Vorschau */}
          <div className="px-3 py-2 rounded-lg text-xs" style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#8b9ab5" }}>
            Netto-Arbeitszeit: <span style={{ color: "#00c6ff", fontWeight: 600 }}>
              {formatDuration(Math.max(0, toMin(draft.endH, draft.endM) - toMin(draft.startH, draft.startM) - draft.breakMin))}
            </span>
          </div>
          <button
            onClick={saveEdit}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#00c6ff,#0099cc)", color: "#0d1b2e" }}
          >
            <Check size={14} /> Speichern
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-5" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#00c6ff18", border: "1px solid #00c6ff33" }}>
            <Sun size={16} style={{ color: "#00c6ff" }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>Arbeitstag</p>
            <p className="text-xs" style={{ color: "#8b9ab5" }}>{timeLabel} · Pause {settings.breakMin} Min.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold" style={{ color: barColor, fontFamily: "var(--font-syne)" }}>{pct}%</span>
          <button onClick={openEdit} className="p-1.5 rounded-lg transition-all" style={{ color: "#8b9ab5" }} title="Zeiten einstellen">
            <Settings size={14} />
          </button>
        </div>
      </div>

      <div className="h-2.5 rounded-full mb-3 overflow-hidden" style={{ background: "#1e3a5f" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${barColor},${barColor}cc)` }} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs" style={{ color: "#8b9ab5" }}>
          <Clock size={12} />
          {beforeWork && "Noch nicht gestartet"}
          {!beforeWork && !afterWork && `Noch ${formatDuration(remaining)} verbleibend`}
          {afterWork && <span style={{ color: "#22c55e" }}>Arbeitstag beendet ✓</span>}
        </div>
        <span className="text-xs" style={{ color: "#4a5568" }}>
          {formatDuration(worked)} / {formatDuration(netMin)} Netto
        </span>
      </div>
    </div>
  );
}
