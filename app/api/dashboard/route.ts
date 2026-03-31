import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const [kunden, angebote, projekte, zeiteintraege] = await Promise.all([
      db.collection("kunden").countDocuments(),
      db.collection("angebote").find({ status: { $in: ["draft", "sent"] } }).toArray(),
      db.collection("projekte").countDocuments({ status: "active" }),
      db.collection("zeiterfassung").find({}).toArray(),
    ]);

    // Offene Angebotssumme
    const openOfferValue = angebote.reduce((sum, a) => sum + (a.total || 0), 0);

    // Stunden diese Woche
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const hoursThisWeek = zeiteintraege
      .filter((e) => new Date(e.date) >= weekStart)
      .reduce((sum, e) => sum + (e.hours || 0), 0);

    return NextResponse.json({
      customerCount: kunden,
      customerLimit: 5,
      offerCount: angebote.length,
      offerLimit: 3,
      projectCount: projekte,
      projectLimit: 3,
      hoursThisWeek,
      openOfferValue,
    });
  } catch {
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}
