"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { usePro } from "@/context/ProContext";
import { useRouter } from "next/navigation";
import { Calculator, Zap, Lock, Loader, ChevronDown, AlertCircle } from "lucide-react";

// ─── Berechnungsfunktionen ──────────────────────────────────────────────────

function berechneQuerschnitt(strom: number, laenge: number, spannung: number, material: string, phasig: number) {
  // ρ in Ω·mm²/m
  const rho = material === "cu" ? 0.0178 : 0.0282;
  const k = phasig === 3 ? Math.sqrt(3) : 2;
  const uFall = spannung * 0.03; // max. 3% Spannungsfall
  const querschnitt = (k * rho * laenge * strom) / uFall;
  // Normwert runden
  const normen = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120];
  return normen.find((n) => n >= querschnitt) ?? "> 120";
}

function berechneAbsicherung(querschnitt: number, verlegeart: string) {
  // Vereinfachte Tabelle nach VDE 0298 (Cu, PVC)
  const tabelle: Record<string, Record<number, number>> = {
    A: { 1.5: 10, 2.5: 16, 4: 20, 6: 25, 10: 32, 16: 50, 25: 63, 35: 80, 50: 100, 70: 125, 95: 160, 120: 200 },
    B: { 1.5: 13, 2.5: 18, 4: 24, 6: 31, 10: 44, 16: 57, 25: 73, 35: 89, 50: 108, 70: 136, 95: 166, 120: 194 },
    C: { 1.5: 15, 2.5: 21, 4: 28, 6: 36, 10: 50, 16: 66, 25: 84, 35: 104, 50: 125, 70: 160, 95: 196, 120: 232 },
  };
  const row = tabelle[verlegeart] || tabelle["B"];
  return row[querschnitt] ?? "k.A.";
}

function berechneSpannungsfall(strom: number, laenge: number, querschnitt: number, material: string, phasig: number, spannung: number) {
  const rho = material === "cu" ? 0.0178 : 0.0282;
  const k = phasig === 3 ? Math.sqrt(3) : 2;
  const delta_u = (k * rho * laenge * strom) / querschnitt;
  const prozent = (delta_u / spannung) * 100;
  return { volt: delta_u, prozent };
}

// ─── Komponente ────────────────────────────────────────────────────────────

type Rechner = "querschnitt" | "absicherung" | "spannungsfall";

export default function VdeRechnerPage() {
  const { isPro, loadingPro } = usePro();
  const router = useRouter();
  const [active, setActive] = useState<Rechner>("querschnitt");

  // Querschnitt
  const [qs, setQs] = useState({ strom: 16, laenge: 20, spannung: 230, material: "cu", phasig: 1 });
  const [qsResult, setQsResult] = useState<number | string | null>(null);

  // Absicherung
  const [abs, setAbs] = useState({ querschnitt: 2.5, verlegeart: "B" });
  const [absResult, setAbsResult] = useState<number | string | null>(null);

  // Spannungsfall
  const [sf, setSf] = useState({ strom: 16, laenge: 30, querschnitt: 2.5, material: "cu", phasig: 1, spannung: 230 });
  const [sfResult, setSfResult] = useState<{ volt: number; prozent: number } | null>(null);

  if (loadingPro) {
    return (
      <DashboardLayout title="VDE-Rechner" subtitle="Pro-Feature">
        <div className="flex items-center justify-center py-24">
          <Loader size={24} className="animate-spin" style={{ color: "#00c6ff" }} />
        </div>
      </DashboardLayout>
    );
  }

  if (!isPro) {
    return (
      <DashboardLayout title="VDE-Rechner" subtitle="Pro-Feature">
        <div className="flex flex-col items-center justify-center py-24 gap-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-full" style={{ background: "#f5a62322", border: "1px solid #f5a62366" }}>
            <Lock size={28} style={{ color: "#f5a623" }} />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>VDE-Rechner — Pro-Feature</h2>
            <p className="text-sm" style={{ color: "#8b9ab5" }}>Leitungsquerschnitt, Absicherung und Spannungsfall berechnen.</p>
          </div>
          <button onClick={() => router.push("/upgrade")} className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg, #f5a623, #c4841c)", color: "#0d1b2e" }}>
            <Zap size={16} /> Auf Pro upgraden — 9,99€/Monat
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const tabs: { id: Rechner; label: string }[] = [
    { id: "querschnitt", label: "Leitungsquerschnitt" },
    { id: "absicherung", label: "Absicherung" },
    { id: "spannungsfall", label: "Spannungsfall" },
  ];

  const inputCls = "w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all";
  const inputSty = { background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" };

  const selectIcon = <ChevronDown size={14} style={{ color: "#8b9ab5", position: "absolute" as const, right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" as const }} />;

  return (
    <DashboardLayout title="VDE-Rechner" subtitle="Elektrotechnische Berechnungen nach VDE 0298">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: active === t.id ? "#00c6ff18" : "#112240",
              border: `1px solid ${active === t.id ? "#00c6ff44" : "#1e3a5f"}`,
              color: active === t.id ? "#00c6ff" : "#8b9ab5",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── Querschnitt ── */}
        {active === "querschnitt" && (
          <>
            <div className="rounded-xl p-6 space-y-4" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
              <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
                <Calculator size={16} style={{ color: "#00c6ff" }} /> Leitungsquerschnitt berechnen
              </h2>
              <p className="text-xs" style={{ color: "#8b9ab5" }}>Berechnung nach VDE 0298 / IEC 60364-5-52 (max. 3% Spannungsfall)</p>
              {[
                { label: "Strom (A)", key: "strom", min: 0.1 },
                { label: "Leitungslänge (m)", key: "laenge", min: 0.1 },
                { label: "Nennspannung (V)", key: "spannung", min: 1 },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#8b9ab5" }}>{f.label}</label>
                  <input type="number" min={f.min} value={qs[f.key as keyof typeof qs]} onChange={(e) => setQs({ ...qs, [f.key]: parseFloat(e.target.value) || 0 })} className={inputCls} style={inputSty} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#8b9ab5" }}>Material</label>
                <div className="relative">
                  <select value={qs.material} onChange={(e) => setQs({ ...qs, material: e.target.value })} className={inputCls + " appearance-none pr-8"} style={inputSty}>
                    <option value="cu">Kupfer (Cu)</option>
                    <option value="al">Aluminium (Al)</option>
                  </select>
                  {selectIcon}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#8b9ab5" }}>System</label>
                <div className="relative">
                  <select value={qs.phasig} onChange={(e) => setQs({ ...qs, phasig: parseInt(e.target.value) })} className={inputCls + " appearance-none pr-8"} style={inputSty}>
                    <option value={1}>Einphasig (230V AC)</option>
                    <option value={3}>Dreiphasig (400V AC)</option>
                  </select>
                  {selectIcon}
                </div>
              </div>
              <button onClick={() => setQsResult(berechneQuerschnitt(qs.strom, qs.laenge, qs.spannung, qs.material, qs.phasig))} className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg,#00c6ff,#0099cc)", color: "#0d1b2e" }}>
                Berechnen
              </button>
            </div>
            {qsResult !== null && (
              <div className="rounded-xl p-6 flex flex-col justify-center items-center gap-4" style={{ background: "#112240", border: "1px solid #00c6ff33" }}>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8b9ab5" }}>Mindest-Querschnitt</p>
                <p className="text-5xl font-bold" style={{ color: "#00c6ff", fontFamily: "var(--font-syne)" }}>{qsResult} mm²</p>
                <p className="text-xs text-center" style={{ color: "#8b9ab5" }}>Nächster Normwert nach DIN VDE 0298-4</p>
                <div className="w-full p-3 rounded-lg" style={{ background: "#0d1b2e", border: "1px solid #1e3a5f" }}>
                  <p className="text-xs" style={{ color: "#8b9ab5" }}>
                    Empfehlung: {qs.material === "cu" ? "NYM-J" : "NAYY"}{" "}
                    {qs.phasig === 3 ? `3x${qsResult}mm²` : `2x${qsResult}mm²`}
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Absicherung ── */}
        {active === "absicherung" && (
          <>
            <div className="rounded-xl p-6 space-y-4" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
              <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
                <Calculator size={16} style={{ color: "#f5a623" }} /> Absicherung berechnen
              </h2>
              <p className="text-xs" style={{ color: "#8b9ab5" }}>Belastbarkeit nach VDE 0298-4 (Cu, PVC-isoliert)</p>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#8b9ab5" }}>Leitungsquerschnitt (mm²)</label>
                <div className="relative">
                  <select value={abs.querschnitt} onChange={(e) => setAbs({ ...abs, querschnitt: parseFloat(e.target.value) })} className={inputCls + " appearance-none pr-8"} style={inputSty}>
                    {[1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120].map((v) => (
                      <option key={v} value={v}>{v} mm²</option>
                    ))}
                  </select>
                  {selectIcon}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#8b9ab5" }}>Verlegeart</label>
                <div className="relative">
                  <select value={abs.verlegeart} onChange={(e) => setAbs({ ...abs, verlegeart: e.target.value })} className={inputCls + " appearance-none pr-8"} style={inputSty}>
                    <option value="A">A — In Rohr in isolierter Wand</option>
                    <option value="B">B — In Rohr auf Wand / in Schlitz</option>
                    <option value="C">C — Direkt auf Wand / Kabelkanal</option>
                  </select>
                  {selectIcon}
                </div>
              </div>
              <button onClick={() => setAbsResult(berechneAbsicherung(abs.querschnitt, abs.verlegeart))} className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg,#f5a623,#c4841c)", color: "#0d1b2e" }}>
                Berechnen
              </button>
            </div>
            {absResult !== null && (
              <div className="rounded-xl p-6 flex flex-col justify-center items-center gap-4" style={{ background: "#112240", border: "1px solid #f5a62333" }}>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8b9ab5" }}>Max. Belastbarkeit</p>
                <p className="text-5xl font-bold" style={{ color: "#f5a623", fontFamily: "var(--font-syne)" }}>{absResult} A</p>
                <p className="text-xs text-center" style={{ color: "#8b9ab5" }}>
                  Empfohlene Absicherung: LS-Schalter oder Schmelzsicherung ≤ {absResult} A
                </p>
                <div className="w-full p-3 rounded-lg" style={{ background: "#0d1b2e", border: "1px solid #1e3a5f" }}>
                  <div className="flex items-start gap-2">
                    <AlertCircle size={13} style={{ color: "#f5a623", flexShrink: 0, marginTop: 1 }} />
                    <p className="text-xs" style={{ color: "#8b9ab5" }}>
                      Reduktionsfaktoren bei Häufung (VDE 0298-4 Tab. B.52.17) nicht berücksichtigt.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Spannungsfall ── */}
        {active === "spannungsfall" && (
          <>
            <div className="rounded-xl p-6 space-y-4" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
              <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
                <Calculator size={16} style={{ color: "#22c55e" }} /> Spannungsfall berechnen
              </h2>
              <p className="text-xs" style={{ color: "#8b9ab5" }}>ΔU = (√3 bzw. 2) · ρ · l · I / A — max. 3% nach VDE 0100-520</p>
              {[
                { label: "Strom (A)", key: "strom" },
                { label: "Leitungslänge (m)", key: "laenge" },
                { label: "Nennspannung (V)", key: "spannung" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#8b9ab5" }}>{f.label}</label>
                  <input type="number" min={0.1} value={sf[f.key as keyof typeof sf]} onChange={(e) => setSf({ ...sf, [f.key]: parseFloat(e.target.value) || 0 })} className={inputCls} style={inputSty} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#8b9ab5" }}>Querschnitt (mm²)</label>
                <div className="relative">
                  <select value={sf.querschnitt} onChange={(e) => setSf({ ...sf, querschnitt: parseFloat(e.target.value) })} className={inputCls + " appearance-none pr-8"} style={inputSty}>
                    {[1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120].map((v) => (
                      <option key={v} value={v}>{v} mm²</option>
                    ))}
                  </select>
                  {selectIcon}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#8b9ab5" }}>Material</label>
                <div className="relative">
                  <select value={sf.material} onChange={(e) => setSf({ ...sf, material: e.target.value })} className={inputCls + " appearance-none pr-8"} style={inputSty}>
                    <option value="cu">Kupfer (Cu)</option>
                    <option value="al">Aluminium (Al)</option>
                  </select>
                  {selectIcon}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#8b9ab5" }}>System</label>
                <div className="relative">
                  <select value={sf.phasig} onChange={(e) => setSf({ ...sf, phasig: parseInt(e.target.value) })} className={inputCls + " appearance-none pr-8"} style={inputSty}>
                    <option value={1}>Einphasig</option>
                    <option value={3}>Dreiphasig</option>
                  </select>
                  {selectIcon}
                </div>
              </div>
              <button onClick={() => setSfResult(berechneSpannungsfall(sf.strom, sf.laenge, sf.querschnitt, sf.material, sf.phasig, sf.spannung))} className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff" }}>
                Berechnen
              </button>
            </div>
            {sfResult !== null && (
              <div className="rounded-xl p-6 flex flex-col justify-center items-center gap-4" style={{ background: "#112240", border: `1px solid ${sfResult.prozent > 3 ? "#ef444433" : "#22c55e33"}` }}>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8b9ab5" }}>Spannungsfall</p>
                <p className="text-5xl font-bold" style={{ color: sfResult.prozent > 3 ? "#ef4444" : "#22c55e", fontFamily: "var(--font-syne)" }}>
                  {sfResult.prozent.toFixed(2)} %
                </p>
                <p className="text-sm font-medium" style={{ color: sfResult.prozent > 3 ? "#ef4444" : "#22c55e" }}>
                  = {sfResult.volt.toFixed(2)} V
                </p>
                <div className="w-full p-3 rounded-lg" style={{ background: "#0d1b2e", border: "1px solid #1e3a5f" }}>
                  {sfResult.prozent > 3 ? (
                    <div className="flex items-start gap-2">
                      <AlertCircle size={13} style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
                      <p className="text-xs" style={{ color: "#ef4444" }}>
                        Grenzwert 3% überschritten! Größeren Querschnitt oder kürzere Leitung wählen.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-center" style={{ color: "#22c55e" }}>
                      ✓ Innerhalb des zulässigen Grenzwerts (max. 3%)
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
