"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Receipt, ArrowRight, Loader } from "lucide-react";

interface InvoiceSummary {
  count: number;
  total: number;
}

export default function OpenInvoicesWidget() {
  const router = useRouter();
  const [data, setData] = useState<InvoiceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Offene Angebote als Proxy für offene Rechnungen (bis Rechnungen-Feature live ist)
    fetch("/api/angebote")
      .then((r) => r.json())
      .then((angebote: { status: string; total: number }[]) => {
        const open = Array.isArray(angebote)
          ? angebote.filter((a) => a.status === "sent" || a.status === "draft")
          : [];
        setData({
          count: open.length,
          total: open.reduce((s, a) => s + (a.total || 0), 0),
        });
        setLoading(false);
      })
      .catch(() => {
        setData({ count: 0, total: 0 });
        setLoading(false);
      });
  }, []);

  return (
    <div
      className="rounded-xl p-5 cursor-pointer transition-all"
      style={{ background: "#112240", border: "1px solid #1e3a5f" }}
      onClick={() => router.push("/angebote")}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#f5a62344"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#f5a62318", border: "1px solid #f5a62333" }}>
            <Receipt size={16} style={{ color: "#f5a623" }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>Offene Angebote</p>
            <p className="text-xs" style={{ color: "#8b9ab5" }}>Klicken zum Öffnen</p>
          </div>
        </div>
        <ArrowRight size={16} style={{ color: "#8b9ab5" }} />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#8b9ab5" }}>
          <Loader size={14} className="animate-spin" />
          Wird geladen...
        </div>
      ) : (
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold" style={{ color: "#f5a623", fontFamily: "var(--font-syne)" }}>
              {data?.count ?? 0}
            </p>
            <p className="text-xs" style={{ color: "#8b9ab5" }}>Angebote offen</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
              {(data?.total ?? 0).toLocaleString("de-DE", { minimumFractionDigits: 0 })} €
            </p>
            <p className="text-xs" style={{ color: "#8b9ab5" }}>Gesamtwert</p>
          </div>
        </div>
      )}
    </div>
  );
}
