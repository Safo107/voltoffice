import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { withAuth } from "@/lib/withAuth";

export const GET = withAuth(async (req, userId) => {
  try {
    console.log("[material] UID:", userId);
    const { searchParams } = new URL(req.url);
    const projektId = searchParams.get("projektId");
    const db = await getDb();
    const filter = projektId ? { userId, projektId } : { userId };
    const items = await db
      .collection("material")
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json(items);
  } catch {
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
});

export const POST = withAuth(async (req, userId) => {
  try {
    const body = await req.json();
    const db = await getDb();
    const doc = { ...body, userId, createdAt: new Date().toISOString() };
    const result = await db.collection("material").insertOne(doc);
    const savedDoc = { ...doc, _id: result.insertedId };

    // Auto-Rechnung: nur wenn Preis vorhanden und Projekt bekannt
    if (doc.preis && doc.projektId && doc.preis > 0) {
      try {
        await upsertMaterialInvoice(db, doc, userId);
      } catch {
        // Rechnungs-Update ist non-blocking – Materialeintrag trotzdem gespeichert
      }
    }

    return NextResponse.json(savedDoc, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Fehler beim Erstellen" }, { status: 500 });
  }
});

async function upsertMaterialInvoice(
  db: Awaited<ReturnType<typeof import("@/lib/mongodb").getDb>>,
  material: { projektId: string; name: string; menge: number; einheit?: string; preis: number },
  userId: string
) {
  const { ObjectId } = await import("mongodb");
  let customerName = "—";
  let projektTitel = "";
  try {
    const proj = await db.collection("projekte").findOne({ _id: new ObjectId(material.projektId), userId });
    customerName = proj?.customerName || "—";
    projektTitel = proj?.title || "";
  } catch { /* ObjectId Fehler ignorieren */ }

  const newItem = {
    beschreibung: material.name,
    menge: material.menge ?? 1,
    einheit: material.einheit || "Stk.",
    einzelpreis: material.preis,
    gesamt: (material.menge ?? 1) * material.preis,
    typ: "material",
  };

  // Bestehende Entwurfs-Rechnung für dieses Projekt suchen (user-scoped)
  const existing = await db.collection("rechnungen").findOne({
    userId,
    projektId: material.projektId,
    status: "entwurf",
  });

  if (existing) {
    const items = [...(existing.items || []), newItem];
    const total = items.reduce((s: number, i: { gesamt: number }) => s + (i.gesamt || 0), 0);
    await db.collection("rechnungen").updateOne(
      { _id: existing._id, userId },
      { $set: { items, total, updatedAt: new Date().toISOString() } }
    );
  } else {
    const year = new Date().getFullYear();
    const number = `RE-${year}-${Date.now().toString(36).toUpperCase().slice(-4)}`;
    await db.collection("rechnungen").insertOne({
      number,
      userId,
      projektId: material.projektId,
      customerName,
      betreff: projektTitel ? `Material – ${projektTitel}` : "Material",
      items: [newItem],
      total: newItem.gesamt,
      status: "entwurf",
      abrechnungsart: "pauschal",
      createdAt: new Date().toISOString(),
    });
  }
}
