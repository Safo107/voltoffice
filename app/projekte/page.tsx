"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { usePro } from "@/context/ProContext";
import { Briefcase, Plus, Search, MoreVertical, Calendar, User, AlertCircle, Trash2, Edit } from "lucide-react";
import SkeletonCard from "@/components/ui/SkeletonCard";

interface Project {
  _id?: string;
  title: string;
  customerName: string;
  status: "active" | "paused" | "completed";
  startDate: string;
  description: string;
}

const statusConfig = {
  active: { label: "Aktiv", color: "#22c55e" },
  paused: { label: "Pausiert", color: "#f5a623" },
  completed: { label: "Abgeschlossen", color: "#8b9ab5" },
};

const FREE_LIMIT = 3;

const EMPTY_FORM = { title: "", customerName: "", status: "active" as Project["status"], startDate: "", description: "" };

export default function ProjektePage() {
  const { isPro } = usePro();
  const router = useRouter();
  const [projekte, setProjekte] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editProjekt, setEditProjekt] = useState<Project | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => { fetchProjekte(); }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpen]);

  const fetchProjekte = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/projekte");
      const data = await res.json();
      setProjekte(Array.isArray(data) ? data : []);
    } catch {
      setProjekte([]);
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setEditProjekt(null);
    setForm({ ...EMPTY_FORM, startDate: new Date().toISOString().split("T")[0] });
    setModalOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditProjekt(p);
    setForm({ title: p.title, customerName: p.customerName, status: p.status, startDate: p.startDate, description: p.description });
    setModalOpen(true);
    setMenuOpen(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editProjekt) {
        await fetch(`/api/projekte/${editProjekt._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        await fetch("/api/projekte", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      await fetchProjekte();
      setModalOpen(false);
    } catch {
      //
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: Project) => {
    if (!confirm(`Projekt "${p.title}" wirklich löschen?`)) return;
    try {
      await fetch(`/api/projekte/${p._id}`, { method: "DELETE" });
      await fetchProjekte();
    } catch {
      //
    }
    setMenuOpen(null);
  };

  const filtered = projekte.filter(
    (p) => p.title.toLowerCase().includes(search.toLowerCase()) || p.customerName.toLowerCase().includes(search.toLowerCase())
  );
  const atLimit = !isPro && projekte.length >= FREE_LIMIT;

  return (
    <DashboardLayout
      title="Projekte"
      subtitle={isPro ? `${projekte.length} Projekte` : `${projekte.length} von ${FREE_LIMIT} Projekten (Free)`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm flex-1 max-w-xs"
          style={{ background: "#112240", border: "1px solid #1e3a5f", color: "#8b9ab5" }}>
          <Search size={15} />
          <input type="text" placeholder="Projekt suchen..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm" style={{ color: "#e6edf3" }} />
        </div>
        <button onClick={openNew} disabled={atLimit}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ml-3 disabled:cursor-not-allowed"
          style={{ background: atLimit ? "#1e3a5f" : "linear-gradient(135deg, #00c6ff, #0099cc)", color: atLimit ? "#4a5568" : "#0d1b2e" }}>
          <Plus size={16} /> Neues Projekt
        </button>
      </div>

      {atLimit && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl mb-4"
          style={{ background: "#f5a62310", border: "1px solid #f5a62333" }}>
          <div className="flex items-start gap-3">
            <AlertCircle size={16} style={{ color: "#f5a623", marginTop: 1 }} />
            <p className="text-sm" style={{ color: "#e6edf3" }}>
              <span style={{ color: "#f5a623", fontWeight: 600 }}>Free-Limit erreicht.</span>{" "}
              Max. {FREE_LIMIT} Projekte im Free-Plan.
            </p>
          </div>
          <button
            onClick={() => router.push("/upgrade")}
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #f5a623, #c4841c)", color: "#0d1b2e" }}
          >
            Upgraden
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Briefcase size={32} />} title="Noch keine Projekte"
          description="Legen Sie Ihr erstes Projekt an."
          action={!atLimit ? (
            <button onClick={openNew}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "linear-gradient(135deg, #00c6ff, #0099cc)", color: "#0d1b2e" }}>
              <Plus size={15} /> Erstes Projekt anlegen
            </button>
          ) : undefined} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project) => {
            const id = project._id || project.title;
            const sc = statusConfig[project.status] || statusConfig.active;
            return (
              <div key={id} className="rounded-xl p-5 transition-all"
                style={{ background: "#112240", border: "1px solid #1e3a5f" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00c6ff33"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg"
                    style={{ background: "#22c55e18", border: "1px solid #22c55e33" }}>
                    <Briefcase size={18} style={{ color: "#22c55e" }} />
                  </div>
                  <div className="flex items-center gap-2 relative">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: `${sc.color}22`, color: sc.color, border: `1px solid ${sc.color}44` }}>
                      {sc.label}
                    </span>
                    <button className="p-1 rounded transition-all" style={{ color: "#8b9ab5" }}
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === id ? null : id); }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#e6edf3"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#8b9ab5"; }}>
                      <MoreVertical size={14} />
                    </button>
                    {menuOpen === id && (
                      <div className="absolute right-0 top-8 rounded-xl py-1 z-20 min-w-32"
                        style={{ background: "#1a2f50", border: "1px solid #1e3a5f", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
                        <button onClick={() => openEdit(project)}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm transition-all" style={{ color: "#e6edf3" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#1e3a5f"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                          <Edit size={13} /> Bearbeiten
                        </button>
                        <button onClick={() => handleDelete(project)}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm transition-all" style={{ color: "#ef4444" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#ef444418"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                          <Trash2 size={13} /> Löschen
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <h3 className="text-base font-bold mb-1" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
                  {project.title}
                </h3>
                <p className="text-xs mb-3" style={{ color: "#8b9ab5" }}>{project.description}</p>
                <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid #1e3a5f" }}>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: "#8b9ab5" }}>
                    <User size={11} />{project.customerName}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: "#8b9ab5" }}>
                    <Calendar size={11} />
                    {project.startDate ? new Date(project.startDate).toLocaleDateString("de-DE", { day: "2-digit", month: "short" }) : "—"}
                  </div>
                </div>
              </div>
            );
          })}

          {!atLimit && (
            <div onClick={openNew}
              className="rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all"
              style={{ background: "transparent", border: "2px dashed #1e3a5f", minHeight: "160px", color: "#8b9ab5" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00c6ff44"; e.currentTarget.style.background = "#00c6ff08"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; e.currentTarget.style.background = "transparent"; }}>
              <Plus size={22} className="mb-2" style={{ color: "#1e3a5f" }} />
              <p className="text-xs">Projekt hinzufügen</p>
            </div>
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editProjekt ? "Projekt bearbeiten" : "Neues Projekt"}>
        <form onSubmit={handleSave} className="space-y-4">
          {/* Templates — nur bei neuem Projekt */}
          {!editProjekt && (
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: "#8b9ab5" }}>Vorlage wählen</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    label: "EFH Standard",
                    icon: "🏠",
                    data: { title: "EFH Neuinstallation", description: "Elektroinstallation Einfamilienhaus nach VDE 0100-520, 3-phasig 400V" },
                  },
                  {
                    label: "Wohnanlage",
                    icon: "🏢",
                    data: { title: "Wohnanlage", description: "Mehrfamilienhaus Neuinstallation, inkl. PV-Vorbereitung und E-Mobilität" },
                  },
                  {
                    label: "Industrie",
                    icon: "⚙️",
                    data: { title: "Industrieanlage", description: "Industrieinstallation, Schaltschrankbau nach VDE 0100-700, Steuertechnik" },
                  },
                ].map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, ...t.data }))}
                    className="flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-xs font-medium transition-all"
                    style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#8b9ab5" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00c6ff44"; e.currentTarget.style.color = "#00c6ff"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; e.currentTarget.style.color = "#8b9ab5"; }}
                  >
                    <span className="text-lg">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Projekttitel *</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="z.B. Wohnanlage Bergstraße"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Kunde</label>
            <input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              placeholder="z.B. Schulz GmbH"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Project["status"] })}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }}>
                <option value="active">Aktiv</option>
                <option value="paused">Pausiert</option>
                <option value="completed">Abgeschlossen</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Startdatum</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Beschreibung</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="z.B. Elektroinstallation Neubau, 12 Einheiten" rows={3}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }} />
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
              {saving ? "Wird gespeichert..." : editProjekt ? "Aktualisieren" : "Anlegen"}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
