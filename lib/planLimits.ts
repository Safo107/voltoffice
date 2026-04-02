export type PlanName = "free" | "pro" | "business";

export interface PlanLimits {
  kunden: number;      // max Kunden
  angebote: number;    // max Angebote
  projekte: number;    // max Projekte
  rechnungen: number;  // max Rechnungen (0 = kein Zugriff)
  mitarbeiter: number; // max Mitarbeiter
}

const INF = Infinity;

const LIMITS: Record<PlanName, PlanLimits> = {
  free: {
    kunden:      5,
    angebote:    3,
    projekte:    3,
    rechnungen:  0,
    mitarbeiter: 0,
  },
  pro: {
    kunden:      INF,
    angebote:    INF,
    projekte:    INF,
    rechnungen:  INF,
    mitarbeiter: 0,   // mitarbeiter nur Business
  },
  business: {
    kunden:      INF,
    angebote:    INF,
    projekte:    INF,
    rechnungen:  INF,
    mitarbeiter: INF,
  },
};

export function getPlanLimits(plan: string): PlanLimits {
  return LIMITS[(plan as PlanName)] ?? LIMITS.free;
}

/** Returns a human-readable limit string (∞ or number) */
export function fmtLimit(n: number): string {
  return n === INF ? "∞" : String(n);
}

/** True if the user is within the limit (count < limit or limit = ∞) */
export function isWithinLimit(count: number, limit: number): boolean {
  return limit === INF || count < limit;
}
