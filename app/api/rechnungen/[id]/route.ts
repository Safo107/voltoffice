import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth } from "@/lib/withAuth";

type Context = { params: Promise<{ id: string }> };

export const PUT = withAuth<Context>(async (req, userId, { params }) => {
  try {
    const { id } = await params;
    const body = await req.json();
    const db = await getDb();
    const existing = await db.collection("rechnungen").findOne({ _id: new ObjectId(id), userId });
    if (!existing) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    if (existing.locked) return NextResponse.json({ error: "Dokument ist gesperrt und kann nicht bearbeitet werden." }, { status: 403 });
    const now = new Date().toISOString();
    await db.collection("rechnungen").updateOne(
      { _id: new ObjectId(id), userId },
      { $set: { ...body, updatedAt: now } }
    );

    // Automatische Transaktion bei Statuswechsel → bezahlt
    if (body.status === "bezahlt" && existing.status !== "bezahlt") {
      const alreadyBooked = await db.collection("transactions").findOne({ relatedInvoiceId: id, userId });
      if (!alreadyBooked) {
        await db.collection("transactions").insertOne({
          userId,
          type: "income",
          amount: existing.total || 0,
          date: now,
          description: `Rechnung ${existing.number || id} — ${existing.customerName || ""}`,
          relatedInvoiceId: id,
          invoiceNumber: existing.number || id,
          customerName: existing.customerName || "",
          createdAt: now,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 });
  }
});

export const DELETE = withAuth<Context>(async (_req, userId, { params }) => {
  try {
    const { id } = await params;
    const db = await getDb();
    await db.collection("rechnungen").deleteOne({ _id: new ObjectId(id), userId });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 });
  }
});
