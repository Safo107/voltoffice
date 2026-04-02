import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "all"; // all | month | week

    const [kunden, angebote, projekte, zeiteintraege, rechnungen] = await Promise.all([
      db.collection("kunden").countDocuments(),
      db.collection("angebote").find({ status: { $in: ["draft", "sent"] } }).toArray(),
      db.collection("projekte").countDocuments({ status: "active" }),
      db.collection("zeiterfassung").find({}).toArray(),
      db.collection("rechnungen").find({}).toArray(),
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
      customerLimit: 5,
      offerCount: angebote.length,
      offerLimit: 3,
      projectCount: projekte,
      projectLimit: 3,
      hoursThisWeek,
      openOfferValue,
      totalRevenue,
      openInvoicesTotal,
      openInvoicesCount,
      totalHours,
      zeitkosten,
      gewinn: totalRevenue - zeitkosten,
    });
  } catch {
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}
