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
    const a = await db.collection("angebote").findOne({ _id: new ObjectId(id), userId });
    if (!a) return NextResponse.json({ error: "Angebot nicht gefunden" }, { status: 404 });

    // Firmendaten aus User-Einstellungen laden
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
    const firmaName = company.companyName || String(a.firmenname || "");
    let logoBottomY = height - 38;

    // Logo einbetten falls vorhanden
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
      [a.firmenStrasse, a.firmenOrt].filter(Boolean).join("  ·  "),
    ].filter(Boolean);
    const adresse = adressParts[0] || "";
    if (adresse) {
      page.drawText(adresse, { x: 40, y: logoBottomY, size: 7.5, font: reg, color: C_MUTED });
      logoBottomY -= 12;
    }
    const kontakt = [company.companyPhone, company.companyEmail].filter(Boolean).join("  ·  ");
    if (kontakt) {
      page.drawText(kontakt, { x: 40, y: logoBottomY, size: 7, font: reg, color: C_MUTED });
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
    page.drawRectangle({ x: 40, y: y - 8, width: 515, height: 24, color: C_DARK });
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
      page.drawRectangle({ x: 40, y: y - 5, width: 515, height: 22, color: bg });
      page.drawText(String(item.description || "").substring(0, 58), { x: cols.desc, y, size: 8, font: reg, color: C_DARK });
      page.drawText(String(item.quantity ?? ""), { x: cols.menge, y, size: 8, font: reg, color: C_DARK });
      page.drawText(String(item.unit || ""), { x: cols.einheit, y, size: 8, font: reg, color: C_DARK });
      page.drawText(fEur(item.unitPrice ?? 0), { x: cols.ep, y, size: 8, font: reg, color: C_DARK });
      page.drawText(fEur(item.total ?? 0), { x: cols.ges, y, size: 8, font: bold, color: C_DARK });
      posNr++;
      y -= 22;
      if (y < 195) { y = 195; break; }
    }

    // ── Trennlinie + Summen ───────────────────────────────────────────────────
    y -= 8;
    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.75, color: C_BORDER });
    y -= 16;
    const taxRate = a.taxRate ?? 19;
    const brutto = a.total || 0;
    const netto  = taxRate > 0 ? brutto / (1 + taxRate / 100) : brutto;
    const mwst   = brutto - netto;

    if (taxRate === 0) {
      // Kleinunternehmer
      const nettoStr = fEur(netto);
      page.drawText("Rechnungsbetrag (netto):", { x: 355, y, size: 9, font: reg, color: C_MUTED });
      page.drawText(nettoStr, { x: width - 40 - reg.widthOfTextAtSize(nettoStr, 9), y, size: 9, font: reg, color: C_DARK });
      y -= 14;
      page.drawLine({ start: { x: 345, y: y + 5 }, end: { x: width - 40, y: y + 5 }, thickness: 1, color: C_ACCENT });
      y -= 15;
      page.drawRectangle({ x: 345, y: y - 7, width: 210, height: 26, color: C_DARK });
      page.drawText("Gesamtbetrag:", { x: 353, y, size: 9, font: bold, color: C_WHITE });
      const bruttoStr0 = fEur(netto);
      page.drawText(bruttoStr0, { x: width - 40 - bold.widthOfTextAtSize(bruttoStr0, 12), y: y - 1, size: 12, font: bold, color: C_WHITE });
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
      // Gesamtbetrag-Box
      page.drawRectangle({ x: 345, y: y - 7, width: 210, height: 26, color: C_DARK });
      page.drawText("Gesamtbetrag:", { x: 353, y, size: 9, font: bold, color: C_WHITE });
      const bruttoStr = fEur(brutto);
      page.drawText(bruttoStr, { x: width - 40 - bold.widthOfTextAtSize(bruttoStr, 12), y: y - 1, size: 12, font: bold, color: C_WHITE });
    }

    // ── Versionshinweis ───────────────────────────────────────────────────────
    if (a.version && a.version > 1) {
      y -= 10;
      page.drawText(`Version ${a.version}`, { x: 40, y, size: 7.5, font: bold, color: C_ACCENT });
      y -= 4;
    }

    // ── Digitale Unterschrift ─────────────────────────────────────────────────
    if (a.signatureImage && typeof a.signatureImage === "string") {
      try {
        y -= 28;
        page.drawLine({ start: { x: 40, y: y + 14 }, end: { x: width - 40, y: y + 14 }, thickness: 0.5, color: C_BORDER });
        page.drawText("Digitale Unterschrift:", { x: 40, y, size: 8, font: bold, color: C_MUTED });
        if (a.signedAt) {
          const sigDate = new Date(a.signedAt).toLocaleString("de-DE");
          page.drawText("Unterzeichnet am " + sigDate, { x: 40, y: y - 11, size: 7.5, font: reg, color: C_MUTED });
        }
        const b64 = a.signatureImage.replace(/^data:image\/png;base64,/, "");
        const imgBytes = Buffer.from(b64, "base64");
        const pngImg = await pdfDoc.embedPng(imgBytes);
        const imgH = 50;
        const imgW = Math.min(pngImg.width * (imgH / pngImg.height), 200);
        page.drawImage(pngImg, { x: width - 40 - imgW, y: y - imgH + 8, width: imgW, height: imgH });
        // Signaturlinie
        page.drawLine({ start: { x: width - 40 - imgW, y: y - imgH - 2 }, end: { x: width - 40, y: y - imgH - 2 }, thickness: 0.5, color: C_BORDER });
        page.drawText("Unterschrift", { x: width - 40 - imgW, y: y - imgH - 12, size: 7, font: reg, color: C_MUTED });
        y -= imgH + 18;
      } catch { /* Bild-Fehler ignorieren */ }
    }

    // ── Angebots-Hinweis ─────────────────────────────────────────────────────
    {
      const ahY = Math.max(y - 18, 110);
      const gueltigText = a.validUntil
        ? "Dieses Angebot ist gültig bis " + fDate(a.validUntil) + ". Bei Rückfragen stehen wir Ihnen gerne zur Verfügung."
        : "Wir freuen uns auf Ihren Auftrag. Bei Rückfragen stehen wir Ihnen gerne zur Verfügung.";
      page.drawRectangle({ x: 40, y: ahY - 8, width: 390, height: 24, color: C_LIGHT });
      page.drawLine({ start: { x: 40, y: ahY - 8 }, end: { x: 40, y: ahY + 16 }, thickness: 2.5, color: C_ACCENT });
      page.drawText("Hinweis:", { x: 50, y: ahY + 6, size: 7.5, font: bold, color: C_DARK });
      page.drawText(gueltigText.substring(0, 90), { x: 50, y: ahY - 2, size: 7, font: reg, color: C_DARK });
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    const fy = 42;
    page.drawLine({ start: { x: 40, y: fy + 30 }, end: { x: width - 40, y: fy + 30 }, thickness: 0.5, color: C_BORDER });
    const angebotKontakt = [company.companyEmail, company.companyPhone].filter(Boolean).join("  \u00B7  ");
    if (angebotKontakt) page.drawText(angebotKontakt, { x: 40, y: fy + 19, size: 7.5, font: reg, color: C_MUTED });
    const steuerA = company.companyTaxId ? "St.-Nr.: " + company.companyTaxId : "";
    if (steuerA) page.drawText(steuerA, { x: 40, y: fy + 8, size: 7.5, font: reg, color: C_MUTED });
    const anNumText = "Angebot Nr. " + (a.number || "");
    page.drawText(anNumText, { x: width - 40 - reg.widthOfTextAtSize(anNumText, 7.5), y: fy + 19, size: 7.5, font: reg, color: C_MUTED });
    const brandTextA = "Erstellt mit VoltOffice \u00B7 ElektroGenius \u00B7 Nördlinger Str. 1, 51103 Köln";
    page.drawText(brandTextA, { x: width - 40 - reg.widthOfTextAtSize(brandTextA, 6.5), y: fy + 8, size: 6.5, font: reg, color: C_MUTED });
    if (a.locked) {
      const lockNote = "Dieses Dokument wurde digital unterschrieben und ist unveränderbar.";
      const noteW = reg.widthOfTextAtSize(lockNote, 7);
      page.drawText(lockNote, { x: (width - noteW) / 2, y: fy - 4, size: 7, font: reg, color: C_MUTED });
    }

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
});
