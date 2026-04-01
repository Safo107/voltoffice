import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

function fDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function fEur(v: number) {
  return v.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " \u20AC";
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const a = await db.collection("angebote").findOne({ _id: new ObjectId(id) });
    if (!a) return NextResponse.json({ error: "Angebot nicht gefunden" }, { status: 404 });

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
    const firma = String(a.firmenname || "");
    const slogan = String(a.firmenslogan || "");
    if (firma) {
      page.drawText(firma, { x: 40, y: height - 38, size: 15, font: bold, color: C_DARK });
    }
    if (slogan) {
      page.drawText(slogan, { x: 40, y: height - 54, size: 8, font: reg, color: C_MUTED });
    }
    const adresse = [a.firmenStrasse, a.firmenOrt].filter(Boolean).join("  ·  ");
    if (adresse) {
      page.drawText(adresse, { x: 40, y: firma ? height - 66 : height - 38, size: 7.5, font: reg, color: C_MUTED });
    }

    // ── Dokumenttyp (rechts) ──────────────────────────────────────────────────
    const titleW = bold.widthOfTextAtSize("ANGEBOT", 22);
    page.drawText("ANGEBOT", { x: width - 40 - titleW, y: height - 38, size: 22, font: bold, color: C_DARK });
    const numText = "Nr. " + (a.number || "");
    const numW = reg.widthOfTextAtSize(numText, 9);
    page.drawText(numText, { x: width - 40 - numW, y: height - 54, size: 9, font: reg, color: C_MUTED });

    // ── Trennlinie ────────────────────────────────────────────────────────────
    let y = height - 85;
    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.75, color: C_BORDER });

    // ── Empfänger (links) + Datum (rechts) ────────────────────────────────────
    y -= 20;
    page.drawText("An", { x: 40, y, size: 7.5, font: reg, color: C_MUTED });
    y -= 14;
    page.drawText(a.customerName || "–", { x: 40, y, size: 12, font: bold, color: C_DARK });
    if (a.customerAddress) {
      y -= 13;
      page.drawText(a.customerAddress, { x: 40, y, size: 9, font: reg, color: C_MUTED });
    }

    const dateX = width - 180;
    let dateY = height - 105;
    const dateRows: [string, string][] = [
      ["Angebotsdatum", a.createdAt ? fDate(a.createdAt) : "–"],
      ["Gültig bis", a.validUntil ? fDate(a.validUntil) : "–"],
    ];
    for (const [label, val] of dateRows) {
      page.drawText(label, { x: dateX, y: dateY, size: 7.5, font: reg, color: C_MUTED });
      dateY -= 12;
      page.drawText(val, { x: dateX, y: dateY, size: 10, font: bold, color: C_DARK });
      dateY -= 16;
    }

    // Trennlinie vor Tabelle
    y = Math.min(y, dateY) - 16;
    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.75, color: C_BORDER });

    // ── Tabellenheader ────────────────────────────────────────────────────────
    y -= 20;
    page.drawRectangle({ x: 40, y: y - 6, width: 515, height: 20, color: C_DARK });
    const cols = { desc: 48, menge: 340, einheit: 385, ep: 430, ges: 500 };
    [
      ["Beschreibung", cols.desc],
      ["Menge", cols.menge],
      ["Einheit", cols.einheit],
      ["Einzelpreis", cols.ep],
      ["Gesamt", cols.ges],
    ].forEach(([t, x]) =>
      page.drawText(String(t), { x: Number(x), y, size: 8, font: bold, color: C_WHITE })
    );

    // ── Positionen ────────────────────────────────────────────────────────────
    const items: Array<{ description?: string; quantity?: number; unit?: string; unitPrice?: number; total?: number }> = a.items || [];
    y -= 22;
    let posNr = 1;
    for (const item of items) {
      const bg = posNr % 2 === 0 ? C_LIGHT : C_WHITE;
      page.drawRectangle({ x: 40, y: y - 5, width: 515, height: 18, color: bg });
      page.drawText(String(item.description || "").substring(0, 58), { x: cols.desc, y, size: 8, font: reg, color: C_DARK });
      page.drawText(String(item.quantity ?? ""), { x: cols.menge, y, size: 8, font: reg, color: C_DARK });
      page.drawText(String(item.unit || ""), { x: cols.einheit, y, size: 8, font: reg, color: C_DARK });
      page.drawText(fEur(item.unitPrice ?? 0), { x: cols.ep, y, size: 8, font: reg, color: C_DARK });
      page.drawText(fEur(item.total ?? 0), { x: cols.ges, y, size: 8, font: bold, color: C_DARK });
      posNr++;
      y -= 18;
      if (y < 160) { y = 160; break; }
    }

    // ── Trennlinie + Summen ───────────────────────────────────────────────────
    y -= 8;
    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.75, color: C_BORDER });
    y -= 16;
    const brutto = a.total || 0;
    const netto  = brutto / 1.19;
    const mwst   = brutto - netto;

    const sumRows: [string, string, boolean][] = [
      ["Nettobetrag:", fEur(netto), false],
      ["zzgl. MwSt. 19 %:", fEur(mwst), false],
    ];
    for (const [label, val] of sumRows) {
      page.drawText(label, { x: 380, y, size: 9, font: reg, color: C_MUTED });
      page.drawText(val, { x: width - 40 - reg.widthOfTextAtSize(val, 9), y, size: 9, font: reg, color: C_DARK });
      y -= 13;
    }
    page.drawLine({ start: { x: 360, y: y + 4 }, end: { x: width - 40, y: y + 4 }, thickness: 1, color: C_ACCENT });
    y -= 14;
    // Gesamtbetrag-Box
    page.drawRectangle({ x: 360, y: y - 6, width: 195, height: 24, color: C_DARK });
    page.drawText("Gesamtbetrag:", { x: 368, y, size: 9, font: bold, color: C_WHITE });
    const bruttoStr = fEur(brutto);
    page.drawText(bruttoStr, { x: width - 40 - bold.widthOfTextAtSize(bruttoStr, 11), y: y - 1, size: 11, font: bold, color: C_WHITE });

    // ── Footer ────────────────────────────────────────────────────────────────
    const fy = 45;
    page.drawLine({ start: { x: 40, y: fy + 18 }, end: { x: width - 40, y: fy + 18 }, thickness: 0.5, color: C_BORDER });
    page.drawText("Angebot Nr. " + (a.number || ""), { x: 40, y: fy + 6, size: 7.5, font: reg, color: C_MUTED });
    page.drawText("Seite 1", { x: width - 40 - reg.widthOfTextAtSize("Seite 1", 7.5), y: fy + 6, size: 7.5, font: reg, color: C_MUTED });

    const pdfBytes = await pdfDoc.save();
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Angebot-${a.number || id}.pdf"`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "PDF-Fehler" }, { status: 500 });
  }
}
