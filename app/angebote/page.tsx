"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import {
  FileText,
  Plus,
  Search,
  MoreVertical,
  AlertCircle,
  Trash2,
  Edit,
  Loader,
  Send,
} from "lucide-react";

interface OfferItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface Offer {
  _id?: string;
  number: string;
  customerName: string;
  status: "draft" | "sent" | "accepted" | "rejected";
  total: number;
  createdAt?: string;
  validUntil: string;
  items: OfferItem[];
}

const FREE_LIMIT = 3;

const statusConfig = {
  draft: { label: "Entwurf", color: "#8b9ab5" },
  sent: { label: "Versendet", color: "#00c6ff" },
  accepted: { label: "Angenommen", color: "#22c55e" },
  rejected: { label: "Abgelehnt", color: "#ef4444" },
};

const EMPTY_ITEM: OfferItem = { description: "", quantity: 1, unit: "Stk.", unitPrice: 0, total: 0 };

export default function AngebotePage() {
  const [angebote, setAngebote] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [items, setItems] = useState<OfferItem[]>([{ ...EMPTY_ITEM }]);

  useEffect(() => { fetchAngebote(); }, []);

  const fetchAngebote = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/angebote");
      const data = await res.json();
      setAngebote(data);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setCustomerName("");
    setValidUntil("");
    setItems([{ ...EMPTY_ITEM }]);
    setModalOpen(true);
  };

  const updateItem = (i: number, field: keyof OfferItem, value: string | number) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: value };
    updated[i].total = updated[i].quantity * updated[i].unitPrice;
    setItems(updated);
  };

  const total = items.reduce((sum, it) => sum + it.total, 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/angebote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName, validUntil, items, total }),
      });
      await fetchAngebote();
      setModalOpen(false);
    } catch {
      //
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (a: Offer) => {
    if (!confirm(`Angebot #${a.number} wirklich löschen?`)) return;
    await fetch(`/api/angebote/${a._id}`, { method: "DELETE" });
    await fetchAngebote();
    setMenuOpen(null);
  };

  const filtered = angebote.filter(
    (a) =>
      a.number?.toLowerCase().includes(search.toLowerCase()) ||
      a.customerName?.toLowerCase().includes(search.toLowerCase())
  );
  const atLimit = angebote.length >= FREE_LIMIT;

  return (
    <DashboardLayout title="Angebote" subtitle={`${angebote.length} von ${FREE_LIMIT} Angeboten (Free)`}>
      <div className="flex items-center justify-between mb-6">
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-1 max-w-xs"
          style={{ background: "#112240", border: "1px solid #1e3a5f", color: "#8b9ab5" }}
        >
          <Search size={15} />
          <input
            type="text"
            placeholder="Angebot suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "#e6edf3" }}
          />
        </div>

        <button
          onClick={openNew}
          disabled={atLimit}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ml-3 disabled:cursor-not-allowed"
          style={{
            background: atLimit ? "#1e3a5f" : "linear-gradient(135deg, #00c6ff, #0099cc)",
            color: atLimit ? "#4a5568" : "#0d1b2e",
          }}
        >
          <Plus size={16} />
          Neues Angebot
        </button>
      </div>

      {atLimit && (
        <div
          className="flex items-start gap-3 p-4 rounded-xl mb-4"
          style={{ background: "#f5a62310", border: "1px solid #f5a62333" }}
        >
          <AlertCircle size={16} style={{ color: "#f5a623", marginTop: 1 }} />
          <p className="text-sm" style={{ color: "#e6edf3" }}>
            <span style={{ color: "#f5a623", fontWeight: 600 }}>Free-Limit erreicht.</span>{" "}
            Max. 3 Angebote. Upgrade für unbegrenzte Angebote + Rechnungen.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader size={24} className="animate-spin" style={{ color: "#00c6ff" }} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileText size={32} />}
          title="Noch keine Angebote"
          description="Erstellen Sie Ihr erstes Angebot."
          action={
            !atLimit ? (
              <button
                onClick={openNew}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: "linear-gradient(135deg, #00c6ff, #0099cc)", color: "#0d1b2e" }}
              >
                <Plus size={15} />
                Erstes Angebot erstellen
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1e3a5f" }}>
          <div
            className="grid grid-cols-12 px-4 py-3 text-xs font-semibold uppercase tracking-wider"
            style={{ background: "#112240", color: "#8b9ab5", borderBottom: "1px solid #1e3a5f" }}
          >
            <div className="col-span-2">Nr.</div>
            <div className="col-span-3">Kunde</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Betrag</div>
            <div className="col-span-2">Gültig bis</div>
            <div className="col-span-1" />
          </div>

          {filtered.map((angebot, i) => {
            const id = angebot._id || String(i);
            const sc = statusConfig[angebot.status] || statusConfig.draft;
            return (
              <div
                key={id}
                className="grid grid-cols-12 px-4 py-4 items-center transition-all"
                style={{
                  background: i % 2 === 0 ? "#0d1b2e" : "#112240",
                  borderBottom: i < filtered.length - 1 ? "1px solid #1e3a5f44" : "none",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#00c6ff08"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 0 ? "#0d1b2e" : "#112240"; }}
              >
                <div className="col-span-2">
                  <p className="text-sm font-mono font-medium" style={{ color: "#00c6ff" }}>
                    #{angebot.number}
                  </p>
                </div>
                <div className="col-span-3">
                  <p className="text-sm font-medium" style={{ color: "#e6edf3" }}>{angebot.customerName}</p>
                </div>
                <div className="col-span-2">
                  <span
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ background: `${sc.color}22`, color: sc.color, border: `1px solid ${sc.color}44` }}
                  >
                    {sc.label}
                  </span>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-semibold" style={{ color: "#e6edf3" }}>
                    {(angebot.total || 0).toLocaleString("de-DE")} €
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs" style={{ color: "#8b9ab5" }}>
                    {angebot.validUntil ? new Date(angebot.validUntil).toLocaleDateString("de-DE") : "—"}
                  </p>
                </div>
                <div className="col-span-1 flex justify-end relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === id ? null : id)}
                    className="p-1.5 rounded-lg transition-all"
                    style={{ color: "#8b9ab5" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#1e3a5f"; e.currentTarget.style.color = "#e6edf3"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#8b9ab5"; }}
                  >
                    <MoreVertical size={15} />
                  </button>
                  {menuOpen === id && (
                    <div
                      className="absolute right-0 top-8 rounded-xl py-1 z-20 min-w-36"
                      style={{ background: "#1a2f50", border: "1px solid #1e3a5f", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}
                    >
                      <button
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm transition-all"
                        style={{ color: "#e6edf3" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#1e3a5f"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <Send size={13} /> Versenden
                      </button>
                      <button
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm transition-all"
                        style={{ color: "#e6edf3" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#1e3a5f"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <Edit size={13} /> Bearbeiten
                      </button>
                      <button
                        onClick={() => handleDelete(angebot)}
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
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Neues Angebot erstellen" maxWidth="600px">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Kundenname *</label>
              <input
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Musterbetrieb GmbH"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Gültig bis</label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
              />
            </div>
          </div>

          {/* Positionen */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium" style={{ color: "#8b9ab5" }}>Positionen</label>
              <button
                type="button"
                onClick={() => setItems([...items, { ...EMPTY_ITEM }])}
                className="text-xs px-2 py-1 rounded-lg transition-all"
                style={{ background: "#00c6ff18", color: "#00c6ff", border: "1px solid #00c6ff33" }}
              >
                + Position
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    value={item.description}
                    onChange={(e) => updateItem(i, "description", e.target.value)}
                    placeholder="Beschreibung"
                    className="col-span-5 px-3 py-2 rounded-lg text-xs outline-none"
                    style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }}
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                    className="col-span-2 px-3 py-2 rounded-lg text-xs outline-none"
                    style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }}
                  />
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(i, "unitPrice", Number(e.target.value))}
                    placeholder="€/Stk."
                    className="col-span-3 px-3 py-2 rounded-lg text-xs outline-none"
                    style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }}
                  />
                  <p className="col-span-2 text-xs text-right font-semibold" style={{ color: "#00c6ff" }}>
                    {item.total.toFixed(2)} €
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ background: "#0d1b2e", border: "1px solid #00c6ff33" }}
          >
            <span className="text-sm font-semibold" style={{ color: "#8b9ab5" }}>Gesamtbetrag</span>
            <span className="text-lg font-bold" style={{ color: "#00c6ff", fontFamily: "var(--font-syne)" }}>
              {total.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
            </span>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#8b9ab5" }}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #00c6ff, #0099cc)", color: "#0d1b2e" }}
            >
              {saving ? "Wird erstellt..." : "Angebot erstellen"}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
