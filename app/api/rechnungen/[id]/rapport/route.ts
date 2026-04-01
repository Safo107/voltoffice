import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { PDFDocument, rgb, StandardFonts, type PDFPage } from "pdf-lib";

function fDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function drawBorder(page: PDFPage, x: number, y: number, w: number, h: number, color: ReturnType<typeof rgb>) {
  const opts = { thickness: 0.5, color };
  page.drawLine({ start: { x, y }, end: { x: x + w, y }, ...opts });
  page.drawLine({ start: { x, y: y + h }, end: { x: x + w, y: y + h }, ...opts });
  page.drawLine({ start: { x, y }, end: { x, y: y + h }, ...opts });
  page.drawLine({ start: { x: x + w, y }, end: { x: x + w, y: y + h }, ...opts });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const r = await db.collection("rechnungen").findOne({ _id: new ObjectId(id) });
    if (!r) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

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

    // Farben — weißes, professionelles Design
    const C_DARK   = rgb(0.08, 0.13, 0.22);
    const C_ACCENT = rgb(0.04, 0.44, 0.68);
    const C_MUTED  = rgb(0.45, 0.50, 0.58);
    const C_LIGHT  = rgb(0.96, 0.97, 0.99);
    const C_BORDER = rgb(0.84, 0.87, 0.91);
    const C_WHITE  = rgb(1, 1, 1);

    // ── Dünner Akzentbalken oben ──────────────────────────────────────────────
    page.drawRectangle({ x: 0, y: height - 5, width, height: 5, color: C_ACCENT });

    // ── Firmenname (links) ────────────────────────────────────────────────────
    const firma = String(r.firmenname || "");
    if (firma) {
      page.drawText(firma, { x: 40, y: height - 38, size: 15, font: bold, color: C_DARK });
    }
    page.drawText("Leistungsnachweis", { x: 40, y: height - 54, size: 8, font: reg, color: C_MUTED });

    // ── Dokumenttyp (rechts) ──────────────────────────────────────────────────
    const titleW = bold.widthOfTextAtSize("RAPPORT", 22);
    page.drawText("RAPPORT", { x: width - 40 - titleW, y: height - 38, size: 22, font: bold, color: C_DARK });
    const refText = "Ref: " + (r.number || "");
    const refW = reg.widthOfTextAtSize(refText, 9);
    page.drawText(refText, { x: width - 40 - refW, y: height - 54, size: 9, font: reg, color: C_MUTED });

    // ── Trennlinie ────────────────────────────────────────────────────────────
    let y = height - 72;
    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.75, color: C_BORDER });

    // ── Infos ─────────────────────────────────────────────────────────────────
    y -= 16;
    page.drawText("Auftraggeber: " + (r.customerName || "–"), { x: 40, y, size: 9, font: bold, color: C_DARK });
    if (r.customerAddress) { y -= 13; page.drawText(r.customerAddress, { x: 40, y, size: 8, font: reg, color: C_MUTED }); }
    y -= 13;
    page.drawText("Betreff: " + (r.betreff || r.number || "–"), { x: 40, y, size: 8, font: reg, color: C_DARK });
    y -= 13;
    const today = new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
    page.drawText("Datum: " + today, { x: 40, y, size: 8, font: reg, color: C_MUTED });

    // ── Tabellenheader ────────────────────────────────────────────────────────
    y -= 20;
    page.drawRectangle({ x: 40, y: y - 6, width: 515, height: 20, color: C_DARK });
    const cols = { datum: 42, ma: 118, projekt: 218, von: 348, bis: 390, std: 432, bemerk: 472 };
    [
      ["Datum", cols.datum],
      ["Mitarbeiter", cols.ma],
      ["Projekt / Tätigkeit", cols.projekt],
      ["Von", cols.von],
      ["Bis", cols.bis],
      ["Std.", cols.std],
      ["Bemerkung", cols.bemerk],
    ].forEach(([t, x]) =>
      page.drawText(String(t), { x: Number(x), y, size: 7.5, font: bold, color: C_WHITE })
    );

    // ── Einträge ──────────────────────────────────────────────────────────────
    y -= 20;
    let totalHours = 0;
    let row = 0;

    if (zeiten.length === 0) {
      const lohnPos = (r.items || []).filter((i: { typ?: string; einheit?: string }) => i.typ === "lohn" || i.einheit === "Std." || i.einheit === "AW");
      for (const pos of lohnPos) {
        const stunden = pos.menge ?? pos.quantity ?? 0;
        const beschr = String(pos.beschreibung || pos.description || "").substring(0, 36);
        const bg = row % 2 === 0 ? C_LIGHT : C_WHITE;
        page.drawRectangle({ x: 40, y: y - 5, width: 515, height: 17, color: bg });
        page.drawText(today, { x: cols.datum, y, size: 7.5, font: reg, color: C_DARK });
        page.drawText("–", { x: cols.ma, y, size: 7.5, font: reg, color: C_MUTED });
        page.drawText(beschr, { x: cols.projekt, y, size: 7.5, font: reg, color: C_DARK });
        page.drawText("–", { x: cols.von, y, size: 7.5, font: reg, color: C_MUTED });
        page.drawText("–", { x: cols.bis, y, size: 7.5, font: reg, color: C_MUTED });
        page.drawText(String(stunden), { x: cols.std, y, size: 7.5, font: bold, color: C_DARK });
        y -= 18; row++; totalHours += stunden;
      }
    } else {
      for (const e of zeiten) {
        const bg = row % 2 === 0 ? C_LIGHT : C_WHITE;
        page.drawRectangle({ x: 40, y: y - 5, width: 515, height: 17, color: bg });
        page.drawText(String(e.date || "–"), { x: cols.datum, y, size: 7.5, font: reg, color: C_DARK });
        page.drawText(String(e.mitarbeiter || e.userId || "–").substring(0, 16), { x: cols.ma, y, size: 7.5, font: reg, color: C_DARK });
        page.drawText(String(e.projectName || "–").substring(0, 28), { x: cols.projekt, y, size: 7.5, font: reg, color: C_DARK });
        page.drawText(e.startTime || "–", { x: cols.von, y, size: 7.5, font: reg, color: C_DARK });
        page.drawText(e.endTime || "–", { x: cols.bis, y, size: 7.5, font: reg, color: C_DARK });
        page.drawText(String(e.hours || 0), { x: cols.std, y, size: 7.5, font: bold, color: C_DARK });
        page.drawText(String(e.description || "").substring(0, 16), { x: cols.bemerk, y, size: 7.5, font: reg, color: C_MUTED });
        totalHours += (e.hours || 0);
        y -= 18; row++;
        if (y < 160) break;
      }
    }

    // ── Gesamtstunden ─────────────────────────────────────────────────────────
    y -= 8;
    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1, color: C_ACCENT });
    y -= 16;
    page.drawText("Gesamtstunden:", { x: 380, y, size: 9, font: bold, color: C_DARK });
    page.drawText(totalHours + " Std.", {
      x: width - 40 - bold.widthOfTextAtSize(totalHours + " Std.", 11), y,
      size: 11, font: bold, color: C_ACCENT,
    });

    // ── Unterschriftenfelder ──────────────────────────────────────────────────
    y -= 50;
    const boxH = 48;

    page.drawRectangle({ x: 40, y, width: 215, height: boxH, color: C_LIGHT });
    drawBorder(page, 40, y, 215, boxH, C_BORDER);
    page.drawText("Unterschrift Auftragnehmer", { x: 46, y: y + 8, size: 7, font: reg, color: C_MUTED });
    if (firma) page.drawText(firma, { x: 46, y: y + 20, size: 8, font: reg, color: C_DARK });

    page.drawRectangle({ x: 290, y, width: 265, height: boxH, color: C_LIGHT });
    drawBorder(page, 290, y, 265, boxH, C_BORDER);
    page.drawText("Unterschrift Auftraggeber", { x: 296, y: y + 8, size: 7, font: reg, color: C_MUTED });
    page.drawText(r.customerName || "Auftraggeber", { x: 296, y: y + 20, size: 8, font: reg, color: C_DARK });

    // ── Footer ────────────────────────────────────────────────────────────────
    const fy = 38;
    page.drawLine({ start: { x: 40, y: fy + 18 }, end: { x: width - 40, y: fy + 18 }, thickness: 0.5, color: C_BORDER });
    page.drawText("Leistungsnachweis zur Rechnung " + (r.number || ""), { x: 40, y: fy + 6, size: 7.5, font: reg, color: C_MUTED });
    page.drawText("Seite 1", { x: width - 40 - reg.widthOfTextAtSize("Seite 1", 7.5), y: fy + 6, size: 7.5, font: reg, color: C_MUTED });

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
