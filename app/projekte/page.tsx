"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { usePro } from "@/context/ProContext";
import { Briefcase, Plus, Search, MoreVertical, Calendar, User, AlertCircle, Trash2, Edit, Home, Building2, Factory, Package, X, Check } from "lucide-react";
import SkeletonCard from "@/components/ui/SkeletonCard";

interface Project {
  _id?: string;
  title: string;
  customerName: string;
  status: "active" | "paused" | "completed";
  startDate: string;
  description: string;
}

interface MaterialItem {
  _id?: string;
  projektId: string;
  name: string;
  menge: number;
  einheit: string;
  preis?: number;
  verbraucht: boolean;
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
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [materialProjekt, setMaterialProjekt] = useState<Project | null>(null);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [materialLoading, setMaterialLoading] = useState(false);
  const [matForm, setMatForm] = useState({ name: "", menge: 1, einheit: "Stk.", preis: 0 });
  const [matSaving, setMatSaving] = useState(false);

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

  const openMaterial = async (p: Project) => {
    setMaterialProjekt(p);
    setMaterialModalOpen(true);
    setMenuOpen(null);
    setMaterialLoading(true);
    try {
      const res = await fetch(`/api/material?projektId=${p._id}`);
      const data = await res.json();
      setMaterials(Array.isArray(data) ? data : []);
    } catch { setMaterials([]); }
    finally { setMaterialLoading(false); }
  };

  const addMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialProjekt?._id || !matForm.name.trim()) return;
    setMatSaving(true);
    try {
      const res = await fetch("/api/material", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...matForm, projektId: materialProjekt._id, verbraucht: false }),
      });
      if (res.ok) {
        const created = await res.json();
        setMaterials((prev) => [created, ...prev]);
        setMatForm({ name: "", menge: 1, einheit: "Stk.", preis: 0 });
      }
    } catch { /* */ }
    finally { setMatSaving(false); }
  };

  const toggleVerbraucht = async (item: MaterialItem) => {
    try {
      await fetch(`/api/material/${item._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verbraucht: !item.verbraucht }),
      });
      setMaterials((prev) => prev.map((m) => m._id === item._id ? { ...m, verbraucht: !m.verbraucht } : m));
    } catch { /* */ }
  };

  const deleteMaterial = async (item: MaterialItem) => {
    try {
      await fetch(`/api/material/${item._id}`, { method: "DELETE" });
      setMaterials((prev) => prev.filter((m) => m._id !== item._id));
    } catch { /* */ }
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
                        <button onClick={() => openMaterial(project)}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm transition-all" style={{ color: "#f5a623" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#f5a62318"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                          <Package size={13} /> Material verwalten
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
                    icon: <Home size={18} />,
                    data: { title: "EFH Neuinstallation", description: "Elektroinstallation Einfamilienhaus nach VDE 0100-520, 3-phasig 400V" },
                  },
                  {
                    label: "Wohnanlage",
                    icon: <Building2 size={18} />,
                    data: { title: "Wohnanlage", description: "Mehrfamilienhaus Neuinstallation, inkl. PV-Vorbereitung und E-Mobilität" },
                  },
                  {
                    label: "Industrie",
                    icon: <Factory size={18} />,
                    data: { title: "Industrieanlage", description: "Industrieinstallation, Schaltschrankbau nach VDE 0100-700, Steuertechnik" },
                  },
                ].map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, ...t.data }))}
                    className="flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-medium transition-all"
                    style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#8b9ab5" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00c6ff44"; e.currentTarget.style.color = "#00c6ff"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; e.currentTarget.style.color = "#8b9ab5"; }}
                  >
                    {t.icon}
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
      {/* Material Modal */}
      <Modal
        open={materialModalOpen}
        onClose={() => setMaterialModalOpen(false)}
        title={`Material – ${materialProjekt?.title || ""}`}
        maxWidth="560px"
      >
        <div className="space-y-4">
          {/* Add form */}
          <form onSubmit={addMaterial} className="rounded-xl p-3 space-y-3" style={{ background: "#0d1b2e", border: "1px solid #1e3a5f" }}>
            <p className="text-xs font-medium" style={{ color: "#4a6fa5" }}>Material hinzufügen</p>
            <div className="flex gap-2">
              <input
                required value={matForm.name}
                onChange={(e) => setMatForm({ ...matForm, name: e.target.value })}
                placeholder="Name (z.B. NYM-J 3x1,5)"
                className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "#112240", border: "1px solid #1e3a5f", color: "#e6edf3" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
              />
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="number" min="0.01" step="any" required
                value={matForm.menge}
                onChange={(e) => setMatForm({ ...matForm, menge: Number(e.target.value) })}
                placeholder="Menge"
                className="w-20 px-3 py-2 rounded-lg text-sm outline-none text-center"
                style={{ background: "#112240", border: "1px solid #1e3a5f", color: "#e6edf3" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
              />
              <select value={matForm.einheit} onChange={(e) => setMatForm({ ...matForm, einheit: e.target.value })}
                className="px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "#112240", border: "1px solid #1e3a5f", color: "#e6edf3" }}>
                {["Stk.", "m", "m²", "kg", "l", "Pkg.", "Rolle", "Set"].map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              <input
                type="number" min="0" step="0.01"
                value={matForm.preis}
                onChange={(e) => setMatForm({ ...matForm, preis: Number(e.target.value) })}
                placeholder="Preis €"
                className="w-24 px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "#112240", border: "1px solid #1e3a5f", color: "#e6edf3" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
              />
              <button type="submit" disabled={matSaving}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #00c6ff, #0099cc)", color: "#0d1b2e" }}>
                <Plus size={13} />Hinzufügen
              </button>
            </div>
          </form>

          {/* Material list */}
          {materialLoading ? (
            <div className="text-center py-8" style={{ color: "#4a6fa5" }}>Laden…</div>
          ) : materials.length === 0 ? (
            <div className="text-center py-8 text-sm" style={{ color: "#8b9ab5" }}>
              <Package size={24} className="mx-auto mb-2" style={{ color: "#1e3a5f" }} />
              Noch kein Material erfasst
            </div>
          ) : (
            <div className="space-y-1.5">
              {materials.map((item) => (
                <div key={item._id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                  style={{ background: item.verbraucht ? "#22c55e08" : "#112240", border: `1px solid ${item.verbraucht ? "#22c55e2a" : "#1e3a5f"}` }}>
                  <button
                    onClick={() => toggleVerbraucht(item)}
                    className="w-5 h-5 rounded flex items-center justify-center shrink-0 transition-all"
                    style={{ background: item.verbraucht ? "#22c55e" : "transparent", border: `1.5px solid ${item.verbraucht ? "#22c55e" : "#2a4a6f"}` }}
                    title={item.verbraucht ? "Als verfügbar markieren" : "Als verbraucht markieren"}>
                    {item.verbraucht && <Check size={11} style={{ color: "#0d1b2e" }} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block" style={{ color: item.verbraucht ? "#4a6fa5" : "#e6edf3", textDecoration: item.verbraucht ? "line-through" : "none" }}>
                      {item.name}
                    </span>
                  </div>
                  <span className="text-xs font-medium shrink-0" style={{ color: "#8b9ab5" }}>
                    {item.menge} {item.einheit}
                  </span>
                  {(item.preis ?? 0) > 0 && (
                    <span className="text-xs shrink-0" style={{ color: "#f5a623" }}>
                      {((item.preis ?? 0) * item.menge).toFixed(2)} €
                    </span>
                  )}
                  <span className="text-xs px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ background: item.verbraucht ? "#22c55e18" : "#f5a62318", color: item.verbraucht ? "#22c55e" : "#f5a623", border: `1px solid ${item.verbraucht ? "#22c55e2a" : "#f5a6232a"}` }}>
                    {item.verbraucht ? "Verbraucht" : "Verfügbar"}
                  </span>
                  <button onClick={() => deleteMaterial(item)}
                    className="p-1 rounded-lg transition-all shrink-0"
                    style={{ color: "#4a6fa5" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "#ef444418"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#4a6fa5"; e.currentTarget.style.background = "transparent"; }}>
                    <X size={13} />
                  </button>
                </div>
              ))}
              {materials.some((m) => m.verbraucht && (m.preis ?? 0) > 0) && (
                <div className="flex justify-end pt-1">
                  <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: "#22c55e18", color: "#22c55e", border: "1px solid #22c55e2a" }}>
                    Verbraucht gesamt: {materials.filter((m) => m.verbraucht).reduce((s, m) => s + (m.preis ?? 0) * m.menge, 0).toFixed(2)} €
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </DashboardLayout>
  );
}
