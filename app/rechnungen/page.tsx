"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { useRouter } from "next/navigation";
import { usePro } from "@/context/ProContext";
import { Receipt, Plus, Search, MoreVertical, Trash2, Edit, Loader, FileDown, Lock, Zap, ChevronDown, X, CornerDownLeft, ChevronRight } from "lucide-react";

type Abrechnungsart = "festpreis" | "regie";

interface InvoiceItem {
  beschreibung: string;
  menge: number;
  einheit: string;
  einzelpreis: number;
  gesamt: number;
  typ: "material" | "lohn" | "sonstiges";
  mitarbeiter?: number;
}

interface Projekt { _id: string; title: string; customerName: string; }

interface Invoice {
  _id?: string;
  number: string;
  projektId?: string;
  projektName?: string;
  customerName: string;
  customerAddress?: string;
  abrechnungsart: Abrechnungsart;
  betreff?: string;
  status: "offen" | "bezahlt" | "überfällig" | "storniert";
  total: number;
  createdAt?: string;
  dueDate?: string;
  zahlungsziel?: string;
  steuernummer?: string;
  iban?: string;
  bic?: string;
  bank?: string;
  firmenname?: string;
  firmenStrasse?: string;
  firmenOrt?: string;
  items: InvoiceItem[];
}

const statusConfig = {
  offen: { label: "Offen", color: "#00c6ff" },
  bezahlt: { label: "Bezahlt", color: "#22c55e" },
  überfällig: { label: "Überfällig", color: "#ef4444" },
  storniert: { label: "Storniert", color: "#8b9ab5" },
};

const EINHEITEN_MATERIAL = ["Stk.", "m", "m²", "Pkg.", "Set", "l", "kg"];
const EINHEITEN_LOHN = ["Std.", "AW"];
const EINHEITEN_SONST = ["Pausch.", "km", "Std."];

const EMPTY_ITEM: InvoiceItem = { beschreibung: "", menge: 1, einheit: "Stk.", einzelpreis: 0, gesamt: 0, typ: "material", mitarbeiter: 1 };

const DEFAULT_EXAMPLES: InvoiceItem[] = [
  { beschreibung: "Montagearbeiten Elektroinstallation", menge: 8, einheit: "Std.", einzelpreis: 65, gesamt: 520, typ: "lohn", mitarbeiter: 1 },
  { beschreibung: "NYM-J 3x1,5mm² Kabel", menge: 120, einheit: "m", einzelpreis: 1.80, gesamt: 216, typ: "material" },
  { beschreibung: "Schuko-Steckdosen", menge: 15, einheit: "Stk.", einzelpreis: 8, gesamt: 120, typ: "material" },
  { beschreibung: "Anfahrtspauschale", menge: 1, einheit: "Pausch.", einzelpreis: 35, gesamt: 35, typ: "sonstiges" },
];

const inputSty = { background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" } as const;

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
  const [tab, setTab] = useState<"positionen" | "footer">("positionen");
  const [projekte, setProjekte] = useState<Projekt[]>([]);
  const [projektId, setProjektId] = useState("");
  const [projektName, setProjektName] = useState("");

  // Form fields
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [abrechnungsart, setAbrechnungsart] = useState<Abrechnungsart>("festpreis");
  const [betreff, setBetreff] = useState("");
  const [zahlungsziel, setZahlungsziel] = useState("14 Tage netto");
  const [steuernummer, setSteuernummer] = useState("");
  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");
  const [bank, setBank] = useState("");
  const [firmenname, setFirmenname] = useState("ElektroGenius");
  const [firmenStrasse, setFirmenStrasse] = useState("");
  const [firmenOrt, setFirmenOrt] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([{ ...EMPTY_ITEM }]);

  useEffect(() => { fetchRechnungen(); fetchProjekte(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProjekte = async () => {
    try {
      const res = await fetch("/api/projekte");
      const data = await res.json();
      setProjekte(Array.isArray(data) ? data : []);
    } catch { /* */ }
  };

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
    } catch { setRechnungen([]); }
    finally { setLoading(false); }
  };

  const openNew = () => {
    setEditRechnung(null);
    setProjektId(""); setProjektName("");
    setCustomerName(""); setCustomerAddress(""); setAbrechnungsart("festpreis");
    setBetreff(""); setZahlungsziel("14 Tage netto");
    setSteuernummer(""); setIban(""); setBic(""); setBank("");
    setFirmenname("ElektroGenius"); setFirmenStrasse(""); setFirmenOrt("");
    setItems(DEFAULT_EXAMPLES.map((i) => ({ ...i })));
    setTab("positionen");
    setModalOpen(true);
  };

  const openEdit = (r: Invoice) => {
    setEditRechnung(r);
    setProjektId(r.projektId || ""); setProjektName(r.projektName || "");
    setCustomerName(r.customerName); setCustomerAddress(r.customerAddress || "");
    setAbrechnungsart(r.abrechnungsart || "festpreis");
    setBetreff(r.betreff || ""); setZahlungsziel(r.zahlungsziel || "14 Tage netto");
    setSteuernummer(r.steuernummer || ""); setIban(r.iban || ""); setBic(r.bic || ""); setBank(r.bank || "");
    setFirmenname(r.firmenname || "ElektroGenius"); setFirmenStrasse(r.firmenStrasse || ""); setFirmenOrt(r.firmenOrt || "");
    setItems(r.items?.length ? r.items.map((i) => ({ ...i, mitarbeiter: i.mitarbeiter ?? 1, gesamt: i.gesamt ?? (i.menge * i.einzelpreis * (i.mitarbeiter ?? 1)) })) : [{ ...EMPTY_ITEM }]);
    setTab("positionen");
    setModalOpen(true);
  };

  const updateItem = (idx: number, field: keyof InvoiceItem, value: string | number) => {
    setItems((prev) => {
      const upd = [...prev];
      upd[idx] = { ...upd[idx], [field]: value };
      if (field === "menge" || field === "einzelpreis" || field === "mitarbeiter") {
        const ma = upd[idx].typ === "lohn" ? (upd[idx].mitarbeiter ?? 1) : 1;
        upd[idx].gesamt = upd[idx].menge * upd[idx].einzelpreis * ma;
      }
      // Auto-Einheit je nach Typ
      if (field === "typ") {
        if (value === "lohn" && !EINHEITEN_LOHN.includes(upd[idx].einheit)) upd[idx].einheit = "Std.";
        if (value === "material" && !EINHEITEN_MATERIAL.includes(upd[idx].einheit)) upd[idx].einheit = "Stk.";
        if (value === "sonstiges" && !EINHEITEN_SONST.includes(upd[idx].einheit)) upd[idx].einheit = "Pausch.";
        // Gesamt neu berechnen wenn Typ wechselt
        const ma = value === "lohn" ? (upd[idx].mitarbeiter ?? 1) : 1;
        upd[idx].gesamt = upd[idx].menge * upd[idx].einzelpreis * ma;
      }
      return upd;
    });
  };

  const autoDescLohn = (idx: number) => {
    setItems((prev) => {
      const upd = [...prev];
      const item = upd[idx];
      const ma = item.mitarbeiter ?? 1;
      upd[idx] = { ...item, beschreibung: `${ma} Mitarbeiter à ${item.menge} ${item.einheit}` };
      return upd;
    });
  };

  const totalSum = items.reduce((s, i) => s + (i.gesamt || 0), 0);

  const saveRechnung = async () => {
    if (!customerName.trim()) return;
    setSaving(true);
    try {
      const payload: Partial<Invoice> = {
        projektId: projektId || undefined, projektName: projektName || undefined,
        customerName: customerName.trim(), customerAddress: customerAddress.trim(),
        abrechnungsart, betreff, zahlungsziel, steuernummer, iban, bic, bank,
        firmenname, firmenStrasse, firmenOrt,
        items, total: totalSum,
        status: editRechnung?.status || "offen",
      };
      const url = editRechnung?._id
        ? `/api/rechnungen/${editRechnung._id}`
        : "/api/rechnungen";
      const res = await fetch(url, {
        method: editRechnung?._id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Speichern fehlgeschlagen. Bitte erneut versuchen.");
        return;
      }
      setModalOpen(false);
      await fetchRechnungen();
    } catch {
      alert("Verbindungsfehler. Bitte Internetverbindung prüfen.");
    } finally { setSaving(false); }
  };

  const deleteRechnung = async (id: string) => {
    if (!confirm("Rechnung wirklich löschen?")) return;
    await fetch(`/api/rechnungen/${id}`, { method: "DELETE" });
    fetchRechnungen();
  };

  const updateStatus = async (id: string, status: Invoice["status"]) => {
    await fetch(`/api/rechnungen/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    fetchRechnungen();
  };

  const downloadPdf = async (id: string, number: string) => {
    const res = await fetch(`/api/rechnungen/${id}/pdf`);
    if (!res.ok) return alert("PDF-Fehler");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `Rechnung-${number}.pdf`; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadRapport = async (id: string, number: string) => {
    const res = await fetch(`/api/rechnungen/${id}/rapport`);
    if (!res.ok) return alert("Rapport-Fehler");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `Rapport-${number}.pdf`; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = rechnungen.filter((r) =>
    r.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    r.number?.toLowerCase().includes(search.toLowerCase())
  );

  const getEinheiten = (typ: string) => {
    if (typ === "lohn") return EINHEITEN_LOHN;
    if (typ === "sonstiges") return EINHEITEN_SONST;
    return EINHEITEN_MATERIAL;
  };

  if (loadingPro) return (
    <DashboardLayout title="Rechnungen" subtitle="Pro-Feature">
      <div className="flex justify-center py-24"><Loader size={24} className="animate-spin" style={{ color: "#00c6ff" }} /></div>
    </DashboardLayout>
  );

  if (!isPro) return (
    <DashboardLayout title="Rechnungen" subtitle="Pro-Feature">
      <div className="flex flex-col items-center justify-center py-24 gap-6">
        <div className="flex items-center justify-center w-16 h-16 rounded-full" style={{ background: "#f5a62322", border: "1px solid #f5a62366" }}>
          <Lock size={28} style={{ color: "#f5a623" }} />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>Rechnungen — Pro-Feature</h2>
          <p className="text-sm" style={{ color: "#8b9ab5" }}>Erstelle professionelle Rechnungen mit PDF-Export. Nur im Pro-Plan.</p>
        </div>
        <button onClick={() => router.push("/upgrade")} className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg,#f5a623,#c4841c)", color: "#0d1b2e" }}>
          <Zap size={16} /> Auf Pro upgraden — 9,99€/Monat
        </button>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout title="Rechnungen" subtitle={`${rechnungen.length} Rechnungen`}>
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2 rounded-xl" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
          <Search size={15} style={{ color: "#8b9ab5", flexShrink: 0 }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Suchen…" className="bg-transparent outline-none text-sm w-full" style={{ color: "#e6edf3" }} />
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg,#00c6ff,#0099cc)", color: "#0d1b2e" }}>
          <Plus size={15} /> Neue Rechnung
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader size={24} className="animate-spin" style={{ color: "#00c6ff" }} /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Receipt size={32} style={{ color: "#8b9ab5" }} />} title="Noch keine Rechnungen" description="Erstelle deine erste Rechnung." />
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
                  <p className="text-xs" style={{ color: "#8b9ab5" }}>
                    {r.number} · {r.createdAt ? new Date(r.createdAt).toLocaleDateString("de-DE") : ""} · {r.abrechnungsart === "regie" ? "Nach Aufwand" : "Festpreis"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold" style={{ color: "#00c6ff" }}>{(r.total || 0).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</p>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.color}33` }}>{cfg.label}</span>
                </div>
                <div className="relative shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === String(r._id) ? null : String(r._id)); }} className="p-1.5 rounded-lg" style={{ color: "#8b9ab5" }}>
                    <MoreVertical size={16} />
                  </button>
                  {menuOpen === String(r._id) && (
                    <div className="absolute right-0 top-8 z-50 rounded-xl py-1 min-w-48 shadow-xl" style={{ background: "#0d1b2e", border: "1px solid #1e3a5f" }}>
                      <button onClick={() => { openEdit(r); setMenuOpen(null); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-white/5" style={{ color: "#e6edf3" }}><Edit size={13} /> Bearbeiten</button>
                      <button onClick={() => { downloadPdf(String(r._id), r.number); setMenuOpen(null); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-white/5" style={{ color: "#00c6ff" }}><FileDown size={13} /> Rechnung PDF</button>
                      <button onClick={() => { downloadRapport(String(r._id), r.number); setMenuOpen(null); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-white/5" style={{ color: "#22c55e" }}><FileDown size={13} /> Leistungsnachweis PDF</button>
                      {r.status === "offen" && <button onClick={() => { updateStatus(String(r._id), "bezahlt"); setMenuOpen(null); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-white/5" style={{ color: "#22c55e" }}>Als bezahlt markieren</button>}
                      <button onClick={() => { deleteRechnung(String(r._id)); setMenuOpen(null); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-white/5" style={{ color: "#ef4444" }}><Trash2 size={13} /> Löschen</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal ──────────────────────────────────────────────────────────── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editRechnung ? "Rechnung bearbeiten" : "Neue Rechnung"} maxWidth="680px">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-5">
          {(["positionen", "footer"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize" style={{ background: tab === t ? "#00c6ff18" : "transparent", border: `1px solid ${tab === t ? "#00c6ff44" : "#1e3a5f"}`, color: tab === t ? "#00c6ff" : "#8b9ab5" }}>
              {t === "positionen" ? "Positionen & Kunde" : "Footer & Firmendaten"}
            </button>
          ))}
        </div>

        {tab === "positionen" && (
          <div className="space-y-4">
            {/* Projekt-Auswahl */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#8b9ab5" }}>Projekt (optional)</label>
              <select
                value={projektId}
                onChange={(e) => {
                  const found = projekte.find((p) => p._id === e.target.value);
                  setProjektId(e.target.value);
                  setProjektName(found?.title || "");
                  if (found && !customerName) setCustomerName(found.customerName || "");
                  else if (found) setCustomerName(found.customerName || customerName);
                }}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={inputSty}
              >
                <option value="">— Kein Projekt —</option>
                {projekte.map((p) => (
                  <option key={p._id} value={p._id}>{p.title}{p.customerName ? ` · ${p.customerName}` : ""}</option>
                ))}
              </select>
            </div>

            {/* Kundendaten */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1" style={{ color: "#8b9ab5" }}>Kundenname *</label>
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Max Mustermann" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputSty} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1" style={{ color: "#8b9ab5" }}>Adresse</label>
                <input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Musterstr. 1, 12345 Berlin" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputSty} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#8b9ab5" }}>Abrechnungsart</label>
                <div className="relative">
                  <select value={abrechnungsart} onChange={(e) => setAbrechnungsart(e.target.value as Abrechnungsart)} className="w-full px-3 py-2 rounded-lg text-sm outline-none appearance-none pr-8" style={inputSty}>
                    <option value="festpreis">Festpreis (Pauschal)</option>
                    <option value="regie">Nach Aufwand (Regie)</option>
                  </select>
                  <ChevronDown size={13} style={{ color: "#8b9ab5", position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#8b9ab5" }}>Betreff</label>
                <input value={betreff} onChange={(e) => setBetreff(e.target.value)} placeholder="z.B. Elektroinstallation EFH" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputSty} />
              </div>
            </div>

            {/* Positionen */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium" style={{ color: "#8b9ab5" }}>Positionen</label>
                <button onClick={() => setItems((p) => [...p, { ...EMPTY_ITEM }])} className="text-xs px-2 py-1 rounded-lg" style={{ background: "#00c6ff18", color: "#00c6ff", border: "1px solid #00c6ff33" }}>+ Position</button>
              </div>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="rounded-xl p-2.5 space-y-1.5" style={{ background: "#0d1b2e", border: "1px solid #1e3a5f" }}>
                    {/* Zeile 1: Beschreibung + Typ */}
                    <div className="flex gap-2">
                      <input value={item.beschreibung} onChange={(e) => updateItem(idx, "beschreibung", e.target.value)} placeholder="Beschreibung" className="flex-1 px-2 py-1.5 rounded-lg text-xs outline-none" style={inputSty} />
                      <select value={item.typ} onChange={(e) => updateItem(idx, "typ", e.target.value)} className="px-2 py-1.5 rounded-lg text-xs outline-none" style={inputSty}>
                        <option value="material">Material</option>
                        <option value="lohn">Lohn</option>
                        <option value="sonstiges">Sonstiges</option>
                      </select>
                    </div>
                    {/* Zeile 2 (Lohn): Mitarbeiter-Stepper + Auto-Beschreibung */}
                    {item.typ === "lohn" && (
                      <div className="flex gap-2 items-center">
                        <span className="text-xs" style={{ color: "#8b9ab5", whiteSpace: "nowrap" }}>Mitarbeiter:</span>
                        <div className="flex items-center rounded-lg overflow-hidden" style={{ border: "1px solid #1e3a5f" }}>
                          <button
                            type="button"
                            onClick={() => updateItem(idx, "mitarbeiter", Math.max(1, (item.mitarbeiter ?? 1) - 1))}
                            className="px-2 py-1 text-xs font-bold"
                            style={{ background: "#112240", color: "#8b9ab5" }}
                          >−</button>
                          <span className="px-3 py-1 text-xs font-bold text-center" style={{ background: "#0d1b2e", color: "#e6edf3", minWidth: 28 }}>
                            {item.mitarbeiter ?? 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateItem(idx, "mitarbeiter", Math.min(20, (item.mitarbeiter ?? 1) + 1))}
                            className="px-2 py-1 text-xs font-bold"
                            style={{ background: "#112240", color: "#8b9ab5" }}
                          >+</button>
                        </div>
                        <button
                          type="button"
                          onClick={() => autoDescLohn(idx)}
                          className="px-2 py-1 rounded-lg text-xs"
                          style={{ background: "#00c6ff18", color: "#00c6ff", border: "1px solid #00c6ff33" }}
                          title="Beschreibung automatisch ausfüllen"
                        ><CornerDownLeft size={12} className="inline mr-1" />Beschr.</button>
                      </div>
                    )}
                    {/* Zeile 3: Menge + Einheit + EP + Gesamt + Löschen */}
                    <div className="flex gap-2 items-center">
                      <input type="number" value={item.menge} onChange={(e) => updateItem(idx, "menge", parseFloat(e.target.value) || 0)} className="w-16 px-2 py-1.5 rounded-lg text-xs outline-none text-center" style={inputSty} />
                      <select value={item.einheit} onChange={(e) => updateItem(idx, "einheit", e.target.value)} className="px-2 py-1.5 rounded-lg text-xs outline-none" style={inputSty}>
                        {getEinheiten(item.typ).map((e) => <option key={e} value={e}>{e}</option>)}
                      </select>
                      <input type="number" value={item.einzelpreis} onChange={(e) => updateItem(idx, "einzelpreis", parseFloat(e.target.value) || 0)} placeholder="EP €" className="flex-1 px-2 py-1.5 rounded-lg text-xs outline-none" style={inputSty} />
                      {item.typ === "lohn" && (item.mitarbeiter ?? 1) > 1 && (
                        <span className="text-xs" style={{ color: "#8b9ab5", whiteSpace: "nowrap" }}>×{item.mitarbeiter}</span>
                      )}
                      <div className="text-xs font-bold px-2 py-1.5 rounded-lg whitespace-nowrap" style={{ background: "#112240", color: "#00c6ff", border: "1px solid #1e3a5f", minWidth: 56 }}>
                        {(item.gesamt ?? 0).toFixed(2)} €
                      </div>
                      <button onClick={() => setItems((p) => p.filter((_, i) => i !== idx))} className="flex items-center justify-center px-2 py-1.5 rounded-lg" style={{ color: "#ef4444", border: "1px solid #ef444433", background: "#ef444411" }}><X size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-3 gap-4">
                <span className="text-xs" style={{ color: "#8b9ab5" }}>Netto: {(totalSum / 1.19).toFixed(2)} € · MwSt. 19%: {(totalSum - totalSum / 1.19).toFixed(2)} €</span>
                <span className="text-sm font-bold" style={{ color: "#00c6ff" }}>Brutto: {totalSum.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</span>
              </div>
            </div>

            <button onClick={() => setTab("footer")} className="w-full py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5" style={{ background: "#112240", color: "#8b9ab5", border: "1px solid #1e3a5f" }}>
              Weiter: Footer &amp; Firmendaten <ChevronRight size={14} />
            </button>
          </div>
        )}

        {tab === "footer" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#8b9ab5" }}>Firmenname (auf PDF)</label>
                <input value={firmenname} onChange={(e) => setFirmenname(e.target.value)} placeholder="ElektroGenius GmbH" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputSty} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#8b9ab5" }}>Steuernummer</label>
                <input value={steuernummer} onChange={(e) => setSteuernummer(e.target.value)} placeholder="12/345/67890" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputSty} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#8b9ab5" }}>Straße</label>
                <input value={firmenStrasse} onChange={(e) => setFirmenStrasse(e.target.value)} placeholder="Musterstr. 1" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputSty} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#8b9ab5" }}>PLZ / Ort</label>
                <input value={firmenOrt} onChange={(e) => setFirmenOrt(e.target.value)} placeholder="12345 Berlin" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputSty} />
              </div>
            </div>
            <div className="p-3 rounded-xl" style={{ background: "#0d1b2e", border: "1px solid #1e3a5f" }}>
              <p className="text-xs font-medium mb-3" style={{ color: "#8b9ab5" }}>Bankverbindung</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs mb-1" style={{ color: "#8b9ab5" }}>IBAN</label>
                  <input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="DE89 3704 0044 0532 0130 00" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputSty} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: "#8b9ab5" }}>BIC</label>
                  <input value={bic} onChange={(e) => setBic(e.target.value)} placeholder="COBADEFFXXX" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputSty} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: "#8b9ab5" }}>Bank</label>
                  <input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Commerzbank" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputSty} />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#8b9ab5" }}>Zahlungsziel</label>
              <input value={zahlungsziel} onChange={(e) => setZahlungsziel(e.target.value)} placeholder="14 Tage netto" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputSty} />
            </div>
            <div className="p-3 rounded-xl" style={{ background: "#0d1b2e", border: "1px solid #1e3a5f" }}>
              <p className="text-xs" style={{ color: "#8b9ab5" }}>
                <span className="font-semibold" style={{ color: "#e6edf3" }}>§ 35a EStG</span> — Lohnpositionen werden automatisch summiert und als steuerlich absetzbarer Hinweis im PDF-Footer ausgewiesen.
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4 mt-2" style={{ borderTop: "1px solid #1e3a5f" }}>
          <button onClick={() => setModalOpen(false)} className="flex-1 py-2 rounded-xl text-sm font-medium" style={{ background: "#112240", color: "#8b9ab5", border: "1px solid #1e3a5f" }}>Abbrechen</button>
          <button onClick={saveRechnung} disabled={saving || !customerName.trim()} className="flex-1 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50" style={{ background: "linear-gradient(135deg,#00c6ff,#0099cc)", color: "#0d1b2e" }}>
            {saving ? "Speichern…" : editRechnung ? "Aktualisieren" : "Rechnung erstellen"}
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
