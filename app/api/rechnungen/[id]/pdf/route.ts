import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { withAuth } from "@/lib/withAuth";
import { getCompanyData } from "@/lib/getCompanyData";

function fDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function fEur(v: number) {
  return v.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " \u20AC";
}

type Context = { params: Promise<{ id: string }> };

export const GET = withAuth<Context>(async (_req, userId, { params }) => {
  try {
    const { id } = await params;
    const db = await getDb();
    const r = await db.collection("rechnungen").findOne({ _id: new ObjectId(id), userId });
    if (!r) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

    const company = await getCompanyData(userId);

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

    // ── Logo + Firmenname (links) ─────────────────────────────────────────────
    const firmaName = company.companyName || String(r.firmenname || "");
    let logoBottomY = height - 38;

    if (company.companyLogoBase64) {
      try {
        const b64data = company.companyLogoBase64.replace(/^data:image\/[a-z]+;base64,/, "");
        const logoBytes = Buffer.from(b64data, "base64");
        const isJpeg = company.companyLogoBase64.startsWith("data:image/jpeg") || company.companyLogoBase64.startsWith("data:image/jpg");
        const logoImg = isJpeg ? await pdfDoc.embedJpg(logoBytes) : await pdfDoc.embedPng(logoBytes);
        const logoH = 32;
        const logoW = Math.min(logoImg.width * (logoH / logoImg.height), 120);
        page.drawImage(logoImg, { x: 40, y: height - 38 - logoH + 6, width: logoW, height: logoH });
        logoBottomY = height - 38 - logoH - 4;
      } catch { /* Logo-Fehler ignorieren */ }
    }

    if (firmaName) {
      page.drawText(firmaName, { x: 40, y: logoBottomY, size: 14, font: bold, color: C_DARK });
      logoBottomY -= 14;
    }
    const adressParts = [
      [company.companyAddress, [company.companyZip, company.companyCity].filter(Boolean).join(" ")].filter(Boolean).join(", "),
      [r.firmenStrasse, r.firmenOrt].filter(Boolean).join("  ·  "),
    ].filter(Boolean);
    const adresse = adressParts[0] || "";
    if (adresse) {
      page.drawText(adresse, { x: 40, y: logoBottomY, size: 7.5, font: reg, color: C_MUTED });
      logoBottomY -= 12;
    }
    const kontakt = [company.companyPhone || r.telefon, company.companyEmail].filter(Boolean).join("  ·  ");
    if (kontakt) {
      page.drawText(kontakt, { x: 40, y: logoBottomY, size: 7, font: reg, color: C_MUTED });
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
    page.drawRectangle({ x: 40, y: y - 8, width: 515, height: 24, color: C_DARK });
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
      page.drawRectangle({ x: 40, y: y - 5, width: 515, height: 22, color: bg });
      page.drawText(String(posNr), { x: cols.pos + 2, y, size: 8, font: reg, color: C_MUTED });
      page.drawText(desc, { x: cols.desc, y, size: 8, font: reg, color: C_DARK });
      page.drawText(String(menge), { x: cols.menge, y, size: 8, font: reg, color: C_DARK });
      page.drawText(einheit, { x: cols.einheit, y, size: 8, font: reg, color: C_DARK });
      page.drawText(fEur(ep), { x: cols.ep, y, size: 8, font: reg, color: C_DARK });
      page.drawText(fEur(ges), { x: cols.ges, y, size: 8, font: bold, color: C_DARK });

      if (typ === "lohn" || einheit === "Std." || einheit === "AW") lohnNetto += ges;
      posNr++;
      y -= 22;
      if (y < 195) { y = 195; break; }
    }

    // ── Summenblock ───────────────────────────────────────────────────────────
    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.75, color: C_BORDER });
    y -= 16;
    const taxRate = r.taxRate ?? 19;
    // Prefer stored values; fall back to calculating from total for legacy documents
    const netto  = typeof r.netAmount === "number" ? r.netAmount : (r.total || 0) / 1.19;
    const mwst   = typeof r.taxAmount === "number" ? r.taxAmount : (r.total || 0) - netto;
    const brutto = typeof r.grossAmount === "number" ? r.grossAmount : (r.total || 0);

    if (taxRate === 0) {
      // Kleinunternehmer — nur Nettobetrag
      const nettoStr = fEur(netto);
      page.drawText("Rechnungsbetrag (netto):", { x: 355, y, size: 9, font: reg, color: C_MUTED });
      page.drawText(nettoStr, { x: width - 40 - reg.widthOfTextAtSize(nettoStr, 9), y, size: 9, font: reg, color: C_DARK });
      y -= 14;
      page.drawLine({ start: { x: 345, y: y + 5 }, end: { x: width - 40, y: y + 5 }, thickness: 1, color: C_ACCENT });
      y -= 15;
      page.drawRectangle({ x: 345, y: y - 7, width: 210, height: 26, color: C_DARK });
      page.drawText("Gesamtbetrag:", { x: 353, y, size: 9, font: bold, color: C_WHITE });
      const bruttoStr = fEur(netto);
      page.drawText(bruttoStr, { x: width - 40 - bold.widthOfTextAtSize(bruttoStr, 12), y: y - 1, size: 12, font: bold, color: C_WHITE });
      // §19 UStG Hinweis
      y -= 30;
      page.drawRectangle({ x: 40, y: y - 8, width: 380, height: 24, color: C_LIGHT });
      page.drawLine({ start: { x: 40, y: y - 8 }, end: { x: 40, y: y + 16 }, thickness: 2, color: C_ACCENT });
      page.drawText("Gemäß §19 UStG wird keine Umsatzsteuer berechnet.", { x: 48, y: y + 2, size: 8, font: reg, color: C_DARK });
    } else {
      const sumRows: [string, string][] = [
        ["Nettobetrag:", fEur(netto)],
        [`zzgl. MwSt. ${taxRate} %:`, fEur(mwst)],
      ];
      for (const [label, val] of sumRows) {
        page.drawText(label, { x: 355, y, size: 9, font: reg, color: C_MUTED });
        page.drawText(val, { x: width - 40 - reg.widthOfTextAtSize(val, 9), y, size: 9, font: reg, color: C_DARK });
        y -= 14;
      }
      page.drawLine({ start: { x: 345, y: y + 5 }, end: { x: width - 40, y: y + 5 }, thickness: 1, color: C_ACCENT });
      y -= 15;
      page.drawRectangle({ x: 345, y: y - 7, width: 210, height: 26, color: C_DARK });
      page.drawText("Gesamtbetrag brutto:", { x: 353, y, size: 9, font: bold, color: C_WHITE });
      const bruttoStr = fEur(brutto);
      page.drawText(bruttoStr, { x: width - 40 - bold.widthOfTextAtSize(bruttoStr, 12), y: y - 1, size: 12, font: bold, color: C_WHITE });
    }

    // ── § 35a EStG ────────────────────────────────────────────────────────────
    if (lohnNetto > 0) {
      y -= 24;
      page.drawRectangle({ x: 40, y: y - 8, width: 300, height: 32, color: C_LIGHT });
      page.drawLine({ start: { x: 40, y: y - 8 }, end: { x: 40, y: y + 24 }, thickness: 2, color: C_ACCENT });
      page.drawText("\u00A7 35a EStG:", { x: 48, y: y + 14, size: 7.5, font: bold, color: C_DARK });
      page.drawText("Lohnkosten i.H.v. " + fEur(lohnNetto) + " netto sind als haushaltsnahe Dienstleistung absetzbar.", { x: 48, y: y + 3, size: 7.5, font: reg, color: C_DARK });
    }

    // ── Versionshinweis ───────────────────────────────────────────────────────
    if (r.version && r.version > 1) {
      y -= 10;
      page.drawText(`Version ${r.version}`, { x: 40, y, size: 7.5, font: bold, color: C_ACCENT });
      y -= 4;
    }

    // ── Digitale Unterschrift ─────────────────────────────────────────────────
    if (r.signatureImage && typeof r.signatureImage === "string") {
      try {
        y -= 28;
        page.drawLine({ start: { x: 40, y: y + 14 }, end: { x: width - 40, y: y + 14 }, thickness: 0.5, color: C_BORDER });
        page.drawText("Digitale Unterschrift:", { x: 40, y, size: 8, font: bold, color: C_MUTED });
        if (r.signedAt) {
          const sigDate = new Date(r.signedAt).toLocaleString("de-DE");
          page.drawText("Unterzeichnet am " + sigDate, { x: 40, y: y - 11, size: 7.5, font: reg, color: C_MUTED });
        }
        const b64 = r.signatureImage.replace(/^data:image\/png;base64,/, "");
        const imgBytes = Buffer.from(b64, "base64");
        const pngImg = await pdfDoc.embedPng(imgBytes);
        const imgH = 50;
        const imgW = Math.min(pngImg.width * (imgH / pngImg.height), 200);
        page.drawImage(pngImg, { x: width - 40 - imgW, y: y - imgH + 8, width: imgW, height: imgH });
        page.drawLine({ start: { x: width - 40 - imgW, y: y - imgH - 2 }, end: { x: width - 40, y: y - imgH - 2 }, thickness: 0.5, color: C_BORDER });
        page.drawText("Unterschrift", { x: width - 40 - imgW, y: y - imgH - 12, size: 7, font: reg, color: C_MUTED });
        y -= imgH + 18;
      } catch { /* Bild-Fehler ignorieren */ }
    }

    // ── Zahlungsbedingungen ───────────────────────────────────────────────────
    {
      const zbY = Math.max(y - 18, 110);
      const zbText = r.status === "bezahlt" && r.paidAt
        ? "Bereits bezahlt am " + new Date(r.paidAt).toLocaleDateString("de-DE") + (r.paymentMethod === "stripe" ? " · Zahlungsart: Stripe" : "")
        : "Bitte überweisen Sie den Rechnungsbetrag fristgerecht auf das unten genannte Konto. Zahlungsziel: " + (r.zahlungsziel || "14 Tage netto") + ".";
      page.drawRectangle({ x: 40, y: zbY - 8, width: 390, height: 24, color: C_LIGHT });
      page.drawLine({ start: { x: 40, y: zbY - 8 }, end: { x: 40, y: zbY + 16 }, thickness: 2.5, color: C_ACCENT });
      page.drawText("Zahlungsbedingungen:", { x: 50, y: zbY + 6, size: 7.5, font: bold, color: C_DARK });
      page.drawText(zbText.substring(0, 90), { x: 50, y: zbY - 2, size: 7, font: reg, color: C_DARK });
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    const fy = 42;
    page.drawLine({ start: { x: 40, y: fy + 30 }, end: { x: width - 40, y: fy + 30 }, thickness: 0.5, color: C_BORDER });
    const bank = r.iban ? "IBAN: " + r.iban + (r.bic ? "  \u00B7  BIC: " + r.bic : "") + (r.bank ? "  \u00B7  " + r.bank : "") : "";
    const steuer = r.steuernummer ? "St.-Nr.: " + r.steuernummer : "";
    if (bank) page.drawText(bank, { x: 40, y: fy + 19, size: 7.5, font: reg, color: C_MUTED });
    if (steuer) page.drawText(steuer, { x: 40, y: fy + 8, size: 7.5, font: reg, color: C_MUTED });
    const rnText = "Rechnung Nr. " + (r.number || "");
    page.drawText(rnText, { x: width - 40 - reg.widthOfTextAtSize(rnText, 7.5), y: fy + 19, size: 7.5, font: reg, color: C_MUTED });
    const brandText = "Erstellt mit VoltOffice \u00B7 ElektroGenius \u00B7 Nördlinger Str. 1, 51103 Köln";
    page.drawText(brandText, { x: width - 40 - reg.widthOfTextAtSize(brandText, 6.5), y: fy + 8, size: 6.5, font: reg, color: C_MUTED });
    if (r.locked) {
      const lockNote = "Dieses Dokument wurde digital unterschrieben und ist unveränderbar.";
      const noteW = reg.widthOfTextAtSize(lockNote, 7);
      page.drawText(lockNote, { x: (width - noteW) / 2, y: fy - 4, size: 7, font: reg, color: C_MUTED });
    }

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
});
