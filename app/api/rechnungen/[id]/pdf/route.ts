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

    const C_BLUE   = rgb(0, 0.78, 1);
    const C_DARK   = rgb(0.05, 0.11, 0.18);
    const C_MUTED  = rgb(0.54, 0.60, 0.71);
    const C_WHITE  = rgb(1, 1, 1);
    const C_LIGHT  = rgb(0.95, 0.97, 1);
    const C_BORDER = rgb(0.87, 0.91, 0.96);

    // ── Header ───────────────────────────────────────────────────────────────
    page.drawRectangle({ x: 0, y: height - 78, width, height: 78, color: C_DARK });
    page.drawText(r.firmenname || "ElektroGenius", { x: 40, y: height - 32, size: 17, font: bold, color: C_BLUE });
    page.drawText(r.firmenslogan || "VoltOffice", { x: 40, y: height - 50, size: 9, font: reg, color: C_MUTED });
    // Titel rechts
    const docType = r.abrechnungsart === "regie" ? "REGIEBERICHT" : "RECHNUNG";
    const titleW = bold.widthOfTextAtSize(docType, 20);
    page.drawText(docType, { x: width - 40 - titleW, y: height - 38, size: 20, font: bold, color: C_WHITE });
    const numText = "Nr. " + (r.number || "");
    const numW = reg.widthOfTextAtSize(numText, 9);
    page.drawText(numText, { x: width - 40 - numW, y: height - 56, size: 9, font: reg, color: C_MUTED });

    // ── Absender (klein) ─────────────────────────────────────────────────────
    let y = height - 92;
    page.drawText((r.firmenname || "ElektroGenius") + "  \u00B7  " + (r.firmenStrasse || "") + "  \u00B7  " + (r.firmenOrt || ""), {
      x: 40, y, size: 7.5, font: reg, color: C_MUTED,
    });

    // ── Empfänger ─────────────────────────────────────────────────────────────
    y = height - 116;
    page.drawText("An", { x: 40, y, size: 7.5, font: reg, color: C_MUTED });
    y -= 13;
    page.drawText(r.customerName || "–", { x: 40, y, size: 12, font: bold, color: C_DARK });
    if (r.customerAddress) { y -= 13; page.drawText(r.customerAddress, { x: 40, y, size: 9, font: reg, color: C_MUTED }); }

    // ── Infos rechts ──────────────────────────────────────────────────────────
    const infoX = 370;
    let iy = height - 100;
    const infoRows: [string, string][] = [
      ["Rechnungsdatum", r.createdAt ? fDate(r.createdAt) : "–"],
      ["Zahlungsziel", r.zahlungsziel || "14 Tage netto"],
      ["Steuernummer", r.steuernummer || "–"],
    ];
    if (r.abrechnungsart === "regie") infoRows.splice(1, 0, ["Abrechnungsart", "Nach Aufwand (Regie)"]);
    else infoRows.splice(1, 0, ["Abrechnungsart", "Festpreis (Pauschal)"]);
    for (const [label, val] of infoRows) {
      page.drawText(label, { x: infoX, y: iy, size: 7.5, font: reg, color: C_MUTED });
      page.drawText(val, { x: infoX, y: iy - 11, size: 9, font: bold, color: C_DARK });
      iy -= 28;
    }

    // ── Betreff ───────────────────────────────────────────────────────────────
    y = Math.min(y, iy) - 14;
    if (r.betreff) {
      page.drawText("Betreff: " + r.betreff, { x: 40, y, size: 10, font: bold, color: C_DARK });
      y -= 18;
    }

    // ── Tabellenheader ────────────────────────────────────────────────────────
    y -= 10;
    page.drawRectangle({ x: 40, y: y - 6, width: 515, height: 20, color: C_DARK });
    const cols = { pos: 40, desc: 65, menge: 340, einheit: 383, ep: 430, ges: 505 };
    page.drawText("Pos.", { x: cols.pos + 2, y, size: 8, font: bold, color: C_WHITE });
    page.drawText("Leistungsbeschreibung", { x: cols.desc, y, size: 8, font: bold, color: C_WHITE });
    page.drawText("Menge", { x: cols.menge, y, size: 8, font: bold, color: C_WHITE });
    page.drawText("Einh.", { x: cols.einheit, y, size: 8, font: bold, color: C_WHITE });
    page.drawText("Einzelpreis", { x: cols.ep, y, size: 8, font: bold, color: C_WHITE });
    page.drawText("Gesamt", { x: cols.ges, y, size: 8, font: bold, color: C_WHITE });

    // ── Positionen ────────────────────────────────────────────────────────────
    const items: Array<{ beschreibung?: string; description?: string; menge?: number; quantity?: number; einheit?: string; unit?: string; einzelpreis?: number; unitPrice?: number; gesamt?: number; total?: number; typ?: string }> = r.items || [];
    y -= 20;
    let lohnNetto = 0;
    let posNr = 1;

    for (const item of items) {
      const desc = String(item.beschreibung || item.description || "").substring(0, 60);
      const menge = item.menge ?? item.quantity ?? 0;
      const einheit = item.einheit || item.unit || "";
      const ep = item.einzelpreis ?? item.unitPrice ?? 0;
      const ges = item.gesamt ?? item.total ?? 0;
      const typ = item.typ || "";

      const rowBg = posNr % 2 === 0 ? C_LIGHT : C_WHITE;
      page.drawRectangle({ x: 40, y: y - 5, width: 515, height: 17, color: rowBg });

      page.drawText(String(posNr), { x: cols.pos + 2, y, size: 8, font: reg, color: C_MUTED });
      page.drawText(desc, { x: cols.desc, y, size: 8, font: reg, color: C_DARK });
      page.drawText(String(menge), { x: cols.menge, y, size: 8, font: reg, color: C_DARK });
      page.drawText(einheit, { x: cols.einheit, y, size: 8, font: reg, color: C_DARK });
      page.drawText(fEur(ep), { x: cols.ep, y, size: 8, font: reg, color: C_DARK });
      page.drawText(fEur(ges), { x: cols.ges, y, size: 8, font: bold, color: C_DARK });

      // Lohnanteil für § 35a summieren
      if (typ === "lohn" || einheit === "Std." || einheit === "AW") {
        lohnNetto += ges;
      }

      posNr++;
      y -= 18;
      if (y < 180) { y = 180; } // Overflow-Schutz (einfach)
    }

    // Trennlinie unter Positionen
    page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 0.75, color: C_BORDER });

    // ── Summenblock ───────────────────────────────────────────────────────────
    const brutto = r.total || 0;
    const netto  = brutto / 1.19;
    const mwst   = brutto - netto;

    y -= 14;
    page.drawText("Nettobetrag:", { x: 380, y, size: 9, font: reg, color: C_MUTED });
    page.drawText(fEur(netto), { x: 500 - reg.widthOfTextAtSize(fEur(netto), 9), y, size: 9, font: reg, color: C_DARK });
    y -= 13;
    page.drawText("zzgl. MwSt. 19 %:", { x: 380, y, size: 9, font: reg, color: C_MUTED });
    page.drawText(fEur(mwst), { x: 500 - reg.widthOfTextAtSize(fEur(mwst), 9), y, size: 9, font: reg, color: C_DARK });
    y -= 4;
    page.drawLine({ start: { x: 370, y }, end: { x: 555, y }, thickness: 1, color: C_BLUE });
    y -= 16;
    page.drawRectangle({ x: 370, y: y - 5, width: 185, height: 22, color: C_DARK });
    page.drawText("Gesamtbetrag brutto:", { x: 378, y, size: 9, font: bold, color: C_WHITE });
    const bruttoStr = fEur(brutto);
    page.drawText(bruttoStr, { x: 550 - bold.widthOfTextAtSize(bruttoStr, 11), y: y - 1, size: 11, font: bold, color: C_BLUE });

    // ── § 35a EStG Hinweis ────────────────────────────────────────────────────
    if (lohnNetto > 0) {
      y -= 22;
      page.drawRectangle({ x: 40, y: y - 6, width: 300, height: 30, color: rgb(0.94, 0.98, 1) });
      page.drawText("\u00A7 35a EStG:", { x: 46, y: y + 14, size: 7.5, font: bold, color: C_DARK });
      page.drawText("In diesem Rechnungsbetrag sind Lohnkosten i.H.v. " + fEur(lohnNetto) + " netto enthalten.", { x: 46, y: y + 3, size: 7.5, font: reg, color: C_DARK });
      page.drawText("Diese sind nach \u00A7 35a EStG als haushaltsnahe Dienstleistung steuerlich absetzbar.", { x: 46, y: y - 7, size: 7.5, font: reg, color: C_MUTED });
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    const footerY = 60;
    page.drawLine({ start: { x: 40, y: footerY + 22 }, end: { x: 555, y: footerY + 22 }, thickness: 0.5, color: C_BORDER });
    const bank = r.iban ? "IBAN: " + r.iban + (r.bic ? "   BIC: " + r.bic : "") + (r.bank ? "   Bank: " + r.bank : "") : "";
    const steuer = r.steuernummer ? "St.-Nr.: " + r.steuernummer : "";
    const zahlung = r.zahlungsziel ? "Zahlungsziel: " + r.zahlungsziel : "Zahlungsziel: 14 Tage netto";
    page.drawText(bank, { x: 40, y: footerY + 10, size: 7.5, font: reg, color: C_MUTED });
    page.drawText(steuer + (steuer && zahlung ? "   \u00B7   " : "") + zahlung, { x: 40, y: footerY, size: 7.5, font: reg, color: C_MUTED });
    const rnText = "Rechnung " + (r.number || "");
    page.drawText(rnText, { x: 555 - reg.widthOfTextAtSize(rnText, 7.5), y: footerY, size: 7.5, font: reg, color: C_MUTED });

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
