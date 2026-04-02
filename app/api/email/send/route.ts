import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { resend, FROM } from "@/lib/resend";
import { withAuth } from "@/lib/withAuth";
import { getCompanyData } from "@/lib/getCompanyData";

export const POST = withAuth(async (req: NextRequest, userId) => {
  try {
    const { documentId, type, to, subject, message } = await req.json();

    if (!documentId || !type || !to || !subject) {
      return NextResponse.json({ error: "Pflichtfelder fehlen (documentId, type, to, subject)" }, { status: 400 });
    }
    if (type !== "angebot" && type !== "rechnung") {
      return NextResponse.json({ error: "Ungültiger Dokumenttyp" }, { status: 400 });
    }
    if (!to.includes("@")) {
      return NextResponse.json({ error: "Ungültige E-Mail-Adresse" }, { status: 400 });
    }

    const collection = type === "angebot" ? "angebote" : "rechnungen";
    const db = await getDb();

    const doc = await db.collection(collection).findOne({ _id: new ObjectId(documentId), userId });
    if (!doc) return NextResponse.json({ error: "Dokument nicht gefunden" }, { status: 404 });

    // Firmendaten für E-Mail-Text laden
    const company = await getCompanyData(userId);

    // PDF intern abrufen — Auth-Header weiterleiten
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://voltoffice.elektrogenius.de";
    const pdfPath = type === "angebot"
      ? `/api/angebote/${documentId}/pdf`
      : `/api/rechnungen/${documentId}/pdf`;

    const authHeader = req.headers.get("authorization") || "";
    const pdfRes = await fetch(`${appUrl}${pdfPath}`, {
      headers: { Authorization: authHeader },
    });

    if (!pdfRes.ok) {
      return NextResponse.json({ error: "PDF konnte nicht generiert werden" }, { status: 500 });
    }

    const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
    const docNumber = String(doc.number || documentId);
    const filename = type === "angebot" ? `Angebot-${docNumber}.pdf` : `Rechnung-${docNumber}.pdf`;

    const firmenname = company.companyName || String(doc.firmenname || "Ihr Betrieb");

    const htmlBody = message
      ? `<div style="font-family:Arial,sans-serif;font-size:14px;color:#222;line-height:1.6">${message.replace(/\n/g, "<br>")}</div>`
      : `<div style="font-family:Arial,sans-serif;font-size:14px;color:#222;line-height:1.6">
          <p>Sehr geehrte Damen und Herren,</p>
          <p>anbei erhalten Sie ${type === "angebot" ? "Angebot" : "Rechnung"} Nr. <strong>${docNumber}</strong>.</p>
          <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
          <p>Mit freundlichen Grüßen<br><strong>${firmenname}</strong></p>
        </div>`;

    await resend.emails.send({
      from: FROM,
      to,
      subject,
      html: htmlBody,
      attachments: [
        {
          filename,
          content: pdfBuffer,
        },
      ],
    });

    // Versand-Status im Dokument speichern
    const now = new Date().toISOString();
    await db.collection(collection).updateOne(
      { _id: new ObjectId(documentId), userId },
      {
        $set: {
          sentAt: now,
          sentTo: to,
          emailStatus: "sent",
          updatedAt: now,
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[email/send] Fehler:", err);
    return NextResponse.json({ error: "E-Mail konnte nicht gesendet werden" }, { status: 500 });
  }
});
