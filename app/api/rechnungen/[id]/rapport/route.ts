import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

function fDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const r = await db.collection("rechnungen").findOne({ _id: new ObjectId(id) });
    if (!r) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

    // Zeiteinträge für dieses Projekt/diese Rechnung laden
    const zeiten = await db.collection("zeiterfassung")
      .find({ projectName: { $exists: true } })
      .sort({ date: 1 })
      .limit(100)
      .toArray();

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const { width, height } = page.getSize();

    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const reg  = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const C_DARK  = rgb(0.05, 0.11, 0.18);
    const C_BLUE  = rgb(0, 0.78, 1);
    const C_MUTED = rgb(0.54, 0.60, 0.71);
    const C_WHITE = rgb(1, 1, 1);
    const C_LIGHT = rgb(0.95, 0.97, 1);
    const C_BDR   = rgb(0.87, 0.91, 0.96);

    // ── Header ────────────────────────────────────────────────────────────────
    page.drawRectangle({ x: 0, y: height - 78, width, height: 78, color: C_DARK });
    page.drawText(r.firmenname || "ElektroGenius", { x: 40, y: height - 32, size: 17, font: bold, color: C_BLUE });
    page.drawText("Leistungsnachweis", { x: 40, y: height - 50, size: 9, font: reg, color: C_MUTED });
    const titleW = bold.widthOfTextAtSize("RAPPORT", 20);
    page.drawText("RAPPORT", { x: width - 40 - titleW, y: height - 38, size: 20, font: bold, color: C_WHITE });
    const refText = "Ref: " + (r.number || "");
    const refW = reg.widthOfTextAtSize(refText, 9);
    page.drawText(refText, { x: width - 40 - refW, y: height - 56, size: 9, font: reg, color: C_MUTED });

    // ── Infos ─────────────────────────────────────────────────────────────────
    let y = height - 98;
    page.drawText("Auftraggeber: " + (r.customerName || "–"), { x: 40, y, size: 9, font: bold, color: C_DARK });
    if (r.customerAddress) { y -= 13; page.drawText(r.customerAddress, { x: 40, y, size: 8, font: reg, color: C_MUTED }); }
    y -= 13;
    page.drawText("Betreff: " + (r.betreff || r.number || "–"), { x: 40, y, size: 8, font: reg, color: C_DARK });
    y -= 13;
    const today = new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
    page.drawText("Datum: " + today, { x: 40, y, size: 8, font: reg, color: C_MUTED });

    // ── Tabellenkopf ──────────────────────────────────────────────────────────
    y -= 22;
    page.drawRectangle({ x: 40, y: y - 6, width: 515, height: 20, color: C_DARK });
    const cols = { datum: 42, ma: 120, projekt: 220, von: 350, bis: 395, std: 440, bemerk: 478 };
    page.drawText("Datum", { x: cols.datum, y, size: 8, font: bold, color: C_WHITE });
    page.drawText("Mitarbeiter", { x: cols.ma, y, size: 8, font: bold, color: C_WHITE });
    page.drawText("Projekt / Tätigkeit", { x: cols.projekt, y, size: 8, font: bold, color: C_WHITE });
    page.drawText("Von", { x: cols.von, y, size: 8, font: bold, color: C_WHITE });
    page.drawText("Bis", { x: cols.bis, y, size: 8, font: bold, color: C_WHITE });
    page.drawText("Std.", { x: cols.std, y, size: 8, font: bold, color: C_WHITE });
    page.drawText("Bemerkung", { x: cols.bemerk, y, size: 8, font: bold, color: C_WHITE });

    // ── Einträge ──────────────────────────────────────────────────────────────
    y -= 20;
    let totalHours = 0;
    let row = 0;

    if (zeiten.length === 0) {
      // Beispiel-Zeilen generieren aus Rechnungs-Lohnpositionen
      const lohnPos = (r.items || []).filter((i: { typ?: string; einheit?: string }) => i.typ === "lohn" || i.einheit === "Std." || i.einheit === "AW");
      for (const pos of lohnPos) {
        const stunden = pos.menge ?? pos.quantity ?? 0;
        const beschr = String(pos.beschreibung || pos.description || "").substring(0, 38);
        const bg = row % 2 === 0 ? C_LIGHT : C_WHITE;
        page.drawRectangle({ x: 40, y: y - 5, width: 515, height: 17, color: bg });
        page.drawText(today, { x: cols.datum, y, size: 8, font: reg, color: C_DARK });
        page.drawText("–", { x: cols.ma, y, size: 8, font: reg, color: C_MUTED });
        page.drawText(beschr, { x: cols.projekt, y, size: 8, font: reg, color: C_DARK });
        page.drawText("–", { x: cols.von, y, size: 8, font: reg, color: C_MUTED });
        page.drawText("–", { x: cols.bis, y, size: 8, font: reg, color: C_MUTED });
        page.drawText(String(stunden), { x: cols.std, y, size: 8, font: bold, color: C_DARK });
        y -= 18; row++; totalHours += stunden;
      }
    } else {
      for (const e of zeiten) {
        const bg = row % 2 === 0 ? C_LIGHT : C_WHITE;
        page.drawRectangle({ x: 40, y: y - 5, width: 515, height: 17, color: bg });
        page.drawText(e.date || "–", { x: cols.datum, y, size: 8, font: reg, color: C_DARK });
        page.drawText(String(e.mitarbeiter || e.userId || "–").substring(0, 18), { x: cols.ma, y, size: 8, font: reg, color: C_DARK });
        page.drawText(String(e.projectName || "–").substring(0, 30), { x: cols.projekt, y, size: 8, font: reg, color: C_DARK });
        page.drawText(e.startTime || "–", { x: cols.von, y, size: 8, font: reg, color: C_DARK });
        page.drawText(e.endTime || "–", { x: cols.bis, y, size: 8, font: reg, color: C_DARK });
        page.drawText(String(e.hours || 0), { x: cols.std, y, size: 8, font: bold, color: C_DARK });
        page.drawText(String(e.description || "").substring(0, 18), { x: cols.bemerk, y, size: 8, font: reg, color: C_MUTED });
        totalHours += (e.hours || 0);
        y -= 18; row++;
        if (y < 160) break;
      }
    }

    // ── Summe ─────────────────────────────────────────────────────────────────
    y -= 6;
    page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 1, color: C_BLUE });
    y -= 14;
    page.drawText("Gesamtstunden:", { x: 380, y, size: 9, font: bold, color: C_DARK });
    page.drawText(totalHours + " Std.", { x: 490, y, size: 11, font: bold, color: C_BLUE });

    // ── Unterschriftenfeld ────────────────────────────────────────────────────
    y -= 40;
    page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 0.5, color: C_BDR });
    y -= 50;
    // Zwei Unterschriftenboxen
    page.drawRectangle({ x: 40, y, width: 210, height: 45, color: rgb(0.98, 0.99, 1) });
    drawRect(page, 40, y, 210, 45, C_BDR);
    page.drawText("Datum / Unterschrift Auftragnehmer", { x: 46, y: y + 6, size: 7, font: reg, color: C_MUTED });
    page.drawText(r.firmenname || "ElektroGenius", { x: 46, y: y + 16, size: 8, font: reg, color: C_MUTED });

    page.drawRectangle({ x: 290, y, width: 210, height: 45, color: rgb(0.98, 0.99, 1) });
    drawRect(page, 290, y, 210, 45, C_BDR);
    page.drawText("Datum / Unterschrift Auftraggeber", { x: 296, y: y + 6, size: 7, font: reg, color: C_MUTED });
    page.drawText(r.customerName || "Auftraggeber", { x: 296, y: y + 16, size: 8, font: reg, color: C_MUTED });

    // ── Footer ────────────────────────────────────────────────────────────────
    const fy = 38;
    page.drawLine({ start: { x: 40, y: fy + 18 }, end: { x: 555, y: fy + 18 }, thickness: 0.5, color: C_BDR });
    page.drawText((r.firmenname || "ElektroGenius") + "  \u00B7  Leistungsnachweis zur Rechnung " + (r.number || ""), { x: 40, y: fy + 6, size: 7.5, font: reg, color: C_MUTED });
    page.drawText("Seite 1", { x: 530, y: fy + 6, size: 7.5, font: reg, color: C_MUTED });

    const pdfBytes = await pdfDoc.save();
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Rapport-${r.number || id}.pdf"`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "PDF-Fehler" }, { status: 500 });
  }
}

// Hilfsfunktion für border-only drawRect
import type { PDFPage } from "pdf-lib";
function drawRect(page: PDFPage, x: number, y: number, w: number, h: number, color: ReturnType<typeof rgb>) {
  page.drawLine({ start: { x, y }, end: { x: x + w, y }, thickness: 0.5, color });
  page.drawLine({ start: { x, y: y + h }, end: { x: x + w, y: y + h }, thickness: 0.5, color });
  page.drawLine({ start: { x, y }, end: { x, y: y + h }, thickness: 0.5, color });
  page.drawLine({ start: { x: x + w, y }, end: { x: x + w, y: y + h }, thickness: 0.5, color });
}
