"use client";

import { useState, useEffect } from "react";
import { authFetch } from "@/lib/authFetch";
import DashboardLayout from "@/components/layout/DashboardLayout";
import EmptyState from "@/components/ui/EmptyState";
import { TrendingUp, TrendingDown, Wallet, Plus, Loader, Receipt } from "lucide-react";
import Modal from "@/components/ui/Modal";

interface Transaction {
  _id: string;
  type: "income" | "expense";
  amount: number;
  date: string;
  description: string;
  invoiceNumber?: string;
  customerName?: string;
  relatedInvoiceId?: string;
  createdAt: string;
}

const fEur = (v: number) =>
  v.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

export default function FinancePage() {
  const [tab, setTab] = useState<"alle" | "income" | "expense">("alle");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: "expense" as "income" | "expense", amount: "", date: new Date().toISOString().split("T")[0], description: "" });

  useEffect(() => { fetchTransactions(); }, [tab, year]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ year: String(year) });
      if (tab !== "alle") params.set("type", tab);
      const res = await authFetch(`/api/transactions?${params}`);
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const totalIncome  = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance      = totalIncome - totalExpense;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.date) return;
    setSaving(true);
    try {
      await authFetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      });
      await fetchTransactions();
      setModalOpen(false);
      setForm({ type: "expense", amount: "", date: new Date().toISOString().split("T")[0], description: "" });
    } catch { /* */ }
    finally { setSaving(false); }
  };

  const displayed = tab === "alle" ? transactions : transactions.filter((t) => t.type === tab);

  const inputSty = { background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" };

  return (
    <DashboardLayout title="Finanzen" subtitle={`Buchhaltung ${year}`}>
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Einnahmen", value: totalIncome, icon: <TrendingUp size={18} />, color: "#22c55e" },
          { label: "Ausgaben",  value: totalExpense, icon: <TrendingDown size={18} />, color: "#ef4444" },
          { label: "Saldo",     value: balance,      icon: <Wallet size={18} />,      color: balance >= 0 ? "#00c6ff" : "#ef4444" },
        ].map((card) => (
          <div key={card.label} className="rounded-xl p-5" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
            <div className="flex items-center gap-2 mb-2">
              <span style={{ color: card.color }}>{card.icon}</span>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8b9ab5" }}>{card.label}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: card.color, fontFamily: "var(--font-syne)" }}>
              {fEur(card.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
          {(["alle", "income", "expense"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: tab === t ? (t === "income" ? "#22c55e22" : t === "expense" ? "#ef444422" : "#00c6ff22") : "transparent",
                color: tab === t ? (t === "income" ? "#22c55e" : t === "expense" ? "#ef4444" : "#00c6ff") : "#8b9ab5",
              }}>
              {t === "alle" ? "Alle" : t === "income" ? "Einnahmen" : "Ausgaben"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 rounded-xl text-sm outline-none"
            style={inputSty}>
            {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "linear-gradient(135deg, #00c6ff, #0099cc)", color: "#0d1b2e" }}>
            <Plus size={15} /> Eintrag
          </button>
        </div>
      </div>

      {/* Transaction list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader size={24} className="animate-spin" style={{ color: "#00c6ff" }} />
        </div>
      ) : displayed.length === 0 ? (
        <EmptyState
          icon={<Wallet size={32} />}
          title="Keine Einträge"
          description="Transaktionen werden automatisch erstellt, wenn Rechnungen als bezahlt markiert werden."
        />
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1e3a5f" }}>
          {/* Header */}
          <div className="hidden md:grid grid-cols-12 px-4 py-3 text-xs font-semibold uppercase tracking-wider"
            style={{ background: "#112240", color: "#8b9ab5", borderBottom: "1px solid #1e3a5f",
              gridTemplateColumns: "100px 1fr 140px 100px 100px" }}>
            <span>Datum</span>
            <span>Beschreibung</span>
            <span>Kunde</span>
            <span>Re.-Nr.</span>
            <span className="text-right">Betrag</span>
          </div>

          {displayed.map((t, i) => {
            const isLast = i === displayed.length - 1;
            const isIncome = t.type === "income";
            const rowBg = i % 2 === 0 ? "#0d1b2e" : "#112240";
            return (
              <div key={t._id}
                className="grid items-center px-4 py-3"
                style={{
                  gridTemplateColumns: "100px 1fr 140px 100px 100px",
                  background: rowBg,
                  borderBottom: isLast ? "none" : "1px solid #1e3a5f44",
                }}>
                <span className="text-xs" style={{ color: "#8b9ab5" }}>
                  {new Date(t.date).toLocaleDateString("de-DE")}
                </span>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex items-center justify-center w-6 h-6 rounded-md shrink-0"
                    style={{ background: isIncome ? "#22c55e18" : "#ef444418" }}>
                    {isIncome
                      ? <TrendingUp size={12} style={{ color: "#22c55e" }} />
                      : <TrendingDown size={12} style={{ color: "#ef4444" }} />}
                  </div>
                  <span className="text-sm truncate" style={{ color: "#e6edf3" }}>{t.description || "–"}</span>
                </div>
                <span className="text-xs truncate hidden md:block" style={{ color: "#8b9ab5" }}>{t.customerName || "–"}</span>
                <span className="text-xs font-mono hidden md:block" style={{ color: t.invoiceNumber ? "#00c6ff" : "#4a5568" }}>
                  {t.invoiceNumber || "–"}
                </span>
                <span className="text-sm font-bold text-right" style={{ color: isIncome ? "#22c55e" : "#ef4444" }}>
                  {isIncome ? "+" : "−"}{fEur(t.amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Manueller Eintrag Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Neuer Eintrag" maxWidth="480px">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Typ</label>
            <div className="flex gap-2">
              {(["income", "expense"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: form.type === t ? (t === "income" ? "#22c55e22" : "#ef444422") : "#0d1b2e",
                    color: form.type === t ? (t === "income" ? "#22c55e" : "#ef4444") : "#8b9ab5",
                    border: `1px solid ${form.type === t ? (t === "income" ? "#22c55e44" : "#ef444444") : "#1e3a5f"}`,
                  }}>
                  {t === "income" ? "Einnahme" : "Ausgabe"}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Betrag (€) *</label>
              <input type="number" min="0" step="0.01" required value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0,00" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputSty}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Datum *</label>
              <input type="date" required value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputSty}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Beschreibung</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="z. B. Material, Werkzeug, Fahrtkosten…"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputSty}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#8b9ab5" }}>
              Abbrechen
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #00c6ff, #0099cc)", color: "#0d1b2e" }}>
              {saving ? "Wird gespeichert…" : "Eintrag erstellen"}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
