import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { withAuth } from "@/lib/withAuth";

// DATEV EXTF CSV-Format (vereinfacht) für Steuerberater
export const GET = withAuth(async (req, userId) => {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "rechnungen"; // rechnungen | angebote

    console.log(`[DATEV] UID: ${userId}, type: ${type}`);

    const db = await getDb();
    const collection = type === "angebote" ? "angebote" : "rechnungen";
    const filter: Record<string, unknown> = { userId };
    // For DATEV export, only include finalized invoices (paid or sent)
    if (type === "rechnungen") {
      filter.status = { $in: ["bezahlt", "offen", "überfällig"] };
    }
    const docs = await db
      .collection(collection)
      .find(filter)
      .sort(type === "rechnungen"
        ? { invoiceYear: 1 as const, invoiceIndex: 1 as const }
        : { createdAt: 1 as const })
      .toArray();

    // DATEV EXTF Header (vereinfacht)
    const headerLine = `"EXTF";700;21;"Buchungsstapel";4;;"VoltOffice";"";"";"";"";"";"";"";"";""`;
    const columnLine = `Umsatz (ohne Soll/Haben-Kz);Soll/Haben-Kennzeichen;WKZ Umsatz;Kurs;Basis-Umsatz;WKZ Basis-Umsatz;Konto;Gegenkonto (ohne BU-Schlüssel);BU-Schlüssel;Belegdatum;Belegfeld 1;Belegfeld 2;Skonto;Buchungstext`;

    const rows = docs.map((doc) => {
      const brutto = typeof doc.total === "number" ? doc.total : 0;
      const netto = brutto / 1.19;
      const date = doc.createdAt ? new Date(doc.createdAt) : new Date();
      const belegdatum = `${String(date.getDate()).padStart(2, "0")}${String(date.getMonth() + 1).padStart(2, "0")}`;
      const betrag = netto.toFixed(2).replace(".", ",");

      return [
        betrag,          // Umsatz
        "S",             // Soll
        "EUR",           // Währung
        "",              // Kurs
        "",              // Basis-Umsatz
        "",              // WKZ Basis
        "8400",          // Konto (Erlöse 19%)
        "10000",         // Gegenkonto (Forderungen)
        "",              // BU-Schlüssel
        belegdatum,      // Belegdatum TTMM
        doc.number || "",// Belegfeld 1 (Belegnummer)
        "",              // Belegfeld 2
        "",              // Skonto
        '"' + String(doc.customerName || "").replace(/"/g, "'") + '"', // Buchungstext
      ].join(";");
    });

    const csv = [headerLine, columnLine, ...rows].join("\r\n");

    const filename = `DATEV-${type}-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(Buffer.from("\uFEFF" + csv, "utf-8"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Export-Fehler" }, { status: 500 });
  }
});
