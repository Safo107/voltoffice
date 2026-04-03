"use client";

import { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/lib/authFetch";
import { usePro } from "@/context/ProContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ShoppingCart, Package, Check, RefreshCw, Share2, FileDown } from "lucide-react";

interface ShoppingItem {
  _id: string;
  name: string;
  menge: number;
  einheit: string;
  preis?: number;
  projektId: string;
  projektName: string;
  userId: string;
}

export default function EinkaufslistePage() {
  const { plan } = usePro();
  const isBusiness = plan === "business";

  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Confirm Modal
  const [confirmItem, setConfirmItem] = useState<ShoppingItem | null>(null);

  // Info Modal
  const [infoMsg, setInfoMsg] = useState("");
  const [infoVisible, setInfoVisible] = useState(false);

  const fetchItems = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await authFetch("/api/einkaufsliste");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
      setLastSync(new Date());
    } catch {
      if (!silent) setItems([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // 30s Polling für Business-Plan (Team-Sync)
  useEffect(() => {
    if (!isBusiness) return;
    const interval = setInterval(() => fetchItems(true), 30_000);
    return () => clearInterval(interval);
  }, [isBusiness, fetchItems]);

  const confirmBought = async () => {
    if (!confirmItem) return;
    try {
      await authFetch("/api/einkaufsliste", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId: confirmItem._id }),
      });
      setItems((prev) => prev.filter((i) => i._id !== confirmItem._id));
    } catch { /* silently ignore */ }
    setConfirmItem(null);
  };

  // Eindeutige Projektnamen für Filter-Chips
  const projekte = [...new Set(items.map((i) => i.projektName))];

  const filtered =
    filter === "all" ? items : items.filter((i) => i.projektName === filter);

  const totalCost = filtered.reduce(
    (sum, i) => sum + (i.preis ?? 0) * i.menge,
    0
  );

  // WhatsApp-Teilen: Text generieren + Tab öffnen
  const shareAsText = async () => {
    if (filtered.length === 0) {
      setInfoMsg("Einkaufsliste ist leer — nichts zu teilen.");
      setInfoVisible(true);
      return;
    }
    const date = new Date().toLocaleDateString("de-DE");
    let text = `VoltOffice Einkaufsliste\n${date}\n\n`;
    filtered.forEach((item) => {
      text += `${item.name}\n`;
      text += `  Menge: ${item.menge} ${item.einheit} | Projekt: ${item.projektName}`;
      if ((item.preis ?? 0) > 0)
        text += ` | ~€${((item.preis ?? 0) * item.menge).toFixed(2)}`;
      text += "\n\n";
    });
    if (totalCost > 0) text += `Gesamt: €${totalCost.toFixed(2)}\n`;
    try {
      await navigator.clipboard.writeText(text);
    } catch { /* clipboard nicht verfügbar */ }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  // PDF Export: HTML-Blob in neuem Tab öffnen
  const exportAsPDF = () => {
    if (filtered.length === 0) {
      setInfoMsg("Einkaufsliste ist leer — nichts zu exportieren.");
      setInfoVisible(true);
      return;
    }
    const date = new Date().toLocaleDateString("de-DE");
    let tableRows = "";
    filtered.forEach((item, idx) => {
      const bg = idx % 2 === 0 ? "#112240" : "#0d1b2e";
      const cost =
        (item.preis ?? 0) > 0
          ? `€${((item.preis ?? 0) * item.menge).toFixed(2)}`
          : "–";
      tableRows += `<tr style="background:${bg};">
        <td style="padding:10px 14px;color:#e6edf3;">${item.name}</td>
        <td style="padding:10px 14px;color:#8b9ab5;font-size:12px;">${item.projektName}</td>
        <td style="padding:10px 14px;text-align:center;color:#f5a623;font-weight:700;">${item.menge} ${item.einheit}</td>
        <td style="padding:10px 14px;text-align:center;color:#22c55e;">${cost}</td>
      </tr>`;
    });
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Einkaufsliste</title><style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:Arial,sans-serif;background:#0d1b2e;color:#e6edf3;padding:20px;}
.header{background:#112240;border:1px solid rgba(0,198,255,0.3);border-radius:12px;padding:20px;margin-bottom:20px;}
h1{color:#00c6ff;font-size:20px;margin-bottom:4px;}
table{width:100%;border-collapse:collapse;background:#112240;border-radius:12px;border:1px solid #1e3a5f;overflow:hidden;}
th{background:#0d1b2e;color:#8b9ab5;font-size:11px;text-transform:uppercase;letter-spacing:.6px;padding:12px 14px;text-align:left;}
td{border-bottom:1px solid #1e3a5f;}
.footer{margin-top:20px;text-align:center;color:#4a6fa5;font-size:12px;padding:16px;background:#112240;border-radius:10px;}
</style></head><body>
<div class="header">
  <h1>Einkaufsliste</h1>
  <p style="color:#8b9ab5;">VoltOffice · ${date}</p>
</div>
<table>
  <thead><tr>
    <th>Material</th><th>Projekt</th>
    <th style="text-align:center;">Menge</th><th style="text-align:center;">Kosten</th>
  </tr></thead>
  <tbody>${tableRows}</tbody>
</table>
${totalCost > 0 ? `<p style="margin-top:16px;text-align:right;font-size:16px;font-weight:700;color:#22c55e;">Gesamt: €${totalCost.toFixed(2)}</p>` : ""}
<div class="footer"><p>VoltOffice by ElektroGenius · elektrogenius.de</p></div>
</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  return (
    <DashboardLayout title="Einkaufsliste">
      <div className="flex flex-col" style={{ minHeight: "calc(100vh - 64px)" }}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-4 py-4 border-b"
          style={{ borderColor: "#1e3a5f" }}
        >
          <div>
            <h1
              className="text-xl font-bold"
              style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}
            >
              Einkaufsliste
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "#8b9ab5" }}>
              {filtered.length} {filtered.length === 1 ? "Artikel" : "Artikel"}
              {isBusiness && " · Team-Liste"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isBusiness && lastSync && (
              <span className="text-xs" style={{ color: "#4a6fa5" }}>
                Sync:{" "}
                {lastSync.toLocaleTimeString("de-DE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
            <button
              onClick={() => fetchItems()}
              className="p-2 rounded-lg transition-all"
              style={{ color: "#4a6fa5" }}
              title="Aktualisieren"
              onMouseEnter={(e) => (e.currentTarget.style.color = "#00c6ff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#4a6fa5")}
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* ── Hinweis-Leiste ──────────────────────────────────────────────── */}
        <div
          className="flex items-center gap-2 px-4 py-2 text-xs border-b"
          style={{
            background: "rgba(0,198,255,0.05)",
            borderColor: "rgba(0,198,255,0.15)",
            color: "#8b9ab5",
          }}
        >
          <ShoppingCart size={12} style={{ color: "#00c6ff", flexShrink: 0 }} />
          <span>
            Tippe auf einen Artikel um ihn als eingekauft zu markieren — Bestand
            wird automatisch aufgefüllt.
          </span>
          {isBusiness && (
            <span
              className="ml-auto shrink-0 px-2 py-0.5 rounded text-xs font-semibold"
              style={{
                background: "rgba(0,198,255,0.15)",
                color: "#00c6ff",
                border: "1px solid rgba(0,198,255,0.3)",
              }}
            >
              Live · 30s
            </span>
          )}
        </div>

        {/* ── Zusammenfassung ─────────────────────────────────────────────── */}
        {items.length > 0 && (
          <div
            className="grid gap-2 px-4 py-3 border-b"
            style={{
              borderColor: "#1e3a5f",
              gridTemplateColumns: totalCost > 0 ? "1fr 1fr 1fr" : "1fr 1fr",
            }}
          >
            {[
              { label: "Gesamt", value: items.length, color: "#f5a623" },
              { label: "Projekte", value: projekte.length, color: "#00c6ff" },
              ...(totalCost > 0
                ? [{ label: "~Kosten", value: `€${totalCost.toFixed(0)}`, color: "#22c55e" }]
                : []),
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-3 text-center"
                style={{ background: "#112240", border: "1px solid #1e3a5f" }}
              >
                <p className="text-xs mb-1" style={{ color: "#4a6fa5" }}>
                  {s.label}
                </p>
                <p
                  className="font-bold"
                  style={{ color: s.color, fontSize: typeof s.value === "number" ? "22px" : "16px" }}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── Filter-Chips ────────────────────────────────────────────────── */}
        {projekte.length > 1 && (
          <div
            className="flex gap-2 px-4 py-3 overflow-x-auto border-b"
            style={{ borderColor: "#1e3a5f" }}
          >
            {[
              { key: "all", label: `Alle (${items.length})` },
              ...projekte.map((p) => ({
                key: p,
                label: p,
              })),
            ].map((f) => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all"
                  style={{
                    background: active
                      ? "rgba(245,166,35,0.15)"
                      : "#112240",
                    color: active ? "#f5a623" : "#8b9ab5",
                    border: `1px solid ${active ? "rgba(245,166,35,0.4)" : "#1e3a5f"}`,
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Artikel-Liste ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-16" style={{ color: "#4a6fa5" }}>
              Laden…
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(34,197,94,0.1)" }}
              >
                <Check size={32} style={{ color: "#22c55e" }} />
              </div>
              <p
                className="text-lg font-bold mb-2"
                style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}
              >
                Alles erledigt!
              </p>
              <p className="text-sm" style={{ color: "#8b9ab5" }}>
                Kein Material muss eingekauft werden.
              </p>
            </div>
          ) : (
            <>
              <p
                className="text-xs font-bold uppercase tracking-wider mb-3"
                style={{ color: "#4a6fa5", letterSpacing: "0.8px" }}
              >
                Einzukaufen ({filtered.length})
              </p>
              <div className="space-y-2">
                {filtered.map((item) => (
                  <button
                    key={item._id}
                    onClick={() => setConfirmItem(item)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                    style={{
                      background: "#112240",
                      border: "1px solid #1e3a5f",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#f5a623";
                      e.currentTarget.style.background =
                        "rgba(245,166,35,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#1e3a5f";
                      e.currentTarget.style.background = "#112240";
                    }}
                  >
                    {/* Checkbox */}
                    <div
                      className="w-5 h-5 rounded shrink-0"
                      style={{ border: "2px solid #f5a623" }}
                    />

                    {/* Icon */}
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "rgba(245,166,35,0.12)" }}
                    >
                      <Package size={16} style={{ color: "#f5a623" }} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{ color: "#e6edf3" }}
                      >
                        {item.name}
                      </p>
                      <p
                        className="text-xs truncate"
                        style={{ color: "#4a6fa5" }}
                      >
                        {item.projektName}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs" style={{ color: "#8b9ab5" }}>
                          {item.menge} {item.einheit}
                        </span>
                        {(item.preis ?? 0) > 0 && (
                          <>
                            <span style={{ color: "#4a6fa5" }}>·</span>
                            <span
                              className="text-xs font-semibold"
                              style={{ color: "#22c55e" }}
                            >
                              €{((item.preis ?? 0) * item.menge).toFixed(2)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Badge */}
                    <span
                      className="text-xs px-2 py-1 rounded-full shrink-0 font-semibold"
                      style={{
                        background: "rgba(245,166,35,0.12)",
                        color: "#f5a623",
                        border: "1px solid rgba(245,166,35,0.3)",
                      }}
                    >
                      Kaufen
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Bottom Buttons ──────────────────────────────────────────────── */}
        {items.length > 0 && (
          <div
            className="flex gap-3 px-4 py-4 border-t"
            style={{ borderColor: "#1e3a5f", background: "#0d1b2e" }}
          >
            <button
              onClick={shareAsText}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: "rgba(79,163,247,0.15)",
                border: "1px solid rgba(79,163,247,0.3)",
                color: "#4fa3f7",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <Share2 size={15} />
              WhatsApp
            </button>
            <button
              onClick={exportAsPDF}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
              style={{
                background: "#f5a623",
                border: "1px solid #f5a623",
                color: "#0d1b2e",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <FileDown size={15} />
              PDF Export
            </button>
          </div>
        )}
      </div>

      {/* ── Bestätigungs-Modal ──────────────────────────────────────────── */}
      {confirmItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmItem(null);
          }}
        >
          <div
            className="rounded-2xl p-6 w-full max-w-sm"
            style={{ background: "#112240", border: "1px solid #1e3a5f" }}
          >
            <p
              className="text-base font-bold mb-2 text-center"
              style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}
            >
              Eingekauft?
            </p>
            <p
              className="text-sm mb-6 text-center"
              style={{ color: "#8b9ab5", lineHeight: "1.6" }}
            >
              „{confirmItem.name}" wurde eingekauft?
              <br />
              <br />
              Bestand wird auf{" "}
              <span style={{ color: "#e6edf3", fontWeight: 600 }}>
                {confirmItem.menge} {confirmItem.einheit}
              </span>{" "}
              aufgefüllt.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmItem(null)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: "#0d1b2e",
                  color: "#8b9ab5",
                  border: "1px solid #1e3a5f",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#e6edf3")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#8b9ab5")}
              >
                Abbrechen
              </button>
              <button
                onClick={confirmBought}
                className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
                style={{ background: "#f5a623", color: "#0d1b2e" }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Ja, eingekauft!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Info-Modal ──────────────────────────────────────────────────── */}
      {infoVisible && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setInfoVisible(false);
          }}
        >
          <div
            className="rounded-2xl p-6 w-full max-w-sm text-center"
            style={{ background: "#112240", border: "1px solid #1e3a5f" }}
          >
            <p
              className="text-sm mb-5"
              style={{ color: "#8b9ab5", lineHeight: "1.6" }}
            >
              {infoMsg}
            </p>
            <button
              onClick={() => setInfoVisible(false)}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: "#0d1b2e",
                color: "#8b9ab5",
                border: "1px solid #1e3a5f",
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
