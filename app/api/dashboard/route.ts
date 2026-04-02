import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { withAuth } from "@/lib/withAuth";
import { getPlanLimits } from "@/lib/planLimits";
import { getUserPlan } from "@/lib/getUserPlan";

export const GET = withAuth(async (req, userId) => {
  try {
    console.log("[dashboard] UID:", userId);
    const db = await getDb();
    const plan = await getUserPlan(db, userId);
    const limits = getPlanLimits(plan);
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "all"; // all | month | week

    const [kunden, angebote, projekte, zeiteintraege, rechnungen] = await Promise.all([
      db.collection("kunden").countDocuments({ userId }),
      db.collection("angebote").find({ userId, status: { $in: ["draft", "sent"] } }).toArray(),
      db.collection("projekte").countDocuments({ userId, status: "active" }),
      db.collection("zeiterfassung").find({ userId }).toArray(),
      db.collection("rechnungen").find({ userId }).toArray(),
    ]);

    // Zeit-Filter
    const today = new Date();
    let filterFrom: Date | null = null;
    if (period === "week") {
      filterFrom = new Date(today);
      filterFrom.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
      filterFrom.setHours(0, 0, 0, 0);
    } else if (period === "month") {
      filterFrom = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    const inPeriod = (dateStr?: string) => {
      if (!filterFrom || !dateStr) return true;
      return new Date(dateStr) >= filterFrom;
    };

    // Offene Angebotssumme
    const openOfferValue = angebote.reduce((sum, a) => sum + (a.total || 0), 0);

    // Stunden diese Woche
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const hoursThisWeek = zeiteintraege
      .filter((e) => new Date(e.date) >= weekStart)
      .reduce((sum, e) => sum + (e.hours || 0), 0);

    // Rechnungen-Stats (period-filtered)
    const filteredRech = rechnungen.filter((r) => inPeriod(r.createdAt));
    const totalRevenue = filteredRech.reduce((sum, r) => sum + (r.total || 0), 0);
    const openInvoices = rechnungen.filter((r) => r.status === "offen" || r.status === "überfällig");
    const openInvoicesTotal = openInvoices.reduce((sum, r) => sum + (r.total || 0), 0);
    const openInvoicesCount = openInvoices.length;

    // Monatliche Einnahmen (bezahlt)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyRevenue = rechnungen
      .filter((r) => r.status === "bezahlt" && r.updatedAt && new Date(r.updatedAt) >= monthStart)
      .reduce((sum, r) => sum + (r.total || 0), 0);
    const paidInvoicesCount = rechnungen.filter((r) => r.status === "bezahlt").length;
    const overdueInvoicesCount = rechnungen.filter((r) => r.status === "überfällig").length;
    const paidTotal = rechnungen.filter((r) => r.status === "bezahlt").reduce((sum, r) => sum + (r.total || 0), 0);

    // Gesamtstunden (period-filtered)
    const totalHours = zeiteintraege
      .filter((e) => inPeriod(e.date))
      .reduce((sum, e) => sum + (e.hours || 0), 0);

    // Zeitkosten
    const zeitkosten = zeiteintraege
      .filter((e) => inPeriod(e.date))
      .reduce((sum, e) => sum + (e.hours || 0) * (e.stundensatz || 65), 0);

    return NextResponse.json({
      customerCount: kunden,
      customerLimit: limits.kunden === Infinity ? -1 : limits.kunden,
      offerCount: angebote.length,
      offerLimit: limits.angebote === Infinity ? -1 : limits.angebote,
      projectCount: projekte,
      projectLimit: limits.projekte === Infinity ? -1 : limits.projekte,
      plan,
      hoursThisWeek,
      openOfferValue,
      totalRevenue,
      openInvoicesTotal,
      openInvoicesCount,
      totalHours,
      zeitkosten,
      gewinn: totalRevenue - zeitkosten,
      monthlyRevenue,
      paidInvoicesCount,
      overdueInvoicesCount,
      paidTotal,
    });
  } catch {
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
});
