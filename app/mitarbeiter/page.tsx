"use client";

import { useState, useEffect } from "react";
import { authFetch } from "@/lib/authFetch";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { usePro } from "@/context/ProContext";
import { useRouter } from "next/navigation";
import { UserCheck, Plus, Search, MoreVertical, Trash2, Edit, Loader, Lock, Zap, Mail, Phone, Euro } from "lucide-react";

const ROLLEN = ["Elektriker", "Geselle", "Meister", "Azubi", "Bauleiter", "Monteur", "Projektleiter", "Sonstige"];

interface Mitarbeiter {
  _id?: string;
  name: string;
  rolle: string;
  email: string;
  telefon?: string;
  stundensatz: number;
  aktiv: boolean;
  createdAt?: string;
}

const EMPTY: Mitarbeiter = { name: "", rolle: "Elektriker", email: "", telefon: "", stundensatz: 55, aktiv: true };

export default function MitarbeiterPage() {
  const { isPro, loadingPro } = usePro();
  const router = useRouter();
  const [liste, setListe] = useState<Mitarbeiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Mitarbeiter | null>(null);
  const [form, setForm] = useState<Mitarbeiter>({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => { if (isPro) fetchListe(); }, [isPro]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpen]);

  const fetchListe = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/mitarbeiter");
      const data = await res.json();
      setListe(Array.isArray(data) ? data : []);
    } catch { setListe([]); }
    finally { setLoading(false); }
  };

  const openNew = () => { setEditItem(null); setForm({ ...EMPTY }); setModalOpen(true); };
  const openEdit = (m: Mitarbeiter) => { setEditItem(m); setForm({ ...m }); setModalOpen(true); };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editItem?._id) {
        await authFetch(`/api/mitarbeiter/${editItem._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      } else {
        await authFetch("/api/mitarbeiter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      }
      setModalOpen(false);
      fetchListe();
    } finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm("Mitarbeiter wirklich löschen?")) return;
    await authFetch(`/api/mitarbeiter/${id}`, { method: "DELETE" });
    fetchListe();
  };

  const filtered = liste.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.rolle.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loadingPro) return (
    <DashboardLayout title="Mitarbeiter" subtitle="Pro-Feature">
      <div className="flex justify-center py-24"><Loader size={24} className="animate-spin" style={{ color: "#00c6ff" }} /></div>
    </DashboardLayout>
  );

  if (!isPro) return (
    <DashboardLayout title="Mitarbeiter" subtitle="Pro-Feature">
      <div className="flex flex-col items-center justify-center py-24 gap-6">
        <div className="flex items-center justify-center w-16 h-16 rounded-full" style={{ background: "#f5a62322", border: "1px solid #f5a62366" }}>
          <Lock size={28} style={{ color: "#f5a623" }} />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>Mitarbeiterverwaltung — Pro-Feature</h2>
          <p className="text-sm" style={{ color: "#8b9ab5" }}>Mitarbeiter anlegen, Rollen zuweisen und Stundensätze verwalten.</p>
        </div>
        <button onClick={() => router.push("/upgrade")} className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg,#f5a623,#c4841c)", color: "#0d1b2e" }}>
          <Zap size={16} /> Jetzt upgraden — ab 19,99€/Monat
        </button>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout title="Mitarbeiter" subtitle={`${liste.length} Mitarbeiter`}>
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2 rounded-xl" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
          <Search size={15} style={{ color: "#8b9ab5", flexShrink: 0 }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Suchen…" className="bg-transparent outline-none text-sm w-full" style={{ color: "#e6edf3" }} />
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg,#00c6ff,#0099cc)", color: "#0d1b2e" }}>
          <Plus size={15} /> Neuer Mitarbeiter
        </button>
      </div>

      {liste.length > 0 && (
        <div className="space-y-3 mb-6">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Gesamt", value: String(liste.length), color: "#00c6ff" },
              { label: "Aktiv", value: String(liste.filter((m) => m.aktiv).length), color: "#22c55e" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
                <p className="text-xl font-bold" style={{ color: s.color, fontFamily: "var(--font-syne)" }}>{s.value}</p>
                <p className="text-xs" style={{ color: "#8b9ab5" }}>{s.label}</p>
              </div>
            ))}
          </div>
          {/* Stundensatz pro Rolle */}
          <div className="rounded-xl p-4" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
            <p className="text-xs font-medium mb-3" style={{ color: "#4a6fa5" }}>Stundensätze nach Rolle</p>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(liste.map((m) => m.rolle))).map((rolle) => {
                const perRolle = liste.filter((m) => m.rolle === rolle);
                const avg = Math.round(perRolle.reduce((s, m) => s + m.stundensatz, 0) / perRolle.length);
                return (
                  <div key={rolle} className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                    style={{ background: "#0d1b2e", border: "1px solid #1e3a5f" }}>
                    <span className="text-xs" style={{ color: "#8b9ab5" }}>{rolle}</span>
                    <span className="text-sm font-bold" style={{ color: "#f5a623" }}>{avg} €/h</span>
                    {perRolle.length > 1 && (
                      <span className="text-xs" style={{ color: "#4a6fa5" }}>({perRolle.length}×)</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader size={24} className="animate-spin" style={{ color: "#00c6ff" }} /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<UserCheck size={32} style={{ color: "#8b9ab5" }} />} title="Noch keine Mitarbeiter" description="Lege deinen ersten Mitarbeiter an." />
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <div key={String(m._id)} className="flex items-center gap-4 px-5 py-4 rounded-xl" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
              <div className="flex items-center justify-center w-10 h-10 rounded-full shrink-0 text-sm font-bold" style={{ background: "#00c6ff22", color: "#00c6ff", border: "1px solid #00c6ff33" }}>
                {m.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold" style={{ color: "#e6edf3" }}>{m.name}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#00c6ff18", color: "#00c6ff", border: "1px solid #00c6ff33" }}>{m.rolle}</span>
                  {!m.aktiv && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#ef444418", color: "#ef4444" }}>Inaktiv</span>}
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  {m.email && <span className="flex items-center gap-1 text-xs" style={{ color: "#8b9ab5" }}><Mail size={11} />{m.email}</span>}
                  {m.telefon && <span className="flex items-center gap-1 text-xs" style={{ color: "#8b9ab5" }}><Phone size={11} />{m.telefon}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Euro size={12} style={{ color: "#f5a623" }} />
                <span className="text-sm font-bold" style={{ color: "#f5a623" }}>{m.stundensatz} €/h</span>
              </div>
              <div className="relative shrink-0">
                <button onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === String(m._id) ? null : String(m._id)); }} className="p-1.5 rounded-lg" style={{ color: "#8b9ab5" }}>
                  <MoreVertical size={16} />
                </button>
                {menuOpen === String(m._id) && (
                  <div className="absolute right-0 top-8 z-50 rounded-xl py-1 min-w-40 shadow-xl" style={{ background: "#0d1b2e", border: "1px solid #1e3a5f" }}>
                    <button onClick={() => { openEdit(m); setMenuOpen(null); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-white/5" style={{ color: "#e6edf3" }}>
                      <Edit size={13} /> Bearbeiten
                    </button>
                    <button onClick={() => { del(String(m._id)); setMenuOpen(null); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-white/5" style={{ color: "#ef4444" }}>
                      <Trash2 size={13} /> Löschen
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Mitarbeiter bearbeiten" : "Neuer Mitarbeiter"} maxWidth="480px">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#8b9ab5" }}>Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Max Mustermann" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#8b9ab5" }}>Rolle</label>
              <select value={form.rolle} onChange={(e) => setForm({ ...form, rolle: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }}>
                {ROLLEN.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#8b9ab5" }}>Stundensatz (€/h)</label>
              <input type="number" min={0} value={form.stundensatz} onChange={(e) => setForm({ ...form, stundensatz: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#8b9ab5" }}>E-Mail</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="max@betrieb.de" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#8b9ab5" }}>Telefon</label>
            <input value={form.telefon || ""} onChange={(e) => setForm({ ...form, telefon: e.target.value })} placeholder="030 12345678" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }} />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setForm({ ...form, aktiv: !form.aktiv })} className="relative w-10 h-6 rounded-full transition-all shrink-0" style={{ background: form.aktiv ? "#22c55e" : "#1e3a5f" }}>
              <span className="absolute top-1 w-4 h-4 rounded-full transition-all" style={{ background: "#fff", left: form.aktiv ? "22px" : "2px" }} />
            </button>
            <span className="text-sm" style={{ color: "#e6edf3" }}>Mitarbeiter aktiv</span>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 py-2 rounded-xl text-sm font-medium" style={{ background: "#112240", color: "#8b9ab5", border: "1px solid #1e3a5f" }}>Abbrechen</button>
            <button onClick={save} disabled={saving || !form.name.trim()} className="flex-1 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50" style={{ background: "linear-gradient(135deg,#00c6ff,#0099cc)", color: "#0d1b2e" }}>
              {saving ? "Speichern…" : editItem ? "Aktualisieren" : "Erstellen"}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
