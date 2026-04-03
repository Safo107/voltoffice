"use client";

import { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/lib/authFetch";
import { usePro } from "@/context/ProContext";
import { getPlanLimits } from "@/lib/planLimits";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import UpgradeModal from "@/components/ui/UpgradeModal";
import PlanLimitBar from "@/components/ui/PlanLimitBar";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  MoreVertical,
  AlertCircle,
  Trash2,
  Edit,
  Loader,
} from "lucide-react";

interface Customer {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zip: string;
  createdAt?: string;
}

const EMPTY_FORM: Omit<Customer, "_id" | "createdAt"> = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  zip: "",
};

export default function KundenPage() {
  const { plan } = usePro();
  const limits = getPlanLimits(plan);
  const kundenLimit = limits.kunden === Infinity ? -1 : limits.kunden;

  const [kunden, setKunden] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editKunde, setEditKunde] = useState<Customer | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [confirmKunde, setConfirmKunde] = useState<Customer | null>(null);

  useEffect(() => {
    fetchKunden();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpen]);

  const fetchKunden = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/kunden");
      if (!res.ok) throw new Error(`Fehler ${res.status}`);
      const data = await res.json();
      setKunden(Array.isArray(data) ? data : []);
    } catch {
      setKunden([]);
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setEditKunde(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (kunde: Customer) => {
    setEditKunde(kunde);
    setForm({
      name: kunde.name,
      email: kunde.email,
      phone: kunde.phone,
      address: kunde.address,
      city: kunde.city,
      zip: kunde.zip,
    });
    setModalOpen(true);
    setMenuOpen(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editKunde) {
        const id = editKunde._id || editKunde.id;
        await authFetch(`/api/kunden/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        const res = await authFetch("/api/kunden", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.status === 403) {
          setModalOpen(false);
          setUpgradeOpen(true);
          return;
        }
      }
      await fetchKunden();
      setModalOpen(false);
    } catch {
      // Error handling
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (kunde: Customer) => {
    setConfirmKunde(kunde);
    setMenuOpen(null);
  };

  const confirmDelete = async () => {
    if (!confirmKunde) return;
    const id = confirmKunde._id || confirmKunde.id;
    try {
      await authFetch(`/api/kunden/${id}`, { method: "DELETE" });
      await fetchKunden();
    } catch { /* ignore */ }
    setConfirmKunde(null);
  };

  const filtered = kunden.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );
  const atLimit = kundenLimit !== -1 && kunden.length >= kundenLimit;
  const subtitle = kundenLimit === -1
    ? `${kunden.length} Kunden`
    : `${kunden.length} von ${kundenLimit} Kunden`;

  return (
    <DashboardLayout title="Kunden" subtitle={subtitle}>
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} resource="kunden" limit={kundenLimit === -1 ? undefined : kundenLimit} />
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm flex-1 max-w-xs"
          style={{ background: "#112240", border: "1px solid #1e3a5f", color: "#8b9ab5" }}
        >
          <Search size={15} />
          <input
            type="text"
            placeholder="Kunde suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "#e6edf3" }}
          />
        </div>

        <button
          onClick={atLimit ? () => setUpgradeOpen(true) : openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ml-3"
          style={{
            background: atLimit ? "#f5a62322" : "linear-gradient(135deg, #00c6ff, #0099cc)",
            color: atLimit ? "#f5a623" : "#0d1b2e",
            border: atLimit ? "1px solid #f5a62344" : "none",
          }}
        >
          <Plus size={16} />
          {atLimit ? "Limit erreicht — Upgrade" : "Neuer Kunde"}
        </button>
      </div>

      {kundenLimit !== -1 && (
        <div className="mb-4">
          <PlanLimitBar label="Kunden" count={kunden.length} limit={kundenLimit} />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader size={24} className="animate-spin" style={{ color: "#00c6ff" }} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={32} />}
          title="Noch keine Kunden"
          description="Legen Sie Ihren ersten Kunden an."
          action={
            <button
              onClick={openNew}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "linear-gradient(135deg, #00c6ff, #0099cc)", color: "#0d1b2e" }}
            >
              <Plus size={15} />
              Ersten Kunden anlegen
            </button>
          }
        />
      ) : (
        <div
          className="rounded-xl"
          style={{ border: "1px solid #1e3a5f" }}
        >
          <div
            className="grid grid-cols-12 px-4 py-3 text-xs font-semibold uppercase tracking-wider rounded-t-xl"
            style={{ background: "#112240", color: "#8b9ab5", borderBottom: "1px solid #1e3a5f" }}
          >
            <div className="col-span-4">Name / Firma</div>
            <div className="col-span-3">Kontakt</div>
            <div className="col-span-3">Ort</div>
            <div className="col-span-1">Seit</div>
            <div className="col-span-1" />
          </div>

          {filtered.map((kunde, i) => {
            const id = kunde._id || kunde.id || String(i);
            return (
              <div
                key={id}
                className="grid grid-cols-12 px-4 py-4 items-center transition-all"
                style={{
                  background: i % 2 === 0 ? "#0d1b2e" : "#112240",
                  borderBottom: i < filtered.length - 1 ? "1px solid #1e3a5f44" : "none",
                  ...(i === filtered.length - 1 ? { borderRadius: "0 0 0.75rem 0.75rem" } : {}),
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#00c6ff08"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 0 ? "#0d1b2e" : "#112240"; }}
              >
                <div className="col-span-4 flex items-center gap-3">
                  <div
                    className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0 text-sm font-bold"
                    style={{ background: "#00c6ff18", color: "#00c6ff", border: "1px solid #00c6ff33" }}
                  >
                    {kunde.name.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-sm font-medium" style={{ color: "#e6edf3" }}>{kunde.name}</p>
                </div>

                <div className="col-span-3">
                  <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#8b9ab5" }}>
                    <Mail size={11} />{kunde.email}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: "#8b9ab5" }}>
                    <Phone size={11} />{kunde.phone}
                  </div>
                </div>

                <div className="col-span-3">
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: "#8b9ab5" }}>
                    <MapPin size={11} />{kunde.zip} {kunde.city}
                  </div>
                </div>

                <div className="col-span-1">
                  <p className="text-xs" style={{ color: "#4a5568" }}>
                    {kunde.createdAt
                      ? new Date(kunde.createdAt).toLocaleDateString("de-DE", { month: "short", year: "2-digit" })
                      : "—"}
                  </p>
                </div>

                <div className="col-span-1 flex justify-end relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === id ? null : id); }}
                    className="p-1.5 rounded-lg transition-all"
                    style={{ color: "#8b9ab5" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#1e3a5f"; e.currentTarget.style.color = "#e6edf3"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#8b9ab5"; }}
                  >
                    <MoreVertical size={15} />
                  </button>
                  {menuOpen === id && (
                    <div
                      className="absolute right-0 top-8 rounded-xl py-1 z-20 min-w-32"
                      style={{ background: "#1a2f50", border: "1px solid #1e3a5f", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}
                    >
                      <button
                        onClick={() => openEdit(kunde)}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm transition-all"
                        style={{ color: "#e6edf3" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#1e3a5f"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <Edit size={13} /> Bearbeiten
                      </button>
                      <button
                        onClick={() => handleDelete(kunde)}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm transition-all"
                        style={{ color: "#ef4444" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#ef444418"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <Trash2 size={13} /> Löschen
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editKunde ? "Kunde bearbeiten" : "Neuen Kunden anlegen"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>
                Firmenname / Name *
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Musterbetrieb GmbH"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>E-Mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="kontakt@firma.de"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Telefon</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="030 12345678"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Straße & Hausnummer</label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Musterstraße 1"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>PLZ</label>
              <input
                value={form.zip}
                onChange={(e) => setForm({ ...form, zip: e.target.value })}
                placeholder="10115"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Stadt</label>
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Berlin"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#8b9ab5" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#8b9ab5"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #00c6ff, #0099cc)", color: "#0d1b2e" }}
            >
              {saving ? "Wird gespeichert..." : editKunde ? "Aktualisieren" : "Anlegen"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!confirmKunde}
        title="Kunde löschen?"
        message={`Kunde „${confirmKunde?.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        confirmLabel="Löschen"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setConfirmKunde(null)}
      />
    </DashboardLayout>
  );
}
