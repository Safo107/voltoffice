"use client";

import { useState, useEffect } from "react";
import { authFetch } from "@/lib/authFetch";
import { usePro } from "@/context/ProContext";
import { getPlanLimits } from "@/lib/planLimits";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Modal from "@/components/ui/Modal";
import CustomerSelect from "@/components/ui/CustomerSelect";
import SignaturePad from "@/components/ui/SignaturePad";
import EmptyState from "@/components/ui/EmptyState";
import UpgradeModal from "@/components/ui/UpgradeModal";
import PlanLimitBar from "@/components/ui/PlanLimitBar";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useRouter } from "next/navigation";
import {
  FileText, Plus, Search, MoreVertical, Trash2, Edit, Loader, Send, FolderPlus, FileDown, X, PenLine, Lock, GitBranch, Mail,
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
  signatureStatus?: "signed";
  signedAt?: string;
  locked?: boolean;
  lockedAt?: string;
  version?: number;
  parentDocumentId?: string;
  total: number;
  createdAt?: string;
  validUntil: string;
  items: OfferItem[];
}

// FREE_LIMIT removed — use plan-based limits from getPlanLimits()

const statusConfig = {
  draft: { label: "Entwurf", color: "#8b9ab5" },
  sent: { label: "Versendet", color: "#00c6ff" },
  accepted: { label: "Angenommen", color: "#22c55e" },
  rejected: { label: "Abgelehnt", color: "#ef4444" },
};

const EMPTY_ITEM: OfferItem = { description: "", quantity: 1, unit: "Stk.", unitPrice: 0, total: 0 };

export default function AngebotePage() {
  const { isPro, plan } = usePro();
  const limits = getPlanLimits(plan);
  const angeboteLimit = limits.angebote === Infinity ? -1 : limits.angebote;

  const router = useRouter();
  const [angebote, setAngebote] = useState<Offer[]>([]);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editAngebot, setEditAngebot] = useState<Offer | null>(null);
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState<string | undefined>(undefined);
  const [validUntil, setValidUntil] = useState("");
  const [items, setItems] = useState<OfferItem[]>([{ ...EMPTY_ITEM }]);
  const [signModal, setSignModal] = useState<Offer | null>(null);
  const [signSaving, setSignSaving] = useState(false);
  const [emailModal, setEmailModal] = useState<Offer | null>(null);
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [actionError, setActionError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmConvertId, setConfirmConvertId] = useState<Offer | null>(null);
  const [confirmVersionId, setConfirmVersionId] = useState<Offer | null>(null);

  useEffect(() => { fetchAngebote(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const downloadPdf = async (id: string, num: string) => {
    const res = await authFetch(`/api/angebote/${id}/pdf`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `Angebot-${num}.pdf`;
    try { a.click(); } finally { URL.revokeObjectURL(url); }
  };

  const handleConvertToProjekt = async (angebot: Offer) => {
    try {
      const res = await authFetch("/api/projekte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Projekt – ${angebot.customerName || angebot.number}`,
          customerName: angebot.customerName || "",
          status: "active",
          startDate: new Date().toISOString().split("T")[0],
          description: `Erstellt aus Angebot ${angebot.number}`,
        }),
      });
      if (res.ok) router.push("/projekte");
    } catch { /* ignore */ }
    setConfirmConvertId(null);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpen]);

  const fetchAngebote = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/angebote");
      const data = await res.json();
      setAngebote(Array.isArray(data) ? data : []);
    } catch {
      setAngebote([]);
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setEditAngebot(null);
    setCustomerName("");
    setCustomerId(undefined);
    setValidUntil("");
    setItems([{ ...EMPTY_ITEM }]);
    setModalOpen(true);
  };

  const openEdit = (a: Offer) => {
    setEditAngebot(a);
    setCustomerName(a.customerName);
    setCustomerId((a as { customerId?: string }).customerId);
    setValidUntil(a.validUntil || "");
    setItems(a.items?.length ? a.items : [{ ...EMPTY_ITEM }]);
    setModalOpen(true);
    setMenuOpen(null);
  };

  const handleSend = async (a: Offer) => {
    if (a.status === "sent") return;
    try {
      await authFetch(`/api/angebote/${a._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "sent" }),
      });
      await fetchAngebote();
    } catch {
      //
    }
    setMenuOpen(null);
  };

  const updateItem = (i: number, field: keyof OfferItem, value: string | number) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: value };
    updated[i].total = updated[i].quantity * updated[i].unitPrice;
    setItems(updated);
  };

  const netto = items.reduce((sum, it) => sum + it.total, 0);
  const total = netto * 1.19;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { customerName, customerId, validUntil, items, netto, total };
      if (editAngebot) {
        await authFetch(`/api/angebote/${editAngebot._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        const res = await authFetch("/api/angebote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.status === 403) {
          setModalOpen(false);
          setUpgradeOpen(true);
          return;
        }
      }
      await fetchAngebote();
      setModalOpen(false);
    } catch {
      //
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await authFetch(`/api/angebote/${id}`, { method: "DELETE" });
      await fetchAngebote();
    } catch { /* ignore */ }
    setConfirmDeleteId(null);
    setMenuOpen(null);
  };

  const handleSign = async (base64: string) => {
    if (!signModal?._id) return;
    setSignSaving(true);
    try {
      await authFetch("/api/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: signModal._id, type: "angebot", signatureImage: base64 }),
      });
      await fetchAngebote();
      setSignModal(null);
    } catch {
      //
    } finally {
      setSignSaving(false);
    }
  };

  const handleNewVersion = async (a: Offer) => {
    try {
      const res = await authFetch("/api/documents/version", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: a._id, type: "angebot" }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchAngebote();
        setConfirmVersionId(null);
      } else {
        setActionError(data.error || "Fehler beim Erstellen der neuen Version.");
        setConfirmVersionId(null);
      }
    } catch { /* */ }
    setMenuOpen(null);
  };

  const openEmailModal = (a: Offer) => {
    setEmailTo("");
    setEmailSubject(`Angebot Nr. ${a.number}`);
    setEmailMessage(`Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie Angebot Nr. ${a.number}.\n\nBei Fragen stehen wir Ihnen gerne zur Verfügung.\n\nMit freundlichen Grüßen`);
    setEmailModal(a);
    setMenuOpen(null);
  };

  const handleEmailSend = async () => {
    if (!emailModal?._id || !emailTo) return;
    setEmailSending(true);
    try {
      const res = await authFetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: emailModal._id, type: "angebot", to: emailTo, subject: emailSubject, message: emailMessage }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchAngebote();
        setEmailModal(null);
      } else {
        setActionError(data.error || "E-Mail konnte nicht gesendet werden.");
      }
    } catch {
      setActionError("Verbindungsfehler. Bitte erneut versuchen.");
    } finally {
      setEmailSending(false);
    }
  };

  const filtered = angebote.filter(
    (a) =>
      a.number?.toLowerCase().includes(search.toLowerCase()) ||
      a.customerName?.toLowerCase().includes(search.toLowerCase())
  );
  const atLimit = angeboteLimit !== -1 && angebote.length >= angeboteLimit;
  const subtitle = angeboteLimit === -1
    ? `${angebote.length} Angebote`
    : `${angebote.length} von ${angeboteLimit} Angeboten`;

  return (
    <DashboardLayout title="Angebote" subtitle={subtitle}>
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} resource="angebote" limit={angeboteLimit === -1 ? undefined : angeboteLimit} />
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
          onClick={atLimit ? () => setUpgradeOpen(true) : openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ml-3"
          style={{
            background: atLimit ? "#f5a62322" : "linear-gradient(135deg, #00c6ff, #0099cc)",
            color: atLimit ? "#f5a623" : "#0d1b2e",
            border: atLimit ? "1px solid #f5a62344" : "none",
          }}
        >
          <Plus size={16} />
          {atLimit ? "Limit erreicht" : "Neues Angebot"}
        </button>
      </div>
      {angeboteLimit !== -1 && (
        <div className="mb-4"><PlanLimitBar label="Angebote" count={angebote.length} limit={angeboteLimit} /></div>
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
        <div className="rounded-xl" style={{ border: "1px solid #1e3a5f" }}>
          {/* Desktop table header */}
          <div
            className="hidden md:grid grid-cols-12 px-4 py-3 text-xs font-semibold uppercase tracking-wider rounded-t-xl"
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
            const rowBg = i % 2 === 0 ? "#0d1b2e" : "#112240";
            const isLast = i === filtered.length - 1;
            const dropdown = menuOpen === id && (
              <div className="absolute right-0 top-8 rounded-xl py-1 z-20 min-w-36"
                style={{ background: "#1a2f50", border: "1px solid #1e3a5f", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
                <button onClick={() => handleSend(angebot)}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm transition-all"
                  style={{ color: angebot.status === "sent" ? "#8b9ab5" : "#e6edf3" }}
                  disabled={angebot.status === "sent"}
                  onMouseEnter={(e) => { if (angebot.status !== "sent") e.currentTarget.style.background = "#1e3a5f"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                  <Send size={13} /> {angebot.status === "sent" ? "Bereits versendet" : "Als versendet markieren"}
                </button>
                <button
                  onClick={() => { if (!angebot.locked) openEdit(angebot); }}
                  disabled={!!angebot.locked}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ color: angebot.locked ? "#8b9ab5" : "#e6edf3" }}
                  onMouseEnter={(e) => { if (!angebot.locked) e.currentTarget.style.background = "#1e3a5f"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                  {angebot.locked ? <Lock size={13} /> : <Edit size={13} />}
                  {angebot.locked ? "Gesperrt (unterschrieben)" : "Bearbeiten"}
                </button>
                {angebot.locked && (
                  <button onClick={() => { setConfirmVersionId(angebot); setMenuOpen(null); }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm transition-all"
                    style={{ color: "#f5a623" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#f5a62318"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                    <GitBranch size={13} /> Neue Version erstellen
                  </button>
                )}
                <button onClick={() => { downloadPdf(id, angebot.number); setMenuOpen(null); }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm transition-all"
                  style={{ color: "#00c6ff" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#00c6ff18"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                  <FileDown size={13} /> Als PDF herunterladen
                </button>
                <button onClick={() => openEmailModal(angebot)}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm transition-all"
                  style={{ color: "#00c6ff" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#00c6ff18"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                  <Mail size={13} />
                  {(angebot as { emailStatus?: string }).emailStatus === "sent" ? "Erneut senden" : "Per E-Mail senden"}
                </button>
                <button onClick={() => { setConfirmConvertId(angebot); setMenuOpen(null); }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm transition-all"
                  style={{ color: "#22c55e" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#22c55e18"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                  <FolderPlus size={13} /> In Projekt umwandeln
                </button>
                <button onClick={() => { setSignModal(angebot); setMenuOpen(null); }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm transition-all"
                  style={{ color: angebot.signatureStatus === "signed" ? "#22c55e" : "#00c6ff" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = angebot.signatureStatus === "signed" ? "#22c55e18" : "#00c6ff18"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                  <PenLine size={13} />
                  {angebot.signatureStatus === "signed" ? "Unterschrift anzeigen" : "Unterschreiben"}
                </button>
                <button onClick={() => { setConfirmDeleteId(String(angebot._id)); setMenuOpen(null); }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm transition-all"
                  style={{ color: "#ef4444" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#ef444418"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                  <Trash2 size={13} /> Löschen
                </button>
              </div>
            );
            const menuBtnEl = (
              <div className="relative flex justify-end">
                <button onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === id ? null : id); }}
                  className="p-1.5 rounded-lg transition-all" style={{ color: "#8b9ab5" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#1e3a5f"; e.currentTarget.style.color = "#e6edf3"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#8b9ab5"; }}>
                  <MoreVertical size={15} />
                </button>
                {dropdown}
              </div>
            );
            return (
              <div key={id}>
                {/* Mobile card */}
                <div className="md:hidden px-4 py-4 transition-all"
                  style={{ background: rowBg, borderBottom: isLast ? "none" : "1px solid #1e3a5f44", ...(isLast ? { borderRadius: "0 0 .75rem .75rem" } : {}) }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-mono font-medium" style={{ color: "#00c6ff" }}>#{angebot.number}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${sc.color}22`, color: sc.color, border: `1px solid ${sc.color}44` }}>
                        {sc.label}
                      </span>
                      {angebot.locked && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1" style={{ background: "#22c55e18", color: "#22c55e", border: "1px solid #22c55e44" }}>
                          <Lock size={9} />
                        </span>
                      )}
                      {menuBtnEl}
                    </div>
                  </div>
                  <p className="text-sm font-medium mb-1 truncate" style={{ color: "#e6edf3" }}>{angebot.customerName}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold" style={{ color: "#e6edf3" }}>
                      {(angebot.total || 0).toLocaleString("de-DE")} €
                    </p>
                    <p className="text-xs" style={{ color: "#8b9ab5" }}>
                      {angebot.validUntil ? new Date(angebot.validUntil).toLocaleDateString("de-DE") : "—"}
                    </p>
                  </div>
                </div>
                {/* Desktop table row */}
                <div className="hidden md:grid grid-cols-12 px-4 py-4 items-center transition-all"
                  style={{ background: rowBg, borderBottom: isLast ? "none" : "1px solid #1e3a5f44", ...(isLast ? { borderRadius: "0 0 .75rem .75rem" } : {}) }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#00c6ff08"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = rowBg; }}>
                  <div className="col-span-2">
                    <p className="text-sm font-mono font-medium" style={{ color: "#00c6ff" }}>#{angebot.number}</p>
                  </div>
                  <div className="col-span-3">
                    <p className="text-sm font-medium truncate" style={{ color: "#e6edf3" }}>{angebot.customerName}</p>
                  </div>
                  <div className="col-span-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${sc.color}22`, color: sc.color, border: `1px solid ${sc.color}44` }}>
                      {sc.label}
                    </span>
                    {angebot.locked && (
                      <span className="text-xs px-2 py-1 rounded-full flex items-center gap-1" style={{ background: "#22c55e18", color: "#22c55e", border: "1px solid #22c55e44" }}>
                        <Lock size={10} /> Signiert
                      </span>
                    )}
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
                  <div className="col-span-1">{menuBtnEl}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editAngebot ? "Angebot bearbeiten" : "Neues Angebot erstellen"} maxWidth="780px">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Kunde *</label>
              <CustomerSelect
                required
                value={customerName}
                onChange={(name, id) => { setCustomerName(name); setCustomerId(id); }}
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
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "#8b9ab5" }}>Positionen</label>
              <button
                type="button"
                onClick={() => setItems([...items, { ...EMPTY_ITEM }])}
                className="text-xs px-2.5 py-1 rounded-lg transition-all flex items-center gap-1"
                style={{ background: "#00c6ff18", color: "#00c6ff", border: "1px solid #00c6ff33" }}
              >
                <Plus size={11} /> Position
              </button>
            </div>

            {/* Table header */}
            <div
              className="grid text-xs font-semibold uppercase tracking-wider px-2 py-1.5 rounded-t-lg"
              style={{
                background: "#0a1628",
                color: "#8b9ab5",
                borderTop: "1px solid #1e3a5f",
                borderLeft: "1px solid #1e3a5f",
                borderRight: "1px solid #1e3a5f",
                gridTemplateColumns: "28px 1fr 64px 80px 88px 72px 28px",
                gap: "6px",
              }}
            >
              <span className="text-center">#</span>
              <span>Beschreibung</span>
              <span className="text-center">Menge</span>
              <span className="text-center">Einheit</span>
              <span className="text-right">Einzelpreis</span>
              <span className="text-right">Gesamt</span>
              <span />
            </div>

            {/* Position rows */}
            <div style={{ border: "1px solid #1e3a5f", borderTop: "none", borderRadius: "0 0 .5rem .5rem", overflow: "hidden" }}>
              {items.map((item, i) => (
                <div
                  key={i}
                  className="grid items-center px-2 py-1.5"
                  style={{
                    gridTemplateColumns: "28px 1fr 64px 80px 88px 72px 28px",
                    gap: "6px",
                    background: i % 2 === 0 ? "#0d1b2e" : "#0a1628",
                    borderTop: i === 0 ? "none" : "1px solid #1e3a5f44",
                  }}
                >
                  {/* Pos-Nr */}
                  <span className="text-center text-xs font-mono" style={{ color: "#8b9ab5" }}>{i + 1}</span>

                  {/* Beschreibung */}
                  <input
                    value={item.description}
                    onChange={(e) => updateItem(i, "description", e.target.value)}
                    placeholder="Beschreibung…"
                    className="w-full px-2 py-1.5 rounded-md text-xs outline-none"
                    style={{ background: "#112240", border: "1px solid #1e3a5f44", color: "#e6edf3" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f44"; }}
                  />

                  {/* Menge */}
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-md text-xs text-center outline-none"
                    style={{ background: "#112240", border: "1px solid #1e3a5f44", color: "#e6edf3" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f44"; }}
                  />

                  {/* Einheit */}
                  <select
                    value={item.unit}
                    onChange={(e) => updateItem(i, "unit", e.target.value)}
                    className="w-full px-1.5 py-1.5 rounded-md text-xs outline-none"
                    style={{ background: "#112240", border: "1px solid #1e3a5f44", color: "#e6edf3" }}
                  >
                    <option>Stk.</option>
                    <option>Std.</option>
                    <option>m</option>
                    <option>m²</option>
                    <option>pauschal</option>
                  </select>

                  {/* Einzelpreis */}
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(i, "unitPrice", Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-md text-xs text-right outline-none"
                    style={{ background: "#112240", border: "1px solid #1e3a5f44", color: "#e6edf3" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f44"; }}
                  />

                  {/* Gesamt */}
                  <span className="text-xs font-semibold text-right pr-1" style={{ color: "#00c6ff" }}>
                    {item.total.toFixed(2)} €
                  </span>

                  {/* Löschen */}
                  <button
                    type="button"
                    onClick={() => setItems(items.filter((_, idx) => idx !== i))}
                    disabled={items.length === 1}
                    className="flex items-center justify-center rounded-md transition-all"
                    style={{ color: items.length === 1 ? "#2a3f5f" : "#8b9ab5", width: 22, height: 22 }}
                    onMouseEnter={(e) => { if (items.length > 1) e.currentTarget.style.color = "#ef4444"; }}
                    onMouseLeave={(e) => { if (items.length > 1) e.currentTarget.style.color = "#8b9ab5"; }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* MwSt / Brutto Breakdown */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1e3a5f" }}>
            <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid #1e3a5f" }}>
              <span className="text-sm" style={{ color: "#8b9ab5" }}>Netto</span>
              <span className="text-sm font-medium" style={{ color: "#e6edf3" }}>
                {total.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "#0d1b2e", borderBottom: "1px solid #1e3a5f" }}>
              <span className="text-sm" style={{ color: "#8b9ab5" }}>MwSt. 19 %</span>
              <span className="text-sm font-medium" style={{ color: "#e6edf3" }}>
                {(total * 0.19).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3" style={{ background: "#00c6ff0a" }}>
              <span className="text-sm font-bold" style={{ color: "#00c6ff" }}>Brutto</span>
              <span className="text-lg font-bold" style={{ color: "#00c6ff", fontFamily: "var(--font-syne)" }}>
                {(total * 1.19).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
              </span>
            </div>
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
              {saving ? "Wird gespeichert..." : editAngebot ? "Aktualisieren" : "Angebot erstellen"}
            </button>
          </div>
        </form>
      </Modal>
      {/* E-Mail Modal */}
      <Modal
        open={!!emailModal}
        onClose={() => setEmailModal(null)}
        title={`Angebot #${emailModal?.number} per E-Mail senden`}
        maxWidth="560px"
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Empfänger *</label>
            <input
              type="email"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              placeholder="kunde@beispiel.de"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Betreff</label>
            <input
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Nachricht</label>
            <textarea
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              rows={6}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
            />
          </div>
          <p className="text-xs" style={{ color: "#8b9ab5" }}>
            PDF wird automatisch als Anhang beigefügt.
          </p>
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => setEmailModal(null)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#8b9ab5" }}
            >
              Abbrechen
            </button>
            <button
              onClick={handleEmailSend}
              disabled={emailSending || !emailTo.includes("@")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #00c6ff, #0099cc)", color: "#0d1b2e" }}
            >
              {emailSending ? <Loader size={14} className="animate-spin" /> : <Mail size={14} />}
              {emailSending ? "Wird gesendet…" : "Senden"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Signatur-Modal */}
      <Modal
        open={!!signModal}
        onClose={() => setSignModal(null)}
        title={signModal?.signatureStatus === "signed" ? "Unterschrift" : `Angebot #${signModal?.number} unterschreiben`}
        maxWidth="760px"
      >
        {signModal?.signatureStatus === "signed" ? (
          <div>
            <div className="rounded-xl overflow-hidden mb-4" style={{ border: "1px solid #1e3a5f" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={(signModal as { signatureImage?: string }).signatureImage || ""} alt="Unterschrift" className="w-full" style={{ background: "#0d1b2e" }} />
            </div>
            <p className="text-xs text-center" style={{ color: "#8b9ab5" }}>
              Unterschrieben am {signModal.signedAt ? new Date(signModal.signedAt).toLocaleString("de-DE") : "–"}
            </p>
            <button
              onClick={() => setSignModal(null)}
              className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#8b9ab5" }}
            >
              Schließen
            </button>
          </div>
        ) : (
          <SignaturePad
            onSave={handleSign}
            onCancel={() => setSignModal(null)}
            saving={signSaving}
          />
        )}
      </Modal>

      {/* Aktions-Fehler Banner */}
      {actionError && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-xl cursor-pointer"
          style={{ background: "#ef444420", border: "1px solid #ef444440", color: "#ef4444", whiteSpace: "nowrap" }}
          onClick={() => setActionError("")}
        >
          {actionError}
        </div>
      )}

      <ConfirmModal
        open={!!confirmDeleteId}
        title="Angebot löschen?"
        message="Dieses Angebot wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        confirmLabel="Löschen"
        danger
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />

      <ConfirmModal
        open={!!confirmConvertId}
        title="In Projekt umwandeln?"
        message={`Angebot ${confirmConvertId?.number} in ein neues Projekt umwandeln?`}
        confirmLabel="Umwandeln"
        onConfirm={() => confirmConvertId && handleConvertToProjekt(confirmConvertId)}
        onCancel={() => setConfirmConvertId(null)}
      />

      <ConfirmModal
        open={!!confirmVersionId}
        title="Neue Version erstellen?"
        message={`Neue Version von Angebot #${confirmVersionId?.number} erstellen? Das Original bleibt gesperrt.`}
        confirmLabel="Neue Version erstellen"
        onConfirm={() => confirmVersionId && handleNewVersion(confirmVersionId)}
        onCancel={() => setConfirmVersionId(null)}
      />
    </DashboardLayout>
  );
}
