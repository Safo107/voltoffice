"use client";

import { useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { usePro } from "@/context/ProContext";
import { useRouter } from "next/navigation";
import {
  Zap, Lock, Loader, AlertTriangle, CheckCircle, Wrench,
  ThumbsUp, ChevronDown, Check, X, ChevronRight,
} from "lucide-react";
import {
  CROSS_SECTIONS, LS_NORMEN, HAEUFUNG_FAKTOREN,
  getIz, getTempFaktor, getHaeufungFaktor,
  berechneIb, berechneSpannungsfall, berechneKurzschlussstrom,
  magicFixQuerschnitt, magicFixSpannungsfall as magicFixQuerschnittSpannungsfall,
  type Cores,
} from "@/lib/vde-tables";

// ═══════════════════════════════════════════════════════════════
//  UI-HILFSFUNKTIONEN
// ═══════════════════════════════════════════════════════════════

function Seg({ options, value, onChange }: {
  options: { val: string | number; label: string }[];
  value: string | number;
  onChange: (v: any) => void;
}) {
  return (
    <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid #1e3a5f" }}>
      {options.map((o) => (
        <button
          key={o.val}
          onClick={() => onChange(o.val)}
          className="flex-1 py-2.5 text-xs font-bold transition-all"
          style={{
            background: value === o.val ? "#00c6ff22" : "#0d1b2e",
            color: value === o.val ? "#00c6ff" : "#8b9ab5",
            borderRight: "1px solid #1e3a5f",
            minHeight: 48,
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function NumInput({ label, value, onChange, unit, step = 1, min = 0 }: {
  label: string; value: number; onChange: (v: number) => void;
  unit?: string; step?: number; min?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>
        {label}{unit && <span style={{ color: "#4a6fa5" }}> ({unit})</span>}
      </label>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        min={min}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
        style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3", minHeight: 48 }}
      />
    </div>
  );
}

function SelectInput({ label, value, onChange, options }: {
  label: string; value: string | number;
  onChange: (v: any) => void;
  options: { val: string | number; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none pr-8"
          style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3", minHeight: 48 }}
        >
          {options.map((o) => <option key={o.val} value={o.val}>{o.label}</option>)}
        </select>
        <ChevronDown size={14} style={{ color: "#4a6fa5", position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
      </div>
    </div>
  );
}

function AuslastungsBar({ wert, max, einheit, grenzWarnPct = 0.8 }: {
  wert: number; max: number; einheit: string; grenzWarnPct?: number;
}) {
  const pct = max > 0 ? Math.min(wert / max, 1) : 0;
  const farbe = pct >= 1 ? "#ef4444" : pct >= grenzWarnPct ? "#f5a623" : "#22c55e";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5" style={{ color: "#8b9ab5" }}>
        <span>Auslastung</span>
        <span style={{ color: farbe, fontWeight: 700 }}>{(pct * 100).toFixed(1)}%</span>
      </div>
      <div className="w-full rounded-full h-3 overflow-hidden" style={{ background: "#1e3a5f" }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct * 100}%`, background: farbe }}
        />
      </div>
      <div className="flex justify-between text-xs mt-1" style={{ color: "#4a6fa5" }}>
        <span>{wert.toFixed(1)} {einheit}</span>
        <span>{max.toFixed(1)} {einheit}</span>
      </div>
    </div>
  );
}

function MagicFixBtn({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all hover:opacity-90"
      style={{ background: "linear-gradient(135deg,#f5a623,#c4841c)", color: "#0d1b2e", minHeight: 48 }}
    >
      <Wrench size={16} /><Zap size={14} /> Auto-Fix: {text}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
//  HAUPTKOMPONENTE
// ═══════════════════════════════════════════════════════════════

type Tab = "leitungsschutz" | "spannungsfall" | "abschalt" | "kurzschluss";

export default function VdeRechnerPage() {
  const { isPro, loadingPro } = usePro();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("leitungsschutz");

  // ── Modul 1: Leitungsschutz ─────────────────────────────────
  const [phasig, setPhasig] = useState<number>(3);
  const [leistung, setLeistung] = useState<number>(3000);
  const [spannung, setSpannung] = useState<number>(400);
  const [cosPhi, setCosPhi] = useState<number>(0.9);
  const [material, setMaterial] = useState<string>("cu");
  const [isolation, setIsolation] = useState<string>("pvc");
  const [verlegeart, setVerlegeart] = useState<string>("B2");
  const [temperatur, setTemperatur] = useState<number>(30);
  const [haeufung, setHaeufung] = useState<number>(1);
  const [inNenn, setInNenn] = useState<number>(16);
  const [manualQs, setManualQs] = useState<number>(2.5);
  const [fixedQs, setFixedQs] = useState<number | null>(null);

  // ── Modul 2: Spannungsfall ──────────────────────────────────
  const [sfLaenge, setSfLaenge] = useState<number>(30);
  const [sfQs, setSfQs] = useState<number>(2.5);
  const [sfFixQs, setSfFixQs] = useState<number | null>(null);
  const [sfGrenzwert, setSfGrenzwert] = useState<number>(3);

  // ── Belastete Leiter (cores) ────────────────────────────────
  const [belasteteLeiter, setBelasteteLeiter] = useState<Cores>(3);

  // ── Modul 3: Abschaltbedingung ──────────────────────────────
  const [u0, setU0] = useState<number>(230);
  const [lsTyp, setLsTyp] = useState<string>("B");
  const [lsIn, setLsIn] = useState<number>(16);
  const [zsReal, setZsReal] = useState<number>(0.8);
  const [abLaenge, setAbLaenge] = useState<number>(50);
  const [abQs, setAbQs] = useState<number>(2.5);
  const [abMat, setAbMat] = useState<string>("cu");

  // ── Modul 4: Kurzschlussstrom ───────────────────────────────
  const [kkPhasig, setKkPhasig] = useState<number>(3);
  const [kkSn, setKkSn] = useState<number>(250);
  const [kkUk, setKkUk] = useState<number>(4);
  const [kkLaenge, setKkLaenge] = useState<number>(50);
  const [kkQs, setKkQs] = useState<number>(16);
  const [kkMat, setKkMat] = useState<string>("cu");
  const [kkIcn, setKkIcn] = useState<number>(10);

  // ── Live-Berechnungen Modul 1 ───────────────────────────────
  const lsResult = useMemo(() => {
    const ib = berechneIb(leistung, spannung, cosPhi, phasig);
    const qs = fixedQs ?? manualQs;
    const izBase = getIz(qs, verlegeart, material, isolation, belasteteLeiter);
    const f1 = getTempFaktor(temperatur, isolation);
    const f2 = getHaeufungFaktor(haeufung);
    const iz = izBase * f1 * f2;
    const ok = ib <= inNenn && inNenn <= iz;
    const fix = ok ? null : magicFixQuerschnitt(ib, verlegeart, material, isolation, temperatur, haeufung, inNenn, belasteteLeiter);
    return { ib, iz, izBase, f1, f2, qs, ok, fix };
  }, [leistung, spannung, cosPhi, phasig, manualQs, fixedQs, verlegeart, material, isolation, temperatur, haeufung, inNenn, belasteteLeiter]);

  // ── Live-Berechnungen Modul 2 ───────────────────────────────
  const sfResult = useMemo(() => {
    const ib = berechneIb(leistung, spannung, cosPhi, phasig);
    const qs = sfFixQs ?? sfQs;
    const { deltaU, prozent } = berechneSpannungsfall(ib, sfLaenge, qs, material, phasig, spannung, cosPhi);
    const ok = prozent <= sfGrenzwert;
    const fix = ok ? null : magicFixQuerschnittSpannungsfall(ib, sfLaenge, material, phasig, spannung, cosPhi, sfGrenzwert);
    return { ib, deltaU, prozent, qs, ok, fix };
  }, [leistung, spannung, cosPhi, phasig, sfQs, sfFixQs, sfLaenge, sfGrenzwert, material]);

  // ── Live-Berechnungen Modul 3 ───────────────────────────────
  const abResult = useMemo(() => {
    const faktor: Record<string, number> = { B: 5, C: 10, D: 20 };
    const ia = lsIn * (faktor[lsTyp] ?? 5);
    const zsZul = u0 / ia;
    // Schleifenwiderstand aus Länge + Querschnitt berechnen (Hin- und Rückleiter)
    const rho20 = abMat === "cu" ? 0.0178 : 0.0282;
    const zsCalc = (2 * abLaenge * rho20) / abQs;
    const zsGesamt = zsReal > 0 ? zsReal : zsCalc;
    const ok = zsGesamt <= zsZul;
    return { ia, zsZul, zsGesamt, ok };
  }, [u0, lsTyp, lsIn, zsReal, abLaenge, abQs, abMat]);

  // ── Live-Berechnungen Modul 4 ───────────────────────────────
  const kkResult = useMemo(() => {
    const un = kkPhasig === 3 ? 400 : 230;
    return berechneKurzschlussstrom(un, kkSn, kkUk, kkLaenge, kkQs, kkMat, kkPhasig);
  }, [kkPhasig, kkSn, kkUk, kkLaenge, kkQs, kkMat]);

  // ───────────────────────────────────────────────────────────
  if (loadingPro) {
    return (
      <DashboardLayout title="VDE-Rechner" subtitle="Lade…">
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
            <p className="text-sm" style={{ color: "#8b9ab5" }}>Leitungsschutz, Spannungsfall und Abschaltbedingungen nach VDE — live, reaktiv, mit Auto-Fix.</p>
          </div>
          <button onClick={() => router.push("/upgrade")} className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg,#f5a623,#c4841c)", color: "#0d1b2e" }}>
            <Zap size={16} /> Auf Pro upgraden
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const tabs = [
    { id: "leitungsschutz" as Tab, label: "① Leitungsschutz",    color: "#00c6ff" },
    { id: "spannungsfall"  as Tab, label: "② Spannungsfall",     color: "#22c55e" },
    { id: "abschalt"       as Tab, label: "③ Abschaltbedingung", color: "#f5a623" },
    { id: "kurzschluss"    as Tab, label: "④ Kurzschlussstrom",  color: "#a78bfa" },
  ];

  const card = { background: "#112240", border: "1px solid #1e3a5f", borderRadius: 16, padding: "1.5rem" };

  return (
    <DashboardLayout title="VDE-Rechner" subtitle="Live-Berechnung nach VDE 0298-4 / VDE 0100-520 / VDE 0100-410">
      {/* Disclaimer */}
      <div className="mb-6 px-4 py-3 rounded-xl text-xs flex items-start gap-2" style={{ background: "#f5a62310", border: "1px solid #f5a62330", color: "#8b9ab5" }}>
        <AlertTriangle size={13} style={{ color: "#f5a623", flexShrink: 0, marginTop: 1 }} />
        <span>Haftungsausschluss: Diese Ergebnisse dienen der Orientierung. Für rechtssichere Planungen ist eine Fachkraft verantwortlich. ElektroGenius übernimmt keine Haftung.</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
            style={{
              background: activeTab === t.id ? `${t.color}18` : "#112240",
              border: `1px solid ${activeTab === t.id ? `${t.color}55` : "#1e3a5f"}`,
              color: activeTab === t.id ? t.color : "#8b9ab5", minHeight: 48,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ MODUL 1: LEITUNGSSCHUTZ ══ */}
      {activeTab === "leitungsschutz" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Eingaben */}
          <div style={card} className="space-y-5">
            <div>
              <h3 className="text-sm font-bold mb-1" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>Leitungsschutz nach VDE 0298-4</h3>
              <p className="text-xs" style={{ color: "#4a6fa5" }}>Alle Felder reagieren live — kein Button nötig</p>
            </div>

            <div>
              <p className="text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>System</p>
              <Seg options={[{ val: 1, label: "1-phasig 230V" }, { val: 3, label: "3-phasig 400V" }]}
                value={phasig} onChange={(v: number) => { setPhasig(v); setSpannung(v === 3 ? 400 : 230); setFixedQs(null); }} />
            </div>

            <NumInput label="Bemessungsleistung" value={leistung} onChange={(v) => { setLeistung(v); setFixedQs(null); }} unit="W" step={100} />
            <NumInput label="Leistungsfaktor cos φ" value={cosPhi} onChange={(v) => { setCosPhi(Math.min(1, Math.max(0.1, v))); setFixedQs(null); }} step={0.01} min={0.1} />

            <div>
              <p className="text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Leitermaterial</p>
              <Seg options={[{ val: "cu", label: "Kupfer (Cu)" }, { val: "al", label: "Aluminium (Al)" }]}
                value={material} onChange={(v) => { setMaterial(v); setFixedQs(null); }} />
            </div>

            <div>
              <p className="text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Isolierung</p>
              <Seg options={[{ val: "pvc", label: "PVC 70°C" }, { val: "xlpe", label: "XLPE 90°C" }]}
                value={isolation} onChange={(v) => { setIsolation(v); setFixedQs(null); }} />
            </div>

            <SelectInput label="Verlegeart (VDE 0298-4)"
              value={verlegeart}
              onChange={(v: string) => { setVerlegeart(v); setFixedQs(null); }}
              options={[
                { val: "A1", label: "A1 — Einzelader in thermisch isolierter Wand" },
                { val: "A2", label: "A2 — Mehradr. Kabel in thermisch isolierter Wand" },
                { val: "B1", label: "B1 — Einzelader in Rohr auf/in Wand" },
                { val: "B2", label: "B2 — Mehradr. Kabel in Rohr auf/in Wand" },
                { val: "C",  label: "C — Direkt auf Wand / Kabelkanal" },
                { val: "E",  label: "E — Freie Luft / Kabelpritschen" },
              ]}
            />

            <div>
              <p className="text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Belastete Leiter</p>
              <Seg
                options={[{ val: 2, label: "2 Leiter (1-phasig)" }, { val: 3, label: "3 Leiter (3-phasig)" }]}
                value={belasteteLeiter}
                onChange={(v: number) => { setBelasteteLeiter(v as Cores); setFixedQs(null); }}
              />
            </div>

            <SelectInput label="Umgebungstemperatur"
              value={temperatur}
              onChange={(v: number) => { setTemperatur(Number(v)); setFixedQs(null); }}
              options={[10,15,20,25,30,35,40,45,50].map((t) => ({ val: t, label: `${t} °C` }))}
            />

            <SelectInput label="Häufung (Anz. gebündelte Kabel)"
              value={haeufung}
              onChange={(v: number) => { setHaeufung(Number(v)); setFixedQs(null); }}
              options={[1,2,3,4,5,6,7,8,9,10].map((n) => ({ val: n, label: `${n} Kabel (f₂ = ${getHaeufungFaktor(n)})` }))}
            />

            <SelectInput label="Querschnitt (manuell)"
              value={fixedQs ?? manualQs}
              onChange={(v: number) => { setManualQs(Number(v)); setFixedQs(null); }}
              options={CROSS_SECTIONS.map((q) => ({ val: q, label: `${q} mm²` }))}
            />

            <SelectInput label="Absicherung In"
              value={inNenn}
              onChange={(v: number) => { setInNenn(Number(v)); setFixedQs(null); }}
              options={LS_NORMEN.map((n) => ({ val: n, label: `${n} A` }))}
            />
          </div>

          {/* Ergebnisse */}
          <div className="space-y-4">
            {/* Betriebsstrom */}
            <div style={card}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#4a6fa5" }}>Betriebsstrom Ib</p>
              <p className="text-4xl font-bold" style={{ color: "#00c6ff", fontFamily: "var(--font-syne)" }}>
                {lsResult.ib.toFixed(2)} A
              </p>
              <p className="text-xs mt-1" style={{ color: "#4a6fa5" }}>
                {phasig === 3 ? `P / (√3 · ${spannung}V · ${cosPhi})` : `P / (${spannung}V · ${cosPhi})`}
              </p>
            </div>

            {/* IZ mit Faktoren */}
            <div style={card}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#4a6fa5" }}>Strombelastbarkeit Iz</p>
              <p className="text-4xl font-bold" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
                {lsResult.iz.toFixed(1)} A
              </p>
              <div className="mt-3 space-y-1 text-xs" style={{ color: "#4a6fa5" }}>
                <div className="flex justify-between"><span>Grundwert Ir ({lsResult.qs} mm², {verlegeart})</span><span>{lsResult.izBase.toFixed(1)} A</span></div>
                <div className="flex justify-between"><span>Temperaturfaktor f₁ ({temperatur}°C)</span><span>× {lsResult.f1.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Häufungsfaktor f₂ ({haeufung} Kabel)</span><span>× {lsResult.f2.toFixed(2)}</span></div>
              </div>
              <div className="mt-4">
                <AuslastungsBar wert={lsResult.ib} max={lsResult.iz} einheit="A" />
              </div>
            </div>

            {/* Validierung Ib ≤ In ≤ Iz */}
            <div style={{ ...card, border: `1px solid ${lsResult.ok ? "#22c55e44" : "#ef444444"}` }}>
              <div className="flex items-center gap-2 mb-3">
                {lsResult.ok
                  ? <CheckCircle size={16} style={{ color: "#22c55e" }} />
                  : <AlertTriangle size={16} style={{ color: "#ef4444" }} />}
                <p className="text-sm font-bold" style={{ color: lsResult.ok ? "#22c55e" : "#ef4444", fontFamily: "var(--font-syne)" }}>
                  {lsResult.ok ? "VDE-Bedingung erfüllt" : "VDE-Bedingung verletzt!"}
                </p>
              </div>
              <p className="text-xs font-mono" style={{ color: "#8b9ab5" }}>
                Ib ({lsResult.ib.toFixed(1)} A) ≤ In ({inNenn} A) ≤ Iz ({lsResult.iz.toFixed(1)} A)
              </p>
              <p className="text-xs mt-1 flex items-center gap-2" style={{ color: "#4a6fa5" }}>
                <span className="flex items-center gap-1">Ib ≤ In: {lsResult.ib <= inNenn ? <Check size={11} style={{ color: "#22c55e" }} /> : <X size={11} style={{ color: "#ef4444" }} />}</span>
                <span>|</span>
                <span className="flex items-center gap-1">In ≤ Iz: {inNenn <= lsResult.iz ? <Check size={11} style={{ color: "#22c55e" }} /> : <X size={11} style={{ color: "#ef4444" }} />}</span>
              </p>
            </div>

            {/* Magic Fix */}
            {!lsResult.ok && lsResult.fix && (
              <div style={{ ...card, background: "#f5a62310", border: "1px solid #f5a62330" }}>
                <p className="text-xs mb-3" style={{ color: "#f5a623" }}>
                  Querschnitt zu gering — min. {lsResult.fix} mm² für diese Bedingungen erforderlich.
                </p>
                <MagicFixBtn
                  text={`Querschnitt auf ${lsResult.fix} mm² erhöhen`}
                  onClick={() => setFixedQs(lsResult.fix!)}
                />
              </div>
            )}

            {fixedQs && (
              <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl" style={{ background: "#22c55e10", border: "1px solid #22c55e30", color: "#22c55e" }}>
                <ThumbsUp size={13} />
                Auto-Fix aktiv: {fixedQs} mm² gewählt
                <button onClick={() => setFixedQs(null)} className="ml-auto text-xs underline" style={{ color: "#4a6fa5" }}>Zurücksetzen</button>
              </div>
            )}

            {/* Kabelempfehlung */}
            <div style={card}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#4a6fa5" }}>Kabelempfehlung</p>
              <p className="text-sm font-bold" style={{ color: "#e6edf3" }}>
                {material === "cu" ? "NYM-J" : "NAYY"}{" "}
                {phasig === 3 ? `5x${lsResult.qs}` : `3x${lsResult.qs}`} mm²
              </p>
              <p className="text-xs mt-1" style={{ color: "#4a6fa5" }}>LS-Schalter ≤ {inNenn} A</p>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODUL 2: SPANNUNGSFALL ══ */}
      {activeTab === "spannungsfall" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div style={card} className="space-y-5">
            <div>
              <h3 className="text-sm font-bold mb-1" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>Spannungsfall nach VDE 0100-520</h3>
              <p className="text-xs" style={{ color: "#4a6fa5" }}>Betriebsstrom aus Modul 1 übernommen</p>
            </div>

            <div className="px-3 py-2 rounded-xl text-xs" style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#4a6fa5" }}>
              Ib = {sfResult.ib.toFixed(2)} A (aus Modul 1: {leistung} W, {phasig === 3 ? "3~" : "1~"}, cos φ {cosPhi})
            </div>

            <NumInput label="Leitungslänge" value={sfLaenge} onChange={(v) => { setSfLaenge(v); setSfFixQs(null); }} unit="m" />

            <SelectInput label="Querschnitt"
              value={sfFixQs ?? sfQs}
              onChange={(v: number) => { setSfQs(Number(v)); setSfFixQs(null); }}
              options={CROSS_SECTIONS.map((q) => ({ val: q, label: `${q} mm²` }))}
            />

            <SelectInput label="Grenzwert ΔU"
              value={sfGrenzwert}
              onChange={(v: number) => { setSfGrenzwert(Number(v)); setSfFixQs(null); }}
              options={[
                { val: 3, label: "3 % — Hausinstallation, Beleuchtung" },
                { val: 4, label: "4 % — allgemein (VDE 0100-520)" },
                { val: 5, label: "5 % — Motoren, industrie" },
              ]}
            />

            <div className="px-3 py-2 rounded-xl text-xs space-y-1" style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#4a6fa5" }}>
              <div>κ (Leitfähigkeit): {material === "cu" ? "56 m/Ω·mm²" : "35 m/Ω·mm²"} ({material === "cu" ? "Kupfer" : "Aluminium"})</div>
              <div>Formel: ΔU = {phasig === 3 ? "√3" : "2"} · L · Ib · cos φ / (κ · A)</div>
            </div>
          </div>

          <div className="space-y-4">
            <div style={card}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#4a6fa5" }}>Spannungsfall</p>
              <p className="text-4xl font-bold" style={{ color: sfResult.prozent > sfGrenzwert ? "#ef4444" : "#22c55e", fontFamily: "var(--font-syne)" }}>
                {sfResult.prozent.toFixed(2)} %
              </p>
              <p className="text-sm mt-1" style={{ color: "#8b9ab5" }}>= {sfResult.deltaU.toFixed(3)} V</p>
              <div className="mt-4">
                <AuslastungsBar wert={sfResult.prozent} max={sfGrenzwert} einheit="%" grenzWarnPct={0.8} />
              </div>
            </div>

            <div style={{ ...card, border: `1px solid ${sfResult.ok ? "#22c55e44" : "#ef444444"}` }}>
              <div className="flex items-center gap-2 mb-2">
                {sfResult.ok
                  ? <CheckCircle size={16} style={{ color: "#22c55e" }} />
                  : <AlertTriangle size={16} style={{ color: "#ef4444" }} />}
                <p className="text-sm font-bold" style={{ color: sfResult.ok ? "#22c55e" : "#ef4444" }}>
                  {sfResult.ok ? `ΔU ≤ ${sfGrenzwert}% — Norm erfüllt` : `ΔU > ${sfGrenzwert}% — Grenzwert überschritten!`}
                </p>
              </div>
              <p className="text-xs" style={{ color: "#4a6fa5" }}>
                {sfResult.prozent.toFixed(2)}% von max. {sfGrenzwert}%
              </p>
            </div>

            {!sfResult.ok && sfResult.fix && (
              <div style={{ ...card, background: "#f5a62310", border: "1px solid #f5a62330" }}>
                <p className="text-xs mb-3" style={{ color: "#f5a623" }}>
                  Querschnitt zu gering für {sfLaenge} m Leitungslänge.
                </p>
                <MagicFixBtn
                  text={`Querschnitt auf ${sfResult.fix} mm² erhöhen`}
                  onClick={() => setSfFixQs(sfResult.fix!)}
                />
              </div>
            )}

            {sfFixQs && (
              <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl" style={{ background: "#22c55e10", border: "1px solid #22c55e30", color: "#22c55e" }}>
                <ThumbsUp size={13} />
                Auto-Fix aktiv: {sfFixQs} mm² gewählt
                <button onClick={() => setSfFixQs(null)} className="ml-auto text-xs underline" style={{ color: "#4a6fa5" }}>Zurücksetzen</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ MODUL 4: KURZSCHLUSSSTROM ══ */}
      {activeTab === "kurzschluss" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div style={card} className="space-y-5">
            <div>
              <h3 className="text-sm font-bold mb-1" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>Kurzschlussstrom nach VDE 0102 / IEC 60909</h3>
              <p className="text-xs" style={{ color: "#4a6fa5" }}>Prospektiver Kurzschlussstrom Ik'' am Kabelende</p>
            </div>

            <div>
              <p className="text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Netz / System</p>
              <Seg options={[{ val: 3, label: "3-phasig 400 V" }, { val: 1, label: "1-phasig 230 V" }]}
                value={kkPhasig} onChange={(v: number) => setKkPhasig(v)} />
            </div>

            <NumInput label="Trafoleistung Sn" value={kkSn} onChange={setKkSn} unit="kVA" step={25} min={25} />
            <NumInput label="Kurzschlussspannung uk" value={kkUk} onChange={setKkUk} unit="%" step={0.5} min={1} />

            <div className="border-t pt-4" style={{ borderColor: "#1e3a5f" }}>
              <p className="text-xs font-semibold mb-3" style={{ color: "#8b9ab5" }}>Kabelstrecke</p>
              <div className="space-y-3">
                <NumInput label="Kabellänge" value={kkLaenge} onChange={setKkLaenge} unit="m" />
                <SelectInput label="Querschnitt" value={kkQs} onChange={(v: number) => setKkQs(Number(v))}
                  options={CROSS_SECTIONS.map((q) => ({ val: q, label: `${q} mm²` }))} />
                <div>
                  <p className="text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Leitermaterial</p>
                  <Seg options={[{ val: "cu", label: "Cu" }, { val: "al", label: "Al" }]}
                    value={kkMat} onChange={setKkMat} />
                </div>
              </div>
            </div>

            <NumInput label="Ausschaltvermögen LS-Schalter Icn" value={kkIcn} onChange={setKkIcn} unit="kA" step={1} min={1} />

            <div className="px-3 py-2 rounded-xl text-xs space-y-1" style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#4a6fa5" }}>
              <div>Zk,Trafo = (uk / 100) · Un² / Sn</div>
              <div>Zk,Kabel = √(R² + X²), X ≈ 0,08 mΩ/m</div>
              <div>Ik'' = c · U₀ / Zges (c=1,1 max / c=0,95 min)</div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Impedanzen */}
            <div style={card}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#4a6fa5" }}>Impedanzen</p>
              <div className="space-y-2">
                {[
                  ["Trafo Zk", (kkResult.zTrafo * 1000).toFixed(2) + " mΩ"],
                  ["Kabel Zl", (kkResult.zKabel * 1000).toFixed(2) + " mΩ"],
                  ["Gesamt Zges", (kkResult.zGes * 1000).toFixed(2) + " mΩ"],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-xs" style={{ color: "#8b9ab5" }}>{label}</span>
                    <span className="text-sm font-bold" style={{ color: "#e6edf3" }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ik am Trafo */}
            <div style={card}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#4a6fa5" }}>Ik'' direkt am Trafo</p>
              <p className="text-3xl font-bold" style={{ color: "#a78bfa", fontFamily: "var(--font-syne)" }}>
                {kkResult.ikMaxTrafo.toFixed(2)} kA
              </p>
            </div>

            {/* Ik am Kabelende */}
            <div style={card}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#4a6fa5" }}>Ik'' am Kabelende ({kkLaenge} m)</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: "#8b9ab5" }}>Ik'' max (c=1,1)</span>
                  <span className="text-2xl font-bold" style={{ color: "#a78bfa", fontFamily: "var(--font-syne)" }}>{kkResult.ikMax.toFixed(2)} kA</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: "#8b9ab5" }}>Ik'' min (c=0,95)</span>
                  <span className="text-lg font-bold" style={{ color: "#e6edf3" }}>{kkResult.ikMin.toFixed(2)} kA</span>
                </div>
              </div>
              <div className="mt-4">
                <AuslastungsBar wert={kkResult.ikMax} max={kkIcn} einheit="kA" grenzWarnPct={0.8} />
              </div>
            </div>

            {/* LS-Schalter Eignung */}
            <div style={{ ...card, border: `1px solid ${kkResult.ikMax <= kkIcn ? "#22c55e44" : "#ef444444"}` }}>
              <div className="flex items-center gap-2 mb-2">
                {kkResult.ikMax <= kkIcn
                  ? <CheckCircle size={16} style={{ color: "#22c55e" }} />
                  : <AlertTriangle size={16} style={{ color: "#ef4444" }} />}
                <p className="text-sm font-bold" style={{ color: kkResult.ikMax <= kkIcn ? "#22c55e" : "#ef4444" }}>
                  {kkResult.ikMax <= kkIcn
                    ? `LS-Schalter ${kkIcn} kA geeignet`
                    : `LS-Schalter ${kkIcn} kA NICHT ausreichend!`}
                </p>
              </div>
              <p className="text-xs font-mono" style={{ color: "#8b9ab5" }}>
                Ik'' ({kkResult.ikMax.toFixed(2)} kA) {kkResult.ikMax <= kkIcn ? "≤" : ">"} Icn ({kkIcn} kA)
              </p>
              {kkResult.ikMax > kkIcn && (
                <p className="text-xs mt-2" style={{ color: "#ef4444" }}>
                  <ChevronRight size={12} className="inline mr-0.5" />LS-Schalter mit Icn ≥ {Math.ceil(kkResult.ikMax)} kA verwenden
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ MODUL 3: ABSCHALTBEDINGUNG ══ */}
      {activeTab === "abschalt" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div style={card} className="space-y-5">
            <div>
              <h3 className="text-sm font-bold mb-1" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>Abschaltbedingung nach VDE 0100-410</h3>
              <p className="text-xs" style={{ color: "#4a6fa5" }}>Personenschutz — Abschaltung in ≤ 0,4 s</p>
            </div>

            <NumInput label="Nennspannung gegen Erde U₀" value={u0} onChange={setU0} unit="V" />

            <div>
              <p className="text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>LS-Schalter Charakteristik</p>
              <Seg options={[{ val: "B", label: "Typ B (×5)" }, { val: "C", label: "Typ C (×10)" }, { val: "D", label: "Typ D (×20)" }]}
                value={lsTyp} onChange={setLsTyp} />
            </div>

            <SelectInput label="Nennstrom In"
              value={lsIn}
              onChange={(v: number) => setLsIn(Number(v))}
              options={LS_NORMEN.map((n) => ({ val: n, label: `${n} A` }))}
            />

            <div className="border-t pt-4" style={{ borderColor: "#1e3a5f" }}>
              <p className="text-xs font-semibold mb-3" style={{ color: "#8b9ab5" }}>Schleifenwiderstand berechnen</p>
              <div className="space-y-3">
                <NumInput label="Leitungslänge" value={abLaenge} onChange={setAbLaenge} unit="m" />
                <SelectInput label="Querschnitt" value={abQs} onChange={(v: number) => setAbQs(Number(v))}
                  options={CROSS_SECTIONS.map((q) => ({ val: q, label: `${q} mm²` }))} />
                <div>
                  <p className="text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Leitermaterial</p>
                  <Seg options={[{ val: "cu", label: "Cu" }, { val: "al", label: "Al" }]}
                    value={abMat} onChange={setAbMat} />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div style={card}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#4a6fa5" }}>Auslösestrom Ia</p>
              <p className="text-4xl font-bold" style={{ color: "#f5a623", fontFamily: "var(--font-syne)" }}>
                {abResult.ia} A
              </p>
              <p className="text-xs mt-1" style={{ color: "#4a6fa5" }}>
                Typ {lsTyp}: In × {lsTyp === "B" ? 5 : lsTyp === "C" ? 10 : 20} = {lsIn} × {lsTyp === "B" ? 5 : lsTyp === "C" ? 10 : 20}
              </p>
            </div>

            <div style={card}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#4a6fa5" }}>Schleifenwiderstände</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: "#8b9ab5" }}>Zulässig Zs,zul = U₀ / Ia</span>
                  <span className="text-sm font-bold" style={{ color: "#22c55e" }}>{abResult.zsZul.toFixed(3)} Ω</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: "#8b9ab5" }}>Berechnet Zs (2·L·ρ/A)</span>
                  <span className="text-sm font-bold" style={{ color: "#e6edf3" }}>{abResult.zsGesamt.toFixed(3)} Ω</span>
                </div>
              </div>
              <div className="mt-4">
                <AuslastungsBar wert={abResult.zsGesamt} max={abResult.zsZul} einheit="Ω" />
              </div>
            </div>

            <div style={{ ...card, border: `1px solid ${abResult.ok ? "#22c55e44" : "#ef444444"}` }}>
              <div className="flex items-center gap-2 mb-2">
                {abResult.ok
                  ? <CheckCircle size={16} style={{ color: "#22c55e" }} />
                  : <AlertTriangle size={16} style={{ color: "#ef4444" }} />}
                <p className="text-sm font-bold" style={{ color: abResult.ok ? "#22c55e" : "#ef4444" }}>
                  {abResult.ok ? "Abschaltbedingung erfüllt" : "Abschaltbedingung NICHT erfüllt!"}
                </p>
              </div>
              <p className="text-xs font-mono" style={{ color: "#8b9ab5" }}>
                Zs ({abResult.zsGesamt.toFixed(3)} Ω) {abResult.ok ? "≤" : ">"} Zs,zul ({abResult.zsZul.toFixed(3)} Ω)
              </p>
              {!abResult.ok && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs" style={{ color: "#f5a623" }}>Maßnahmen:</p>
                  <p className="text-xs flex items-center gap-1" style={{ color: "#8b9ab5" }}><ChevronRight size={12} />Querschnitt erhöhen (senkt Zs)</p>
                  <p className="text-xs flex items-center gap-1" style={{ color: "#8b9ab5" }}><ChevronRight size={12} />Leitungslänge reduzieren</p>
                  {lsTyp === "C" && <p className="text-xs flex items-center gap-1" style={{ color: "#8b9ab5" }}><ChevronRight size={12} />LS-Typ B statt C verwenden (Ia halbiert sich)</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
