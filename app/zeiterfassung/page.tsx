"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/authFetch";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Modal from "@/components/ui/Modal";
import { usePro } from "@/context/ProContext";
import {
  Clock, Plus, Play, Square, Calendar, Briefcase, Loader, Trash2,
  Lock, Zap, Receipt, User, Check, ChevronDown,
} from "lucide-react";

interface TimeEntry {
  _id?: string;
  projektId?: string;
  projektName: string;
  taetigkeit: string;
  mitarbeiter: string;
  mitarbeiterId?: string;
  mitarbeiterRolle?: string;
  date: string;
  hours: number;
  description?: string;
  stundensatz?: number;
}

interface Projekt { _id: string; title: string; customerName: string; }
interface MitarbeiterEintrag { _id: string; name: string; rolle: string; stundensatz: number; aktiv: boolean; }

const TAETIGKEITEN = ["Installation", "Wartung", "Planung", "Messung", "Dokumentation", "Sonstiges"];

const EMPTY_FORM: Omit<TimeEntry, "_id"> = {
  projektId: "", projektName: "", taetigkeit: "Installation",
  mitarbeiter: "", date: new Date().toISOString().split("T")[0],
  hours: 1, description: "", stundensatz: 65,
};

const TIMER_LS_KEY = "vo_timer_v1";
const LAST_PROJEKT_KEY = "vo_last_projekt_id";
const LAST_MA_KEY = "vo_last_ma_id";

interface StoredTimer {
  startedAt: number;
  projektName: string;
  projektId: string;
  taetigkeit: string;
  mitarbeiter: string;
}

function getKW(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export default function ZeiterfassungPage() {
  const { isPro, loadingPro } = usePro();
  const router = useRouter();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [projekte, setProjekte] = useState<Projekt[]>([]);
  const [mitarbeiterListe, setMitarbeiterListe] = useState<MitarbeiterEintrag[]>([]);

  // Timer
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerProjekt, setTimerProjekt] = useState("");
  const [timerProjektId, setTimerProjektId] = useState("");
  const [timerTaetigkeit, setTimerTaetigkeit] = useState("Installation");
  const [timerMitarbeiter, setTimerMitarbeiter] = useState("");
  const [timerMitarbeiterId, setTimerMitarbeiterId] = useState("");
  const [timerMitarbeiterRolle, setTimerMitarbeiterRolle] = useState("");
  const [timerStundensatz, setTimerStundensatz] = useState(65);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Save-after-stop modal
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveForm, setSaveForm] = useState<Omit<TimeEntry, "_id">>(EMPTY_FORM);

  // Manual entry modal
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState<Omit<TimeEntry, "_id">>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Custom dropdown state – timer card
  const [timerProjektOpen, setTimerProjektOpen] = useState(false);
  const [timerProjektSearch, setTimerProjektSearch] = useState("");
  const [timerMaOpen, setTimerMaOpen] = useState(false);
  const [timerMaSearch, setTimerMaSearch] = useState("");

  // Custom dropdown state – manual modal
  const [manualProjektOpen, setManualProjektOpen] = useState(false);
  const [manualProjektSearch, setManualProjektSearch] = useState("");
  const [manualMaOpen, setManualMaOpen] = useState(false);
  const [manualMaSearch, setManualMaSearch] = useState("");

  // Ref for autofocus on Stunden in manual modal
  const hoursManualRef = useRef<HTMLInputElement>(null);

  // Invoice from entries
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceStundensatz, setInvoiceStundensatz] = useState(65);
  const [invoiceKunde, setInvoiceKunde] = useState("");
  const [invoiceSaving, setInvoiceSaving] = useState(false);

  useEffect(() => {
    fetchEntries();
    fetchProjekte();
    fetchMitarbeiter();
    restoreTimer();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerRunning]);

  const restoreTimer = () => {
    try {
      const stored = localStorage.getItem(TIMER_LS_KEY);
      if (!stored) return;
      const data: StoredTimer = JSON.parse(stored);
      const elapsed = Math.floor((Date.now() - data.startedAt) / 1000);
      setTimerProjekt(data.projektName);
      setTimerProjektId(data.projektId);
      setTimerTaetigkeit(data.taetigkeit);
      setTimerMitarbeiter(data.mitarbeiter);
      setTimerSeconds(elapsed);
      setTimerRunning(true);
    } catch { /* */ }
  };

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/zeiterfassung");
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch { setEntries([]); }
    finally { setLoading(false); }
  };

  const fetchProjekte = async () => {
    try {
      const res = await authFetch("/api/projekte");
      const data = await res.json();
      const list: Projekt[] = Array.isArray(data) ? data : [];
      setProjekte(list);
      // Restore last projekt (only if timer not running)
      try {
        const lastId = localStorage.getItem(LAST_PROJEKT_KEY);
        if (lastId) {
          const found = list.find((p) => p._id === lastId);
          if (found) {
            setTimerProjekt((prev) => prev || found.title);
            setTimerProjektId((prev) => prev || found._id);
          }
        }
      } catch { /* */ }
    } catch { /* */ }
  };

  const fetchMitarbeiter = async () => {
    try {
      const res = await authFetch("/api/mitarbeiter");
      const data = await res.json();
      const list: MitarbeiterEintrag[] = Array.isArray(data) ? data.filter((m: MitarbeiterEintrag) => m.aktiv) : [];
      setMitarbeiterListe(list);
      // Restore last MA
      try {
        const lastId = localStorage.getItem(LAST_MA_KEY);
        if (lastId) {
          const found = list.find((m) => m._id === lastId);
          if (found) {
            setTimerMitarbeiter((prev) => prev || found.name);
            setTimerMitarbeiterId((prev) => prev || found._id);
            setTimerMitarbeiterRolle((prev) => prev || found.rolle);
            setTimerStundensatz((prev) => prev !== 65 ? prev : found.stundensatz);
          }
        }
      } catch { /* */ }
    } catch { /* */ }
  };

  const selectMitarbeiter = useCallback((m: MitarbeiterEintrag, setter: (f: Omit<TimeEntry, "_id">) => void, form: Omit<TimeEntry, "_id">) => {
    try { localStorage.setItem(LAST_MA_KEY, m._id); } catch { /* */ }
    setter({ ...form, mitarbeiter: m.name, mitarbeiterId: m._id, mitarbeiterRolle: m.rolle, stundensatz: m.stundensatz });
  }, []);

  const selectProjekt = useCallback((p: Projekt, setter: (n: string) => void, idSetter: (id: string) => void) => {
    try { localStorage.setItem(LAST_PROJEKT_KEY, p._id); } catch { /* */ }
    setter(p.title);
    idSetter(p._id);
  }, []);

  const startTimer = () => {
    const stored: StoredTimer = {
      startedAt: Date.now() - timerSeconds * 1000,
      projektName: timerProjekt,
      projektId: timerProjektId,
      taetigkeit: timerTaetigkeit,
      mitarbeiter: timerMitarbeiter,
    };
    localStorage.setItem(TIMER_LS_KEY, JSON.stringify(stored));
    setTimerRunning(true);
  };

  const stopTimer = () => {
    setTimerRunning(false);
    localStorage.removeItem(TIMER_LS_KEY);
    const hours = Math.max(0.5, Math.round((timerSeconds / 3600) * 10) / 10);
    setSaveForm({
      projektId: timerProjektId,
      projektName: timerProjekt,
      taetigkeit: timerTaetigkeit,
      mitarbeiter: timerMitarbeiter,
      mitarbeiterId: timerMitarbeiterId,
      mitarbeiterRolle: timerMitarbeiterRolle,
      date: new Date().toISOString().split("T")[0],
      hours,
      description: "",
      stundensatz: timerStundensatz,
    });
    setTimerSeconds(0);
    setSaveModalOpen(true);
  };

  const handleSaveEntry = async (form: Omit<TimeEntry, "_id">, onDone: () => void) => {
    setSaving(true);
    try {
      const res = await authFetch("/api/zeiterfassung", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { await fetchEntries(); onDone(); }
    } catch { /* */ }
    finally { setSaving(false); }
  };

  const handleDelete = async (entry: TimeEntry) => {
    if (!confirm("Eintrag löschen?")) return;
    try {
      await authFetch(`/api/zeiterfassung/${entry._id}`, { method: "DELETE" });
      await fetchEntries();
    } catch { /* */ }
  };

  const toggleSelect = (id: string) => {
    setSelectedEntries((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectedData = entries.filter((e) => e._id && selectedEntries.has(e._id));

  const openInvoiceModal = () => {
    const proj = projekte.find((p) => p._id === selectedData[0]?.projektId);
    setInvoiceKunde(proj?.customerName || selectedData[0]?.projektName || "");
    setInvoiceStundensatz(selectedData[0]?.stundensatz || 65);
    setInvoiceModalOpen(true);
  };

  const createInvoice = async () => {
    setInvoiceSaving(true);
    try {
      // Gruppe nach Rolle + Stundensatz → eine Position pro Gruppe
      type Group = { rolle: string; stundensatz: number; hours: number; count: number; projektName: string; };
      const groups: Record<string, Group> = {};
      for (const e of selectedData) {
        const rolle = e.mitarbeiterRolle || e.taetigkeit || "Sonstiges";
        const rate = e.stundensatz || invoiceStundensatz;
        const gKey = `${rolle}::${rate}`;
        if (!groups[gKey]) groups[gKey] = { rolle, stundensatz: rate, hours: 0, count: 0, projektName: e.projektName || "" };
        groups[gKey].hours += e.hours;
        groups[gKey].count += 1;
      }
      const items = Object.values(groups).map((g) => {
        const anzahl = g.count > 1 ? ` (${g.count} Mitarbeiter)` : "";
        const projekt = g.projektName ? ` – ${g.projektName}` : "";
        return {
          beschreibung: `Arbeitszeit ${g.rolle}${anzahl}${projekt}`,
          menge: g.hours,
          einheit: "Std.",
          einzelpreis: g.stundensatz,
          gesamt: g.hours * g.stundensatz,
          typ: "lohn" as const,
          mitarbeiter: g.count,
        };
      });
      const total = items.reduce((s, i) => s + i.gesamt, 0);
      const res = await authFetch("/api/rechnungen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: invoiceKunde || "—",
          abrechnungsart: "regie",
          betreff: selectedData[0]?.projektName ? `Arbeitszeiten – ${selectedData[0].projektName}` : "Arbeitszeiten",
          items,
          total,
          status: "offen",
        }),
      });
      if (res.ok) {
        setInvoiceModalOpen(false);
        setSelectedEntries(new Set());
        router.push("/rechnungen");
      }
    } catch { /* */ }
    finally { setInvoiceSaving(false); }
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, "0");
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  // Weekly stats
  const now = new Date();
  const dayOfWeek = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);
  const dayNames = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const dayHours = dayNames.map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const ds = d.toISOString().split("T")[0];
    return entries.filter((e) => e.date === ds).reduce((s, e) => s + (e.hours || 0), 0);
  });
  const maxDay = Math.max(...dayHours, 1);
  const weekHours = dayHours.reduce((s, h) => s + h, 0);
  const totalHours = entries.reduce((s, e) => s + (e.hours || 0), 0);
  const todayIdx = (dayOfWeek + 6) % 7;

  const inputSty = { background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" } as const;

  if (!loadingPro && !isPro) {
    return (
      <DashboardLayout title="Zeiterfassung" subtitle="Pro-Feature">
        <div className="flex flex-col items-center justify-center py-24 gap-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-full"
            style={{ background: "#f5a62322", border: "1px solid #f5a62366" }}>
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
          <button onClick={() => router.push("/upgrade")}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #f5a623, #c4841c)", color: "#0d1b2e" }}>
            <Zap size={16} />Jetzt upgraden — ab 19,99€/Monat
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Zeiterfassung" subtitle={`KW ${getKW(now)} · ${weekHours.toFixed(1)}h diese Woche`}>

      {/* Timer + Weekly */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">

        {/* Timer Card */}
        <div className="xl:col-span-1 rounded-2xl p-5 flex flex-col gap-4"
          style={{ background: "#112240", border: timerRunning ? "1px solid #22c55e55" : "1px solid #1e3a5f" }}>
          {/* Display */}
          <div className="flex flex-col items-center pt-2 pb-1">
            <div className="flex items-center justify-center w-14 h-14 rounded-full mb-3"
              style={{ background: timerRunning ? "#22c55e14" : "#00c6ff14", border: `2px solid ${timerRunning ? "#22c55e44" : "#00c6ff44"}` }}>
              <Clock size={26} style={{ color: timerRunning ? "#22c55e" : "#00c6ff" }} />
            </div>
            <p className="font-mono font-bold" style={{ color: "#e6edf3", fontSize: 44, letterSpacing: 2, lineHeight: 1 }}>
              {formatTime(timerSeconds)}
            </p>
            <p className="text-xs mt-2 text-center" style={{ color: timerRunning ? "#22c55e" : "#4a6fa5", minHeight: 18 }}>
              {timerRunning
                ? `${timerProjekt || "—"} · ${timerTaetigkeit}${timerMitarbeiter ? ` · ${timerMitarbeiter}` : ""}`
                : "Bereit zum Starten"}
            </p>
          </div>

          {/* Pre-start fields */}
          {!timerRunning && (
            <div className="space-y-2.5">
              {/* Projekt */}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#8b9ab5" }}>Projekt</label>
                <div className="relative">
                  <input
                    value={timerProjektOpen ? timerProjektSearch : timerProjekt}
                    onChange={(e) => { setTimerProjektSearch(e.target.value); setTimerProjektOpen(true); }}
                    onFocus={() => { setTimerProjektSearch(""); setTimerProjektOpen(true); }}
                    onBlur={() => setTimeout(() => setTimerProjektOpen(false), 160)}
                    placeholder="Projekt wählen…"
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none pr-8"
                    style={inputSty}
                  />
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#4a6fa5" }} />
                  {timerProjektOpen && (
                    <div className="absolute z-50 w-full top-full mt-1 rounded-xl overflow-hidden"
                      style={{ background: "#1a2f50", border: "1px solid #1e3a5f", boxShadow: "0 8px 24px rgba(0,0,0,0.5)", maxHeight: 180, overflowY: "auto" }}>
                      {projekte.filter((p) => !timerProjektSearch || p.title.toLowerCase().includes(timerProjektSearch.toLowerCase())).length === 0
                        ? <div className="px-3 py-2.5 text-xs" style={{ color: "#4a6fa5" }}>Keine Projekte gefunden</div>
                        : projekte.filter((p) => !timerProjektSearch || p.title.toLowerCase().includes(timerProjektSearch.toLowerCase())).map((p) => (
                          <button key={p._id} type="button"
                            onMouseDown={() => { selectProjekt(p, setTimerProjekt, setTimerProjektId); setTimerProjektSearch(""); setTimerProjektOpen(false); }}
                            className="flex flex-col w-full px-3 py-2 text-left transition-all"
                            style={{ borderBottom: "1px solid #1e3a5f22" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#00c6ff0f"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                            <span className="text-sm" style={{ color: "#e6edf3" }}>{p.title}</span>
                            <span className="text-xs" style={{ color: "#4a6fa5" }}>{p.customerName}</span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
              {/* Mitarbeiter */}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#8b9ab5" }}>Mitarbeiter</label>
                <div className="relative">
                  <input
                    value={timerMaOpen ? timerMaSearch : (timerMitarbeiter ? `${timerMitarbeiter}${timerMitarbeiterRolle ? ` (${timerMitarbeiterRolle})` : ""}` : "")}
                    onChange={(e) => { setTimerMaSearch(e.target.value); setTimerMaOpen(true); }}
                    onFocus={() => { setTimerMaSearch(""); setTimerMaOpen(true); }}
                    onBlur={() => setTimeout(() => setTimerMaOpen(false), 160)}
                    placeholder="Mitarbeiter wählen…"
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none pr-8"
                    style={inputSty}
                  />
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#4a6fa5" }} />
                  {timerMaOpen && (
                    <div className="absolute z-50 w-full top-full mt-1 rounded-xl overflow-hidden"
                      style={{ background: "#1a2f50", border: "1px solid #1e3a5f", boxShadow: "0 8px 24px rgba(0,0,0,0.5)", maxHeight: 200, overflowY: "auto" }}>
                      {mitarbeiterListe.filter((m) => !timerMaSearch || m.name.toLowerCase().includes(timerMaSearch.toLowerCase())).length === 0
                        ? <div className="px-3 py-2.5 text-xs" style={{ color: "#4a6fa5" }}>Keine Mitarbeiter gefunden</div>
                        : mitarbeiterListe.filter((m) => !timerMaSearch || m.name.toLowerCase().includes(timerMaSearch.toLowerCase())).map((m) => (
                          <button key={m._id} type="button"
                            onMouseDown={() => {
                              setTimerMitarbeiter(m.name); setTimerMitarbeiterId(m._id);
                              setTimerMitarbeiterRolle(m.rolle); setTimerStundensatz(m.stundensatz);
                              try { localStorage.setItem(LAST_MA_KEY, m._id); } catch { /* */ }
                              setTimerMaSearch(""); setTimerMaOpen(false);
                            }}
                            className="flex items-center justify-between w-full px-3 py-2.5 text-left transition-all"
                            style={{ borderBottom: "1px solid #1e3a5f22" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#00c6ff0f"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                            <div>
                              <span className="text-sm font-medium" style={{ color: "#e6edf3" }}>{m.name}</span>
                              <span className="text-xs ml-1.5" style={{ color: "#4a6fa5" }}>{m.rolle}</span>
                            </div>
                            <span className="text-xs font-semibold shrink-0" style={{ color: "#22c55e" }}>{m.stundensatz}€/h</span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
              {/* Tätigkeit */}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#8b9ab5" }}>Tätigkeit</label>
                <select value={timerTaetigkeit} onChange={(e) => setTimerTaetigkeit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={inputSty}>
                  {TAETIGKEITEN.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* START / STOP */}
          <button
            onClick={timerRunning ? stopTimer : startTimer}
            className="w-full rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all hover:opacity-90 active:scale-95"
            style={{
              background: timerRunning
                ? "linear-gradient(135deg, #ef4444, #c0392b)"
                : "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "#fff",
              minHeight: 56,
              fontSize: 18,
            }}
          >
            {timerRunning ? <Square size={22} /> : <Play size={22} />}
            {timerRunning ? "Stoppen" : "Starten"}
          </button>
        </div>

        {/* Weekly Summary */}
        <div className="xl:col-span-2 rounded-2xl p-5" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
          <h2 className="text-sm font-bold mb-4" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
            Diese Woche — KW {getKW(now)}
          </h2>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: "Wochenstunden", value: `${weekHours.toFixed(1)}h`, color: "#00c6ff" },
              { label: "Einträge gesamt", value: entries.length, color: "#f5a623" },
              { label: "Gesamtstunden", value: `${totalHours.toFixed(1)}h`, color: "#22c55e" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "#0d1b2e", border: "1px solid #1e3a5f" }}>
                <p className="text-xl font-bold" style={{ color: s.color, fontFamily: "var(--font-syne)" }}>{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: "#8b9ab5" }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Mo–So Bars */}
          <div className="flex items-end gap-1.5" style={{ height: 88 }}>
            {dayNames.map((day, i) => {
              const h = dayHours[i];
              const pct = (h / maxDay) * 100;
              const isToday = i === todayIdx;
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-mono" style={{ color: h > 0 ? "#00c6ff" : "transparent", fontSize: 9, height: 14 }}>
                    {h > 0 ? `${h}h` : ""}
                  </span>
                  <div className="w-full flex flex-col justify-end" style={{ height: 52 }}>
                    <div className="w-full rounded-t transition-all duration-300"
                      style={{
                        height: h > 0 ? `${Math.max(pct, 8)}%` : "2px",
                        background: isToday ? "#00c6ff" : (h > 0 ? "#00c6ff66" : "#1e3a5f"),
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold"
                    style={{ color: isToday ? "#e6edf3" : "#4a6fa5", fontSize: 10 }}>
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Entries */}
      <div className="rounded-2xl overflow-visible" style={{ border: "1px solid #1e3a5f" }}>
        <div className="flex items-center justify-between px-4 py-3"
          style={{ background: "#112240", borderBottom: "1px solid #1e3a5f", borderRadius: "16px 16px 0 0" }}>
          <h2 className="text-sm font-bold" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>Zeiteinträge</h2>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {selectedEntries.size > 0 && (
              <button onClick={openInvoiceModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
                <Receipt size={13} />In Rechnung ({selectedEntries.size})
              </button>
            )}
            <button
              onClick={() => {
                setManualForm({
                  ...EMPTY_FORM,
                  date: new Date().toISOString().split("T")[0],
                  projektId: timerProjektId,
                  projektName: timerProjekt,
                  mitarbeiter: timerMitarbeiter,
                  mitarbeiterId: timerMitarbeiterId,
                  mitarbeiterRolle: timerMitarbeiterRolle,
                  stundensatz: timerStundensatz,
                });
                setManualProjektSearch(""); setManualMaSearch("");
                setManualModalOpen(true);
                setTimeout(() => hoursManualRef.current?.focus(), 80);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: "linear-gradient(135deg, #00c6ff, #0099cc)", color: "#0d1b2e" }}>
              <Plus size={13} />Nachtragen
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16" style={{ background: "#0d1b2e" }}>
            <Loader size={20} className="animate-spin" style={{ color: "#00c6ff" }} />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ background: "#0d1b2e", borderRadius: "0 0 16px 16px" }}>
            <Clock size={28} style={{ color: "#1e3a5f" }} />
            <p className="text-sm" style={{ color: "#8b9ab5" }}>Noch keine Zeiteinträge</p>
          </div>
        ) : (
          <>
            {/* Desktop header */}
            <div className="hidden md:grid grid-cols-12 px-4 py-2 text-xs font-medium"
              style={{ background: "#0a1628", color: "#4a6fa5", borderBottom: "1px solid #1e3a5f" }}>
              <div className="col-span-1" />
              <div className="col-span-2">Datum</div>
              <div className="col-span-3">Projekt</div>
              <div className="col-span-2">Tätigkeit</div>
              <div className="col-span-2">Mitarbeiter</div>
              <div className="col-span-1">Std.</div>
              <div className="col-span-1" />
            </div>
            {entries.map((entry, i) => {
              const isSelected = entry._id ? selectedEntries.has(entry._id) : false;
              return (
                <div key={entry._id || i}
                  className="flex md:grid md:grid-cols-12 items-center px-4 py-3 gap-3 transition-all group"
                  style={{
                    background: isSelected ? "#00c6ff0a" : (i % 2 === 0 ? "#0d1b2e" : "#112240"),
                    borderBottom: i < entries.length - 1 ? "1px solid #1e3a5f33" : "none",
                    borderRadius: i === entries.length - 1 ? "0 0 16px 16px" : "0",
                  }}>
                  {/* Checkbox */}
                  <div className="col-span-1 shrink-0">
                    <button
                      onClick={() => entry._id && toggleSelect(entry._id)}
                      className="w-5 h-5 rounded flex items-center justify-center transition-all"
                      style={{
                        background: isSelected ? "#00c6ff" : "transparent",
                        border: `1.5px solid ${isSelected ? "#00c6ff" : "#2a4a6f"}`,
                      }}>
                      {isSelected && <Check size={11} style={{ color: "#0d1b2e" }} />}
                    </button>
                  </div>
                  {/* Date */}
                  <div className="col-span-2 text-xs flex items-center gap-1.5 shrink-0" style={{ color: "#8b9ab5" }}>
                    <Calendar size={11} />
                    {entry.date ? new Date(entry.date + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "short" }) : "—"}
                  </div>
                  {/* Projekt */}
                  <div className="col-span-3 text-sm font-medium truncate flex-1 md:flex-none" style={{ color: "#e6edf3" }}>
                    <span className="flex items-center gap-1.5">
                      <Briefcase size={11} style={{ color: "#4a6fa5", flexShrink: 0 }} />
                      <span className="truncate">{entry.projektName || "—"}</span>
                    </span>
                  </div>
                  {/* Tätigkeit */}
                  <div className="hidden md:block col-span-2">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "#00c6ff14", color: "#00c6ff", border: "1px solid #00c6ff2a" }}>
                      {entry.taetigkeit || "—"}
                    </span>
                  </div>
                  {/* Mitarbeiter */}
                  <div className="hidden md:flex col-span-2 text-xs items-center gap-1" style={{ color: "#8b9ab5" }}>
                    {entry.mitarbeiter && <><User size={11} />{entry.mitarbeiter}</>}
                  </div>
                  {/* Hours */}
                  <div className="col-span-1 shrink-0">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{ background: "#22c55e14", color: "#22c55e", border: "1px solid #22c55e2a" }}>
                      {entry.hours}h
                    </span>
                  </div>
                  {/* Delete */}
                  <div className="col-span-1 flex justify-end">
                    <button onClick={() => handleDelete(entry)}
                      className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      style={{ color: "#ef4444" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#ef444418"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* === Modal: Eintrag nach Timer-Stop === */}
      <Modal open={saveModalOpen} onClose={() => setSaveModalOpen(false)} title="Zeiteintrag speichern">
        <form onSubmit={(e) => { e.preventDefault(); handleSaveEntry(saveForm, () => setSaveModalOpen(false)); }} className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#0d1b2e", border: "1px solid #1e3a5f" }}>
            <Clock size={16} style={{ color: "#00c6ff" }} />
            <div className="text-sm">
              <span className="font-medium" style={{ color: "#e6edf3" }}>{saveForm.projektName || "Kein Projekt"}</span>
              <span style={{ color: "#4a6fa5" }}> · {saveForm.taetigkeit}{saveForm.mitarbeiter ? ` · ${saveForm.mitarbeiter}` : ""}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Stunden *</label>
              <input type="number" min="0.5" max="24" step="0.5" required
                value={saveForm.hours}
                onChange={(e) => setSaveForm({ ...saveForm, hours: Number(e.target.value) })}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputSty}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Stundensatz €</label>
              <input type="number" min="1"
                value={saveForm.stundensatz}
                onChange={(e) => setSaveForm({ ...saveForm, stundensatz: Number(e.target.value) })}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputSty}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Notiz (optional)</label>
            <input value={saveForm.description || ""}
              onChange={(e) => setSaveForm({ ...saveForm, description: e.target.value })}
              placeholder="z.B. Kabelverlegung EG"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputSty}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setSaveModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#8b9ab5" }}>
              Verwerfen
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #00c6ff, #0099cc)", color: "#0d1b2e" }}>
              {saving ? "Speichern…" : "Speichern"}
            </button>
          </div>
        </form>
      </Modal>

      {/* === Modal: Manueller Eintrag === */}
      <Modal open={manualModalOpen} onClose={() => setManualModalOpen(false)} title="Zeit nachtragen">
        <form onSubmit={(e) => { e.preventDefault(); handleSaveEntry(manualForm, () => setManualModalOpen(false)); }} className="space-y-4">

          {/* 1. Projekt */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Projekt</label>
            <div className="relative">
              <input
                value={manualProjektOpen ? manualProjektSearch : manualForm.projektName}
                onChange={(e) => { setManualProjektSearch(e.target.value); setManualProjektOpen(true); }}
                onFocus={() => { setManualProjektSearch(""); setManualProjektOpen(true); }}
                onBlur={() => setTimeout(() => setManualProjektOpen(false), 160)}
                placeholder="Projekt wählen…"
                className="w-full px-3 py-3 rounded-xl text-sm outline-none pr-8"
                style={inputSty}
              />
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#4a6fa5" }} />
              {manualProjektOpen && (
                <div className="absolute z-50 w-full top-full mt-1 rounded-xl overflow-hidden"
                  style={{ background: "#1a2f50", border: "1px solid #1e3a5f", boxShadow: "0 8px 24px rgba(0,0,0,0.5)", maxHeight: 180, overflowY: "auto" }}>
                  {projekte.filter((p) => !manualProjektSearch || p.title.toLowerCase().includes(manualProjektSearch.toLowerCase())).length === 0
                    ? <div className="px-3 py-2.5 text-xs" style={{ color: "#4a6fa5" }}>Keine Projekte gefunden</div>
                    : projekte.filter((p) => !manualProjektSearch || p.title.toLowerCase().includes(manualProjektSearch.toLowerCase())).map((p) => (
                      <button key={p._id} type="button"
                        onMouseDown={() => {
                          selectProjekt(p,
                            (t) => setManualForm((f) => ({ ...f, projektName: t })),
                            (id) => setManualForm((f) => ({ ...f, projektId: id }))
                          );
                          setManualProjektSearch(""); setManualProjektOpen(false);
                        }}
                        className="flex flex-col w-full px-3 py-2.5 text-left transition-all"
                        style={{ borderBottom: "1px solid #1e3a5f22" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#00c6ff0f"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                        <span className="text-sm" style={{ color: "#e6edf3" }}>{p.title}</span>
                        <span className="text-xs" style={{ color: "#4a6fa5" }}>{p.customerName}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* 2. Mitarbeiter */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Mitarbeiter</label>
            <div className="relative">
              <input
                value={manualMaOpen ? manualMaSearch : (manualForm.mitarbeiter ? `${manualForm.mitarbeiter}${manualForm.mitarbeiterRolle ? ` (${manualForm.mitarbeiterRolle})` : ""}` : "")}
                onChange={(e) => { setManualMaSearch(e.target.value); setManualMaOpen(true); }}
                onFocus={() => { setManualMaSearch(""); setManualMaOpen(true); }}
                onBlur={() => setTimeout(() => setManualMaOpen(false), 160)}
                placeholder="Mitarbeiter wählen…"
                className="w-full px-3 py-3 rounded-xl text-sm outline-none pr-8"
                style={inputSty}
              />
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#4a6fa5" }} />
              {manualMaOpen && (
                <div className="absolute z-50 w-full top-full mt-1 rounded-xl overflow-hidden"
                  style={{ background: "#1a2f50", border: "1px solid #1e3a5f", boxShadow: "0 8px 24px rgba(0,0,0,0.5)", maxHeight: 200, overflowY: "auto" }}>
                  {mitarbeiterListe.filter((m) => !manualMaSearch || m.name.toLowerCase().includes(manualMaSearch.toLowerCase())).length === 0
                    ? <div className="px-3 py-2.5 text-xs" style={{ color: "#4a6fa5" }}>Keine Mitarbeiter gefunden</div>
                    : mitarbeiterListe.filter((m) => !manualMaSearch || m.name.toLowerCase().includes(manualMaSearch.toLowerCase())).map((m) => (
                      <button key={m._id} type="button"
                        onMouseDown={() => { selectMitarbeiter(m, setManualForm, manualForm); setManualMaSearch(""); setManualMaOpen(false); }}
                        className="flex items-center justify-between w-full px-3 py-2.5 text-left transition-all"
                        style={{ borderBottom: "1px solid #1e3a5f22" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#00c6ff0f"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                        <div>
                          <span className="text-sm font-medium" style={{ color: "#e6edf3" }}>{m.name}</span>
                          <span className="text-xs ml-1.5" style={{ color: "#4a6fa5" }}>{m.rolle}</span>
                        </div>
                        <span className="text-xs font-semibold shrink-0" style={{ color: "#22c55e" }}>{m.stundensatz}€/h</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* 3. Stunden – groß + zentral */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-center" style={{ color: "#8b9ab5" }}>Stunden *</label>
            <input
              ref={hoursManualRef}
              type="number" min="0.5" max="24" step="0.5" required
              value={manualForm.hours}
              onChange={(e) => setManualForm({ ...manualForm, hours: Number(e.target.value) })}
              className="w-full rounded-xl text-center font-bold outline-none"
              style={{ ...inputSty, fontSize: 32, padding: "14px 16px", letterSpacing: 1 }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; e.currentTarget.select(); }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
            />
            <p className="text-xs text-center mt-1" style={{ color: "#4a6fa5" }}>
              {manualForm.stundensatz && manualForm.hours ? `${manualForm.hours}h × ${manualForm.stundensatz}€ = ${(manualForm.hours * (manualForm.stundensatz || 0)).toFixed(2)} €` : "Stunden eingeben"}
            </p>
          </div>

          {/* 4. Datum + Tätigkeit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Datum *</label>
              <input type="date" required
                value={manualForm.date}
                onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                className="w-full px-3 py-3 rounded-xl text-sm outline-none" style={inputSty}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Tätigkeit</label>
              <select value={manualForm.taetigkeit}
                onChange={(e) => setManualForm({ ...manualForm, taetigkeit: e.target.value })}
                className="w-full px-3 py-3 rounded-xl text-sm outline-none" style={inputSty}>
                {TAETIGKEITEN.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* 5. Notiz */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Notiz (optional)</label>
            <input value={manualForm.description || ""}
              onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
              placeholder="z.B. Kabelverlegung EG"
              className="w-full px-3 py-3 rounded-xl text-sm outline-none" style={inputSty}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
            />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setManualModalOpen(false)}
              className="flex-1 py-3 rounded-xl text-sm font-semibold"
              style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#8b9ab5" }}>
              Abbrechen
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #00c6ff, #0099cc)", color: "#0d1b2e" }}>
              {saving ? "Speichern…" : "Speichern"}
            </button>
          </div>
        </form>
      </Modal>

      {/* === Modal: In Rechnung übernehmen === */}
      <Modal open={invoiceModalOpen} onClose={() => setInvoiceModalOpen(false)} title="In Rechnung übernehmen">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Kundenname *</label>
            <input value={invoiceKunde}
              onChange={(e) => setInvoiceKunde(e.target.value)}
              placeholder="Kundenname…"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputSty}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Stundensatz (€/Std.)</label>
            <input type="number" min="1"
              value={invoiceStundensatz}
              onChange={(e) => setInvoiceStundensatz(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputSty}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
            />
          </div>
          <div className="rounded-xl p-3 space-y-2" style={{ background: "#0d1b2e", border: "1px solid #1e3a5f" }}>
            <p className="text-xs font-medium mb-2" style={{ color: "#4a6fa5" }}>Vorschau Positionen (gruppiert nach Rolle):</p>
            {(() => {
              type PGroup = { rolle: string; stundensatz: number; hours: number; count: number; projekt: string; };
              const grp: Record<string, PGroup> = {};
              for (const e of selectedData) {
                const rolle = e.mitarbeiterRolle || e.taetigkeit || "Sonstiges";
                const rate = e.stundensatz || invoiceStundensatz;
                const k = `${rolle}::${rate}`;
                if (!grp[k]) grp[k] = { rolle, stundensatz: rate, hours: 0, count: 0, projekt: e.projektName || "" };
                grp[k].hours += e.hours;
                grp[k].count += 1;
              }
              return Object.values(grp).map((g, i) => (
                <div key={i} className="flex items-center justify-between text-xs gap-2">
                  <span className="flex-1 truncate" style={{ color: "#8b9ab5" }}>
                    Arbeitszeit {g.rolle}{g.count > 1 ? ` (${g.count} MA)` : ""}{g.projekt ? ` – ${g.projekt}` : ""}
                  </span>
                  <span className="shrink-0 font-medium" style={{ color: "#e6edf3" }}>
                    {g.hours}h × {g.stundensatz}€ = {(g.hours * g.stundensatz).toFixed(2)}€
                  </span>
                </div>
              ));
            })()}
            <div className="flex justify-between pt-2" style={{ borderTop: "1px solid #1e3a5f" }}>
              <span className="text-xs font-bold" style={{ color: "#e6edf3" }}>Gesamtbetrag:</span>
              <span className="text-sm font-bold" style={{ color: "#00c6ff" }}>
                {selectedData.reduce((s, e) => s + e.hours * (e.stundensatz || invoiceStundensatz), 0).toFixed(2)} €
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setInvoiceModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#8b9ab5" }}>
              Abbrechen
            </button>
            <button onClick={createInvoice} disabled={invoiceSaving || !invoiceKunde.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
              <Receipt size={15} />{invoiceSaving ? "Wird erstellt…" : "Rechnung erstellen"}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
