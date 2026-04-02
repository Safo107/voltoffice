/**
 * VDE-Tabellen — Zentrale Config
 * Quelle: VDE 0298-4:2013-06, VDE 0100-520, VDE 0100-410, VDE 0102
 *
 * NICHT im Frontend hardcoden — immer aus diesem File importieren.
 * Bei Normänderung: nur diese Datei aktualisieren.
 */

export const CROSS_SECTIONS = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120] as const;
export type CrossSection = (typeof CROSS_SECTIONS)[number];

export const VERLEGEARTEN = ["A1", "A2", "B1", "B2", "C", "E"] as const;
export type Verlegeart = (typeof VERLEGEARTEN)[number];

export type Cores = 2 | 3;

// ─── IZ Grundwerte [A] ────────────────────────────────────────────────────────
// Cu, PVC 70°C — VDE 0298-4:2013
// 2 belastete Leiter (Tab. 1)
export const IZ_CU_PVC_2C: Record<Verlegeart, Record<CrossSection, number>> = {
  A1: { 1.5:15,   2.5:19.5, 4:26, 6:32, 10:44, 16:59,  25:73,  35:90,  50:110, 70:140, 95:170, 120:197 },
  A2: { 1.5:13.5, 2.5:18,   4:24, 6:31, 10:42, 16:56,  25:73,  35:89,  50:108, 70:136, 95:164, 120:188 },
  B1: { 1.5:17.5, 2.5:23,   4:30, 6:38, 10:52, 16:70,  25:86,  35:107, 50:130, 70:165, 95:200, 120:232 },
  B2: { 1.5:15.5, 2.5:20,   4:27, 6:34, 10:46, 16:62,  25:80,  35:99,  50:119, 70:151, 95:182, 120:210 },
  C:  { 1.5:19.5, 2.5:26,   4:34, 6:44, 10:60, 16:81,  25:103, 35:126, 50:154, 70:196, 95:238, 120:276 },
  E:  { 1.5:22,   2.5:30,   4:40, 6:51, 10:70, 16:94,  25:119, 35:147, 50:179, 70:229, 95:278, 120:322 },
};

// 3 belastete Leiter (Tab. 3)
export const IZ_CU_PVC_3C: Record<Verlegeart, Record<CrossSection, number>> = {
  A1: { 1.5:13.5, 2.5:18,   4:24, 6:30, 10:40, 16:54,  25:70,  35:85,  50:103, 70:130, 95:157, 120:181 },
  A2: { 1.5:12,   2.5:15.5, 4:21, 6:27, 10:36, 16:48,  25:62,  35:77,  50:93,  70:118, 95:142, 120:164 },
  B1: { 1.5:15.5, 2.5:21,   4:28, 6:36, 10:50, 16:68,  25:89,  35:110, 50:134, 70:171, 95:207, 120:239 },
  B2: { 1.5:13.5, 2.5:18,   4:24, 6:31, 10:42, 16:56,  25:73,  35:89,  50:108, 70:136, 95:164, 120:188 },
  C:  { 1.5:17.5, 2.5:24,   4:32, 6:41, 10:57, 16:76,  25:96,  35:119, 50:144, 70:184, 95:223, 120:259 },
  E:  { 1.5:19.5, 2.5:27,   4:36, 6:46, 10:63, 16:85,  25:112, 35:138, 50:168, 70:213, 95:258, 120:299 },
};

// Cu, XLPE 90°C — VDE 0298-4:2013
// 2 belastete Leiter (Tab. 2)
export const IZ_CU_XLPE_2C: Record<Verlegeart, Record<CrossSection, number>> = {
  A1: { 1.5:19,   2.5:25,   4:34, 6:43, 10:60, 16:80,  25:100, 35:123, 50:150, 70:192, 95:233, 120:271 },
  A2: { 1.5:17,   2.5:23,   4:31, 6:39, 10:54, 16:72,  25:94,  35:115, 50:140, 70:178, 95:215, 120:249 },
  B1: { 1.5:22,   2.5:29,   4:38, 6:48, 10:66, 16:89,  25:111, 35:137, 50:167, 70:213, 95:259, 120:300 },
  B2: { 1.5:19,   2.5:25,   4:33, 6:42, 10:58, 16:77,  25:101, 35:125, 50:151, 70:192, 95:232, 120:269 },
  C:  { 1.5:24,   2.5:33,   4:44, 6:56, 10:77, 16:103, 25:131, 35:162, 50:197, 70:251, 95:304, 120:352 },
  E:  { 1.5:26,   2.5:36,   4:49, 6:63, 10:86, 16:116, 25:149, 35:185, 50:225, 70:289, 95:352, 120:410 },
};

// 3 belastete Leiter (Tab. 4)
export const IZ_CU_XLPE_3C: Record<Verlegeart, Record<CrossSection, number>> = {
  A1: { 1.5:17,   2.5:23,   4:31, 6:39, 10:54, 16:73,  25:93,  35:113, 50:137, 70:174, 95:211, 120:245 },
  A2: { 1.5:15,   2.5:20,   4:27, 6:35, 10:48, 16:64,  25:83,  35:103, 50:125, 70:158, 95:191, 120:220 },
  B1: { 1.5:19,   2.5:25,   4:34, 6:43, 10:60, 16:80,  25:101, 35:126, 50:153, 70:196, 95:238, 120:276 },
  B2: { 1.5:16.5, 2.5:22,   4:30, 6:38, 10:52, 16:69,  25:90,  35:111, 50:133, 70:168, 95:201, 120:232 },
  C:  { 1.5:22,   2.5:30,   4:40, 6:51, 10:70, 16:94,  25:119, 35:147, 50:179, 70:229, 95:278, 120:322 },
  E:  { 1.5:24,   2.5:33,   4:45, 6:58, 10:80, 16:107, 25:138, 35:171, 50:209, 70:269, 95:328, 120:382 },
};

// Legacy-Aliase (3 belastete Leiter) — für Rückwärtskompatibilität
export const IZ_CU_PVC  = IZ_CU_PVC_3C;
export const IZ_CU_XLPE = IZ_CU_XLPE_3C;

// Aluminium-Korrekturfaktor (VDE 0298-4)
export const AL_FAKTOR = 0.78;

// ─── Temperaturfaktoren f1 ────────────────────────────────────────────────────
// Basis: 30°C Umgebung — VDE 0298-4:2013 Tab. B.52.14
export const TEMP_FAKTOREN_PVC: Record<number, number> = {
  10: 1.22, 15: 1.17, 20: 1.12, 25: 1.06,
  30: 1.00, 35: 0.94, 40: 0.87, 45: 0.79, 50: 0.71,
};
export const TEMP_FAKTOREN_XLPE: Record<number, number> = {
  10: 1.15, 15: 1.12, 20: 1.08, 25: 1.04,
  30: 1.00, 35: 0.96, 40: 0.91, 45: 0.87, 50: 0.82,
};

// ─── Häufungsfaktoren f2 ──────────────────────────────────────────────────────
// VDE 0298-4:2013 Tab. B.52.17 (mehrlagige Verlegung in der Luft)
export const HAEUFUNG_FAKTOREN: Record<number, number> = {
  1: 1.00, 2: 0.80, 3: 0.70, 4: 0.65, 5: 0.60,
  6: 0.57, 7: 0.54, 8: 0.52, 9: 0.50, 10: 0.48,
};

// ─── Standard LS-Schalter Nennströme (A) ─────────────────────────────────────
export const LS_NORMEN = [6, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250] as const;

// ─── LS-Schalter Auslösefaktoren ─────────────────────────────────────────────
export const LS_AUSLOES_FAKTOR: Record<string, number> = {
  B: 5,
  C: 10,
  D: 20,
};

// ─── Leitfähigkeiten κ [m/(Ω·mm²)] ──────────────────────────────────────────
export const KAPPA: Record<string, number> = {
  cu: 56,
  al: 35,
};

// ─── ENGINE-FUNKTIONEN ────────────────────────────────────────────────────────

export function getIz(
  qs: number,
  verlegeart: string,
  material: string,
  isolation: string,
  cores: Cores = 3
): number {
  const xlpe = isolation === "xlpe";
  const table = cores === 2
    ? (xlpe ? IZ_CU_XLPE_2C : IZ_CU_PVC_2C)
    : (xlpe ? IZ_CU_XLPE_3C : IZ_CU_PVC_3C);
  const base = (table[verlegeart as Verlegeart] as Record<number, number>)?.[qs] ?? 0;
  return material === "al" ? base * AL_FAKTOR : base;
}

export function getTempFaktor(temp: number, isolation: string): number {
  const temps = isolation === "xlpe" ? TEMP_FAKTOREN_XLPE : TEMP_FAKTOREN_PVC;
  const key = Math.round(temp / 5) * 5;
  return temps[key] ?? 1.0;
}

export function getHaeufungFaktor(n: number): number {
  return HAEUFUNG_FAKTOREN[Math.min(n, 10)] ?? 0.48;
}

export function berechneIb(
  leistung: number,
  spannung: number,
  cosPhi: number,
  phasig: number
): number {
  if (cosPhi <= 0 || spannung <= 0) return 0;
  return phasig === 3
    ? leistung / (Math.sqrt(3) * spannung * cosPhi)
    : leistung / (spannung * cosPhi);
}

export function berechneSpannungsfall(
  ib: number,
  laenge: number,
  querschnitt: number,
  material: string,
  phasig: number,
  spannung: number,
  cosPhi: number
): { deltaU: number; prozent: number } {
  const kappa = KAPPA[material] ?? 56;
  const k = phasig === 3 ? Math.sqrt(3) : 2;
  const deltaU = (k * laenge * ib * cosPhi) / (kappa * querschnitt);
  return { deltaU, prozent: (deltaU / spannung) * 100 };
}

export function magicFixQuerschnitt(
  ib: number,
  verlegeart: string,
  material: string,
  isolation: string,
  temp: number,
  haeufung: number,
  inNenn: number,
  cores: Cores = 3
): number | null {
  for (const qs of CROSS_SECTIONS) {
    const iz = getIz(qs, verlegeart, material, isolation, cores)
      * getTempFaktor(temp, isolation)
      * getHaeufungFaktor(haeufung);
    if (ib <= inNenn && inNenn <= iz) return qs;
  }
  return null;
}

export function magicFixSpannungsfall(
  ib: number,
  laenge: number,
  material: string,
  phasig: number,
  spannung: number,
  cosPhi: number,
  grenzwert: number
): number | null {
  for (const qs of CROSS_SECTIONS) {
    const { prozent } = berechneSpannungsfall(ib, laenge, qs, material, phasig, spannung, cosPhi);
    if (prozent <= grenzwert) return qs;
  }
  return null;
}

// ─── KURZSCHLUSSSTROM (VDE 0102 / IEC 60909) ─────────────────────────────────

export interface KurzschlussResult {
  zTrafo: number;    // Ω — Transformatorimpedanz
  zKabel: number;    // Ω — Kabelimpedanz (Hin+Rück)
  zGes: number;      // Ω — Gesamtimpedanz
  ikMaxTrafo: number; // kA — Ik'' direkt am Trafo
  ikMax: number;     // kA — Ik'' max am Kabelende (c=1.1)
  ikMin: number;     // kA — Ik'' min am Kabelende (c=0.95)
}

export function berechneKurzschlussstrom(
  un: number,      // V — Nennspannung (z.B. 400)
  sn: number,      // kVA — Trafoleistung
  ukProzent: number, // % — Kurzschlussspannung Trafo
  laenge: number,  // m — Kabellänge
  qs: number,      // mm² — Querschnitt
  material: string, // "cu"|"al"
  phasig: number   // 1|3
): KurzschlussResult {
  const snVA = sn * 1000;
  const kappa = KAPPA[material] ?? 56;

  // Transformatorimpedanz (vereinfacht, ohne X/R-Aufteilung)
  const zTrafo = (ukProzent / 100) * (un * un) / snVA;

  // Kabelimpedanz: R = L/(κ·A), X ≈ 0.08 mΩ/m pro Leiter
  // Hin+Rück (2 Leiter für 1-phasig, Hin für 3-phasig)
  const leitFaktor = phasig === 3 ? 1 : 2;
  const rKabel = (leitFaktor * laenge) / (kappa * qs);
  const xKabel = leitFaktor * 0.08e-3 * laenge;
  const zKabel = Math.sqrt(rKabel * rKabel + xKabel * xKabel);

  const zGes = zTrafo + zKabel;

  // Spannung gegen Erde (U0)
  const u0 = phasig === 3 ? un / Math.sqrt(3) : un;

  // Ik'' = c · U0 / Zk  (IEC 60909)
  const ikMaxTrafo = (1.1 * u0) / (zTrafo * 1000); // in kA
  const ikMax = (1.1 * u0) / (zGes * 1000);
  const ikMin = (0.95 * u0) / (zGes * 1000);

  return { zTrafo, zKabel, zGes, ikMaxTrafo, ikMax, ikMin };
}
