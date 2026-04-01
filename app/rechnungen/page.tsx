"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { useRouter } from "next/navigation";
import { usePro } from "@/context/ProContext";
import {
  Receipt, Plus, Search, MoreVertical, Trash2, Edit, Loader, FileDown, Lock, Zap,
} from "lucide-react";

interface InvoiceItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface Invoice {
  _id?: string;
  number: string;
  customerName: string;
  customerAddress?: string;
  status: "offen" | "bezahlt" | "überfällig" | "storniert";
  total: number;
  createdAt?: string;
  dueDate: string;
  items: InvoiceItem[];
}

const statusConfig = {
  offen: { label: "Offen", color: "#00c6ff" },
  bezahlt: { label: "Bezahlt", color: "#22c55e" },
  überfällig: { label: "Überfällig", color: "#ef4444" },
  storniert: { label: "Storniert", color: "#8b9ab5" },
};

const EMPTY_ITEM: InvoiceItem = { description: "", quantity: 1, unit: "Stk.", unitPrice: 0, total: 0 };

export default function RechnungenPage() {
  const { isPro, loadingPro } = usePro();
  const router = useRouter();
  const [rechnungen, setRechnungen] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editRechnung, setEditRechnung] = useState<Invoice | null>(null);
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([{ ...EMPTY_ITEM }]);

  useEffect(() => { fetchRechnungen(); }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpen]);

  const fetchRechnungen = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rechnungen");
      const data = await res.json();
      setRechnungen(Array.isArray(data) ? data : []);
    } catch {
      setRechnungen([]);
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setEditRechnung(null);
    setCustomerName("");
    setCustomerAddress("");
    const due = new Date();
    due.setDate(due.getDate() + 14);
    setDueDate(due.toISOString().split("T")[0]);
    setItems([{ ...EMPTY_ITEM }]);
    setModalOpen(true);
  };

  const openEdit = (r: Invoice) => {
    setEditRechnung(r);
    setCustomerName(r.customerName);
    setCustomerAddress(r.customerAddress || "");
    setDueDate(r.dueDate || "");
    setItems(r.items?.length ? r.items : [{ ...EMPTY_ITEM }]);
    setModalOpen(true);
  };

  const updateItem = (idx: number, field: keyof InvoiceItem, value: string | number) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      if (field === "quantity" || field === "unitPrice") {
        updated[idx].total = updated[idx].quantity * updated[idx].unitPrice;
      }
      return updated;
    });
  };

  const totalSum = items.reduce((s, i) => s + (i.total || 0), 0);

  const saveRechnung = async () => {
    if (!customerName.trim()) return;
    setSaving(true);
    try {
      const payload = {
        customerName: customerName.trim(),
        customerAddress: customerAddress.trim(),
        dueDate,
        items,
        total: totalSum,
        status: editRechnung?.status || "offen",
      };
      if (editRechnung?._id) {
        await fetch(`/api/rechnungen/${editRechnung._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/rechnungen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setModalOpen(false);
      fetchRechnungen();
    } finally {
      setSaving(false);
    }
  };

  const deleteRechnung = async (id: string) => {
    if (!confirm("Rechnung wirklich löschen?")) return;
    await fetch(`/api/rechnungen/${id}`, { method: "DELETE" });
    fetchRechnungen();
  };

  const updateStatus = async (id: string, status: Invoice["status"]) => {
    await fetch(`/api/rechnungen/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchRechnungen();
  };

  const downloadPdf = async (id: string) => {
    const res = await fetch(`/api/rechnungen/${id}/pdf`);
    if (!res.ok) return alert("PDF-Fehler");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Rechnung.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = rechnungen.filter((r) =>
    r.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    r.number?.toLowerCase().includes(search.toLowerCase())
  );

  if (loadingPro) {
    return (
      <DashboardLayout title="Rechnungen" subtitle="Pro-Feature">
        <div className="flex items-center justify-center py-24">
          <Loader size={24} className="animate-spin" style={{ color: "#00c6ff" }} />
        </div>
      </DashboardLayout>
    );
  }

  if (!isPro) {
    return (
      <DashboardLayout title="Rechnungen" subtitle="Pro-Feature">
        <div className="flex flex-col items-center justify-center py-24 gap-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-full" style={{ background: "#f5a62322", border: "1px solid #f5a62366" }}>
            <Lock size={28} style={{ color: "#f5a623" }} />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
              Rechnungen — Pro-Feature
            </h2>
            <p className="text-sm" style={{ color: "#8b9ab5" }}>
              Erstelle professionelle Rechnungen mit PDF-Export. Nur im Pro-Plan verfügbar.
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
    <DashboardLayout title="Rechnungen" subtitle={`${rechnungen.length} Rechnungen`}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2 rounded-xl" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
          <Search size={15} style={{ color: "#8b9ab5", flexShrink: 0 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suchen…"
            className="bg-transparent outline-none text-sm w-full"
            style={{ color: "#e6edf3" }}
          />
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #00c6ff, #0099cc)", color: "#0d1b2e" }}
        >
          <Plus size={15} /> Neue Rechnung
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader size={24} className="animate-spin" style={{ color: "#00c6ff" }} /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Receipt size={32} style={{ color: "#8b9ab5" }} />}
          title="Noch keine Rechnungen"
          description="Erstelle deine erste Rechnung mit dem Button oben."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const cfg = statusConfig[r.status] || statusConfig.offen;
            return (
              <div key={String(r._id)} className="flex items-center gap-4 px-5 py-4 rounded-xl" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
                <div className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0" style={{ background: "#00c6ff18", border: "1px solid #00c6ff33" }}>
                  <Receipt size={16} style={{ color: "#00c6ff" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "#e6edf3" }}>{r.customerName}</p>
                  <p className="text-xs" style={{ color: "#8b9ab5" }}>{r.number} · {r.createdAt ? new Date(r.createdAt).toLocaleDateString("de-DE") : ""}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold" style={{ color: "#00c6ff" }}>
                    {(r.total || 0).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                  </p>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.color}33` }}>
                    {cfg.label}
                  </span>
                </div>
                <div className="relative shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === String(r._id) ? null : String(r._id)); }}
                    className="p-1.5 rounded-lg transition-all"
                    style={{ color: "#8b9ab5" }}
                  >
                    <MoreVertical size={16} />
                  </button>
                  {menuOpen === String(r._id) && (
                    <div className="absolute right-0 top-8 z-50 rounded-xl py-1 min-w-44 shadow-xl" style={{ background: "#0d1b2e", border: "1px solid #1e3a5f" }}>
                      <button onClick={() => { openEdit(r); setMenuOpen(null); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-white/5" style={{ color: "#e6edf3" }}>
                        <Edit size={13} /> Bearbeiten
                      </button>
                      <button onClick={() => { downloadPdf(String(r._id)); setMenuOpen(null); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-white/5" style={{ color: "#00c6ff" }}>
                        <FileDown size={13} /> PDF herunterladen
                      </button>
                      {r.status === "offen" && (
                        <button onClick={() => { updateStatus(String(r._id), "bezahlt"); setMenuOpen(null); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-white/5" style={{ color: "#22c55e" }}>
                          Als bezahlt markieren
                        </button>
                      )}
                      <button onClick={() => { deleteRechnung(String(r._id)); setMenuOpen(null); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-white/5" style={{ color: "#ef4444" }}>
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
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editRechnung ? "Rechnung bearbeiten" : "Neue Rechnung"}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#8b9ab5" }}>Kundenname *</label>
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }} placeholder="Max Mustermann" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#8b9ab5" }}>Adresse</label>
            <input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }} placeholder="Musterstr. 1, 12345 Berlin" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#8b9ab5" }}>Fällig bis</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }} />
          </div>

          {/* Positionen */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium" style={{ color: "#8b9ab5" }}>Positionen</label>
              <button onClick={() => setItems((p) => [...p, { ...EMPTY_ITEM }])} className="text-xs px-2 py-1 rounded-lg" style={{ background: "#00c6ff18", color: "#00c6ff", border: "1px solid #00c6ff33" }}>
                + Position
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-1.5">
                  <input value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)} placeholder="Beschreibung" className="col-span-4 px-2 py-1.5 rounded-lg text-xs outline-none" style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }} />
                  <input type="number" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)} className="col-span-2 px-2 py-1.5 rounded-lg text-xs outline-none text-center" style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }} />
                  <input value={item.unit} onChange={(e) => updateItem(idx, "unit", e.target.value)} placeholder="Stk." className="col-span-2 px-2 py-1.5 rounded-lg text-xs outline-none" style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }} />
                  <input type="number" value={item.unitPrice} onChange={(e) => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)} placeholder="€" className="col-span-2 px-2 py-1.5 rounded-lg text-xs outline-none" style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }} />
                  <button onClick={() => setItems((p) => p.filter((_, i) => i !== idx))} className="col-span-2 text-xs rounded-lg" style={{ color: "#ef4444", border: "1px solid #ef444433", background: "#ef444411" }}>✕</button>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-2">
              <span className="text-sm font-bold" style={{ color: "#00c6ff" }}>
                Gesamt: {totalSum.toLocaleString("de-DE", { minimumFractionDigits: 2 })} € (brutto)
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 py-2 rounded-xl text-sm font-medium" style={{ background: "#112240", color: "#8b9ab5", border: "1px solid #1e3a5f" }}>
              Abbrechen
            </button>
            <button onClick={saveRechnung} disabled={saving || !customerName.trim()} className="flex-1 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50" style={{ background: "linear-gradient(135deg, #00c6ff, #0099cc)", color: "#0d1b2e" }}>
              {saving ? "Speichern…" : editRechnung ? "Aktualisieren" : "Erstellen"}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
