import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatEuro(value: number) {
  return value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const rechnung = await db.collection("rechnungen").findOne({ _id: new ObjectId(id) });

    if (!rechnung) {
      return NextResponse.json({ error: "Rechnung nicht gefunden" }, { status: 404 });
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const { height } = page.getSize();

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const blue = rgb(0, 0.776, 1);       // #00c6ff
    const dark = rgb(0.05, 0.11, 0.18);  // #0d1b2e
    const muted = rgb(0.54, 0.60, 0.71); // #8b9ab5
    const white = rgb(1, 1, 1);

    // Header Bar
    page.drawRectangle({ x: 0, y: height - 80, width: 595, height: 80, color: dark });
    page.drawText("ElektroGenius", { x: 40, y: height - 34, size: 18, font: fontBold, color: blue });
    page.drawText("VoltOffice", { x: 40, y: height - 52, size: 10, font: fontReg, color: muted });
    page.drawText("RECHNUNG", { x: 420, y: height - 40, size: 20, font: fontBold, color: white });

    // Rechnungsdetails
    page.drawText(`Nr: ${rechnung.number}`, { x: 420, y: height - 58, size: 9, font: fontReg, color: muted });

    // Absender
    let y = height - 110;
    page.drawText("ElektroGenius GmbH", { x: 40, y, size: 9, font: fontBold, color: dark });
    y -= 13;
    page.drawText("info@elektrogenius.de  ·  elektrogenius.de", { x: 40, y, size: 8, font: fontReg, color: muted });

    // Empfänger Box
    y = height - 160;
    page.drawText("Rechnungsempfänger", { x: 40, y, size: 8, font: fontReg, color: muted });
    y -= 14;
    page.drawText(rechnung.customerName || "–", { x: 40, y, size: 12, font: fontBold, color: dark });
    if (rechnung.customerAddress) {
      y -= 14;
      page.drawText(rechnung.customerAddress, { x: 40, y, size: 9, font: fontReg, color: muted });
    }

    // Datum & Fällig
    const dateX = 360;
    let dateY = height - 160;
    page.drawText("Rechnungsdatum", { x: dateX, y: dateY, size: 8, font: fontReg, color: muted });
    dateY -= 13;
    page.drawText(rechnung.createdAt ? formatDate(rechnung.createdAt) : "–", { x: dateX, y: dateY, size: 10, font: fontBold, color: dark });
    dateY -= 18;
    page.drawText("Fällig bis", { x: dateX, y: dateY, size: 8, font: fontReg, color: muted });
    dateY -= 13;
    page.drawText(rechnung.dueDate ? formatDate(rechnung.dueDate) : "14 Tage", { x: dateX, y: dateY, size: 10, font: fontBold, color: dark });

    // Trennlinie
    y = height - 250;
    page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 1, color: rgb(0.87, 0.91, 0.96) });

    // Tabellenkopf
    y -= 20;
    page.drawRectangle({ x: 40, y: y - 5, width: 515, height: 20, color: rgb(0.94, 0.97, 1) });
    page.drawText("Beschreibung", { x: 48, y, size: 8, font: fontBold, color: dark });
    page.drawText("Menge", { x: 340, y, size: 8, font: fontBold, color: dark });
    page.drawText("Einheit", { x: 390, y, size: 8, font: fontBold, color: dark });
    page.drawText("Einzelpreis", { x: 435, y, size: 8, font: fontBold, color: dark });
    page.drawText("Gesamt", { x: 502, y, size: 8, font: fontBold, color: dark });

    // Positionen
    const items: Array<{ description: string; quantity: number; unit: string; unitPrice: number; total: number }> = rechnung.items || [];
    y -= 22;
    for (const item of items) {
      const desc = String(item.description || "").substring(0, 55);
      page.drawText(desc, { x: 48, y, size: 8, font: fontReg, color: dark });
      page.drawText(String(item.quantity), { x: 340, y, size: 8, font: fontReg, color: dark });
      page.drawText(String(item.unit || ""), { x: 390, y, size: 8, font: fontReg, color: dark });
      page.drawText(formatEuro(item.unitPrice), { x: 435, y, size: 8, font: fontReg, color: dark });
      page.drawText(formatEuro(item.total), { x: 502, y, size: 8, font: fontBold, color: dark });
      y -= 18;
      // Trennlinie zwischen Positionen
      page.drawLine({ start: { x: 40, y: y + 4 }, end: { x: 555, y: y + 4 }, thickness: 0.5, color: rgb(0.93, 0.93, 0.93) });
    }

    // Summenbox
    y -= 10;
    const netto = (rechnung.total || 0) / 1.19;
    const mwst = (rechnung.total || 0) - netto;
    const brutto = rechnung.total || 0;

    page.drawLine({ start: { x: 350, y }, end: { x: 555, y }, thickness: 1, color: rgb(0.87, 0.91, 0.96) });
    y -= 16;
    page.drawText("Nettobetrag:", { x: 370, y, size: 9, font: fontReg, color: muted });
    page.drawText(formatEuro(netto), { x: 502, y, size: 9, font: fontReg, color: dark });
    y -= 14;
    page.drawText("MwSt. 19%:", { x: 370, y, size: 9, font: fontReg, color: muted });
    page.drawText(formatEuro(mwst), { x: 502, y, size: 9, font: fontReg, color: dark });
    y -= 14;
    page.drawLine({ start: { x: 350, y: y + 4 }, end: { x: 555, y: y + 4 }, thickness: 1, color: blue });
    y -= 14;
    page.drawRectangle({ x: 350, y: y - 6, width: 205, height: 24, color: dark });
    page.drawText("Gesamtbetrag:", { x: 360, y, size: 10, font: fontBold, color: white });
    page.drawText(formatEuro(brutto), { x: 490, y, size: 11, font: fontBold, color: blue });

    // Fußzeile
    page.drawLine({ start: { x: 40, y: 55 }, end: { x: 555, y: 55 }, thickness: 0.5, color: rgb(0.87, 0.91, 0.96) });
    page.drawText("ElektroGenius  ·  elektrogenius.de  ·  info@elektrogenius.de", { x: 40, y: 40, size: 8, font: fontReg, color: muted });
    page.drawText(`Rechnung ${rechnung.number}`, { x: 450, y: 40, size: 8, font: fontReg, color: muted });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Rechnung-${rechnung.number}.pdf"`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "PDF-Fehler" }, { status: 500 });
  }
}
