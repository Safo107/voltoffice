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
    const r = await db.collection("rechnungen").findOne({ _id: new ObjectId(id) });
    if (!r) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

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
    if (r.firmenslogan) {
      page.drawText(String(r.firmenslogan), { x: 40, y: height - 54, size: 8, font: reg, color: C_MUTED });
    }
    const adresse = [r.firmenStrasse, r.firmenOrt].filter(Boolean).join("  ·  ");
    if (adresse) {
      page.drawText(adresse, { x: 40, y: firma ? height - 66 : height - 38, size: 7.5, font: reg, color: C_MUTED });
    }

    // ── Dokumenttyp (rechts) ──────────────────────────────────────────────────
    const docType = r.abrechnungsart === "regie" ? "REGIEBERICHT" : "RECHNUNG";
    const titleW  = bold.widthOfTextAtSize(docType, 20);
    page.drawText(docType, { x: width - 40 - titleW, y: height - 38, size: 20, font: bold, color: C_DARK });
    const numText = "Nr. " + (r.number || "");
    const numW = reg.widthOfTextAtSize(numText, 9);
    page.drawText(numText, { x: width - 40 - numW, y: height - 54, size: 9, font: reg, color: C_MUTED });

    // ── Trennlinie ────────────────────────────────────────────────────────────
    let y = height - 83;
    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.75, color: C_BORDER });

    // ── Empfänger (links) ─────────────────────────────────────────────────────
    y -= 18;
    page.drawText("An", { x: 40, y, size: 7.5, font: reg, color: C_MUTED });
    y -= 14;
    page.drawText(r.customerName || "–", { x: 40, y, size: 12, font: bold, color: C_DARK });
    if (r.customerAddress) { y -= 13; page.drawText(r.customerAddress, { x: 40, y, size: 9, font: reg, color: C_MUTED }); }

    // ── Infos rechts ──────────────────────────────────────────────────────────
    const infoX = width - 195;
    let iy = height - 100;
    const infoRows: [string, string][] = [
      ["Rechnungsdatum", r.createdAt ? fDate(r.createdAt) : "–"],
      ["Abrechnungsart", r.abrechnungsart === "regie" ? "Nach Aufwand (Regie)" : "Festpreis (Pauschal)"],
      ["Zahlungsziel", r.zahlungsziel || "14 Tage netto"],
      ["Steuernummer", r.steuernummer || "–"],
    ];
    for (const [label, val] of infoRows) {
      page.drawText(label, { x: infoX, y: iy, size: 7.5, font: reg, color: C_MUTED });
      page.drawText(val, { x: infoX, y: iy - 11, size: 9, font: bold, color: C_DARK });
      iy -= 28;
    }

    // ── Betreff ───────────────────────────────────────────────────────────────
    y = Math.min(y, iy) - 12;
    if (r.betreff) {
      page.drawLine({ start: { x: 40, y: y + 8 }, end: { x: width - 40, y: y + 8 }, thickness: 0.75, color: C_BORDER });
      y -= 4;
      page.drawText("Betreff: " + r.betreff, { x: 40, y, size: 10, font: bold, color: C_DARK });
      y -= 18;
    }

    // ── Tabellenheader ────────────────────────────────────────────────────────
    y -= 6;
    page.drawRectangle({ x: 40, y: y - 6, width: 515, height: 20, color: C_DARK });
    const cols = { pos: 40, desc: 62, menge: 338, einheit: 380, ep: 428, ges: 500 };
    [
      ["Pos.", cols.pos + 2],
      ["Leistungsbeschreibung", cols.desc],
      ["Menge", cols.menge],
      ["Einh.", cols.einheit],
      ["Einzelpreis", cols.ep],
      ["Gesamt", cols.ges],
    ].forEach(([t, x]) =>
      page.drawText(String(t), { x: Number(x), y, size: 8, font: bold, color: C_WHITE })
    );

    // ── Positionen ────────────────────────────────────────────────────────────
    const items: Array<{ beschreibung?: string; description?: string; menge?: number; quantity?: number; einheit?: string; unit?: string; einzelpreis?: number; unitPrice?: number; gesamt?: number; total?: number; typ?: string }> = r.items || [];
    y -= 20;
    let lohnNetto = 0;
    let posNr = 1;
    for (const item of items) {
      const desc   = String(item.beschreibung || item.description || "").substring(0, 60);
      const menge  = item.menge ?? item.quantity ?? 0;
      const einheit = item.einheit || item.unit || "";
      const ep     = item.einzelpreis ?? item.unitPrice ?? 0;
      const ges    = item.gesamt ?? item.total ?? 0;
      const typ    = item.typ || "";

      const bg = posNr % 2 === 0 ? C_LIGHT : C_WHITE;
      page.drawRectangle({ x: 40, y: y - 5, width: 515, height: 18, color: bg });
      page.drawText(String(posNr), { x: cols.pos + 2, y, size: 8, font: reg, color: C_MUTED });
      page.drawText(desc, { x: cols.desc, y, size: 8, font: reg, color: C_DARK });
      page.drawText(String(menge), { x: cols.menge, y, size: 8, font: reg, color: C_DARK });
      page.drawText(einheit, { x: cols.einheit, y, size: 8, font: reg, color: C_DARK });
      page.drawText(fEur(ep), { x: cols.ep, y, size: 8, font: reg, color: C_DARK });
      page.drawText(fEur(ges), { x: cols.ges, y, size: 8, font: bold, color: C_DARK });

      if (typ === "lohn" || einheit === "Std." || einheit === "AW") lohnNetto += ges;
      posNr++;
      y -= 18;
      if (y < 160) { y = 160; break; }
    }

    // ── Summenblock ───────────────────────────────────────────────────────────
    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.75, color: C_BORDER });
    y -= 16;
    const brutto = r.total || 0;
    const netto  = brutto / 1.19;
    const mwst   = brutto - netto;

    const sumRows: [string, string][] = [
      ["Nettobetrag:", fEur(netto)],
      ["zzgl. MwSt. 19 %:", fEur(mwst)],
    ];
    for (const [label, val] of sumRows) {
      page.drawText(label, { x: 380, y, size: 9, font: reg, color: C_MUTED });
      page.drawText(val, { x: width - 40 - reg.widthOfTextAtSize(val, 9), y, size: 9, font: reg, color: C_DARK });
      y -= 13;
    }
    page.drawLine({ start: { x: 360, y: y + 4 }, end: { x: width - 40, y: y + 4 }, thickness: 1, color: C_ACCENT });
    y -= 14;
    page.drawRectangle({ x: 360, y: y - 6, width: 195, height: 24, color: C_DARK });
    page.drawText("Gesamtbetrag brutto:", { x: 368, y, size: 9, font: bold, color: C_WHITE });
    const bruttoStr = fEur(brutto);
    page.drawText(bruttoStr, { x: width - 40 - bold.widthOfTextAtSize(bruttoStr, 11), y: y - 1, size: 11, font: bold, color: C_WHITE });

    // ── § 35a EStG ────────────────────────────────────────────────────────────
    if (lohnNetto > 0) {
      y -= 24;
      page.drawRectangle({ x: 40, y: y - 8, width: 300, height: 32, color: C_LIGHT });
      page.drawLine({ start: { x: 40, y: y - 8 }, end: { x: 40, y: y + 24 }, thickness: 2, color: C_ACCENT });
      page.drawText("\u00A7 35a EStG:", { x: 48, y: y + 14, size: 7.5, font: bold, color: C_DARK });
      page.drawText("Lohnkosten i.H.v. " + fEur(lohnNetto) + " netto sind als haushaltsnahe Dienstleistung absetzbar.", { x: 48, y: y + 3, size: 7.5, font: reg, color: C_DARK });
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    const fy = 45;
    page.drawLine({ start: { x: 40, y: fy + 22 }, end: { x: width - 40, y: fy + 22 }, thickness: 0.5, color: C_BORDER });
    const bank = r.iban ? "IBAN: " + r.iban + (r.bic ? "  ·  BIC: " + r.bic : "") + (r.bank ? "  ·  Bank: " + r.bank : "") : "";
    const steuer = r.steuernummer ? "St.-Nr.: " + r.steuernummer : "";
    const zahlung = "Zahlungsziel: " + (r.zahlungsziel || "14 Tage netto");
    if (bank) page.drawText(bank, { x: 40, y: fy + 10, size: 7.5, font: reg, color: C_MUTED });
    page.drawText([steuer, zahlung].filter(Boolean).join("   \u00B7   "), { x: 40, y: fy, size: 7.5, font: reg, color: C_MUTED });
    const rnText = "Rechnung Nr. " + (r.number || "");
    page.drawText(rnText, { x: width - 40 - reg.widthOfTextAtSize(rnText, 7.5), y: fy, size: 7.5, font: reg, color: C_MUTED });

    const pdfBytes = await pdfDoc.save();
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Rechnung-${r.number || id}.pdf"`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "PDF-Fehler" }, { status: 500 });
  }
}
