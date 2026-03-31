"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Modal from "@/components/ui/Modal";
import { usePro } from "@/context/ProContext";
import { Clock, Plus, Play, Square, Calendar, Briefcase, Loader, Trash2, Lock, Zap } from "lucide-react";

interface TimeEntry {
  _id?: string;
  projectName: string;
  date: string;
  hours: number;
  description: string;
}

const EMPTY_FORM = { projectName: "", date: "", hours: 1, description: "" };

export default function ZeiterfassungPage() {
  const { isPro, loadingPro } = usePro();
  const router = useRouter();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Timer
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { fetchEntries(); }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, "0");
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/zeiterfassung");
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setForm({ ...EMPTY_FORM, date: new Date().toISOString().split("T")[0] });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/zeiterfassung", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      await fetchEntries();
      setModalOpen(false);
    } catch {
      //
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entry: TimeEntry) => {
    if (!confirm(`Eintrag "${entry.description || entry.projectName}" löschen?`)) return;
    await fetch(`/api/zeiterfassung/${entry._id}`, { method: "DELETE" });
    await fetchEntries();
  };

  const totalHours = entries.reduce((sum, e) => sum + (e.hours || 0), 0);

  // Current week hours
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1);
  weekStart.setHours(0, 0, 0, 0);
  const weekHours = entries
    .filter((e) => new Date(e.date) >= weekStart)
    .reduce((sum, e) => sum + (e.hours || 0), 0);

  // Day bars for current week
  const dayNames = ["Mo", "Di", "Mi", "Do", "Fr"];
  const dayHours = dayNames.map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const ds = d.toISOString().split("T")[0];
    return entries.filter((e) => e.date === ds).reduce((sum, e) => sum + (e.hours || 0), 0);
  });
  const maxDay = Math.max(...dayHours, 1);

  if (!loadingPro && !isPro) {
    return (
      <DashboardLayout title="Zeiterfassung" subtitle="Pro-Feature">
        <div className="flex flex-col items-center justify-center py-24 gap-6">
          <div
            className="flex items-center justify-center w-16 h-16 rounded-full"
            style={{ background: "#f5a62322", border: "1px solid #f5a62366" }}
          >
            <Lock size={28} style={{ color: "#f5a623" }} />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
              Zeiterfassung — Pro-Feature
            </h2>
            <p className="text-sm" style={{ color: "#8b9ab5" }}>
              Stunden erfassen, Wochenübersicht und Timer sind nur im Pro-Plan verfügbar.
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
    <DashboardLayout title="Zeiterfassung" subtitle={`Diese Woche: ${weekHours}h`}>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        {/* Timer widget */}
        <div
          className="xl:col-span-1 rounded-xl p-6 flex flex-col items-center justify-center"
          style={{ background: "#112240", border: isRunning ? "1px solid #22c55e44" : "1px solid #1e3a5f" }}
        >
          <div
            className="flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ background: isRunning ? "#22c55e18" : "#00c6ff18", border: `2px solid ${isRunning ? "#22c55e44" : "#00c6ff44"}` }}
          >
            <Clock size={28} style={{ color: isRunning ? "#22c55e" : "#00c6ff" }} />
          </div>

          <p className="text-4xl font-bold mb-1 font-mono" style={{ color: "#e6edf3" }}>
            {formatTime(seconds)}
          </p>
          <p className="text-xs mb-6" style={{ color: "#8b9ab5" }}>
            {isRunning ? "Läuft..." : "Gestoppt"}
          </p>

          <button
            onClick={() => { setIsRunning(!isRunning); if (isRunning) setSeconds(0); }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-105"
            style={{
              background: isRunning ? "linear-gradient(135deg, #ef4444, #c0392b)" : "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "#fff",
            }}
          >
            {isRunning ? <Square size={16} /> : <Play size={16} />}
            {isRunning ? "Stoppen" : "Starten"}
          </button>
        </div>

        {/* Week summary */}
        <div className="xl:col-span-2 rounded-xl p-5" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
          <h2 className="text-base font-bold mb-4" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
            Diese Woche
          </h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: "Wochenstunden", value: `${weekHours}h`, color: "#00c6ff" },
              { label: "Einträge", value: entries.length, color: "#f5a623" },
              { label: "Gesamt", value: `${totalHours}h`, color: "#22c55e" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg p-3 text-center" style={{ background: "#0d1b2e", border: "1px solid #1e3a5f" }}>
                <p className="text-xl font-bold" style={{ color: s.color, fontFamily: "var(--font-syne)" }}>{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: "#8b9ab5" }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Day bars */}
          <div className="flex items-end gap-2 h-16">
            {dayNames.map((day, i) => {
              const h = dayHours[i];
              const pct = (h / maxDay) * 100;
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col justify-end" style={{ height: "44px" }}>
                    <div
                      className="w-full rounded-t-sm transition-all"
                      style={{ height: `${pct}%`, background: h > 0 ? "#00c6ff" : "#1e3a5f", minHeight: h > 0 ? "4px" : "2px" }}
                    />
                  </div>
                  <span className="text-xs" style={{ color: "#8b9ab5" }}>{day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Entries table */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1e3a5f" }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ background: "#112240", borderBottom: "1px solid #1e3a5f" }}>
          <h2 className="text-sm font-bold" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>Zeiteinträge</h2>
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: "linear-gradient(135deg, #00c6ff, #0099cc)", color: "#0d1b2e" }}
          >
            <Plus size={13} /> Eintrag hinzufügen
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16" style={{ background: "#0d1b2e" }}>
            <Loader size={20} className="animate-spin" style={{ color: "#00c6ff" }} />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ background: "#0d1b2e" }}>
            <Clock size={28} style={{ color: "#1e3a5f" }} />
            <p className="text-sm" style={{ color: "#8b9ab5" }}>Noch keine Zeiteinträge</p>
            <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold"
              style={{ background: "linear-gradient(135deg, #00c6ff, #0099cc)", color: "#0d1b2e" }}>
              <Plus size={13} /> Ersten Eintrag hinzufügen
            </button>
          </div>
        ) : (
          entries.map((entry, i) => (
            <div
              key={entry._id || i}
              className="flex items-center gap-4 px-4 py-3 transition-all group"
              style={{ background: i % 2 === 0 ? "#0d1b2e" : "#112240", borderBottom: i < entries.length - 1 ? "1px solid #1e3a5f44" : "none" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#00c6ff08"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 0 ? "#0d1b2e" : "#112240"; }}
            >
              <div className="flex items-center gap-1.5 w-24 shrink-0 text-xs" style={{ color: "#8b9ab5" }}>
                <Calendar size={11} />
                {entry.date ? new Date(entry.date).toLocaleDateString("de-DE", { day: "2-digit", month: "short" }) : "—"}
              </div>
              <div className="flex items-center gap-1.5 w-40 shrink-0 text-xs" style={{ color: "#8b9ab5" }}>
                <Briefcase size={11} />
                <span className="truncate">{entry.projectName}</span>
              </div>
              <p className="flex-1 text-sm" style={{ color: "#e6edf3" }}>{entry.description}</p>
              <div className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: "#00c6ff18", color: "#00c6ff", border: "1px solid #00c6ff33" }}>
                {entry.hours}h
              </div>
              <button
                onClick={() => handleDelete(entry)}
                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                style={{ color: "#ef4444" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#ef444418"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Zeiteintrag hinzufügen">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Projekt *</label>
            <input
              required
              value={form.projectName}
              onChange={(e) => setForm({ ...form, projectName: e.target.value })}
              placeholder="z.B. Wohnanlage Bergstraße"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Datum</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Stunden *</label>
              <input
                required
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                value={form.hours}
                onChange={(e) => setForm({ ...form, hours: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Beschreibung</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="z.B. Kabelverlegung EG"
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#8b9ab5" }}>
              Abbrechen
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #00c6ff, #0099cc)", color: "#0d1b2e" }}>
              {saving ? "Wird gespeichert..." : "Speichern"}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
