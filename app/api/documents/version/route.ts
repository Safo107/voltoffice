import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth } from "@/lib/withAuth";

export const POST = withAuth(async (req, userId) => {
  try {
    const { documentId, type } = await req.json();

    if (!documentId || !type) {
      return NextResponse.json({ error: "Pflichtfelder fehlen" }, { status: 400 });
    }
    if (type !== "angebot" && type !== "rechnung") {
      return NextResponse.json({ error: "Ungültiger Dokumenttyp" }, { status: 400 });
    }

    const collection = type === "angebot" ? "angebote" : "rechnungen";
    const db = await getDb();

    const original = await db.collection(collection).findOne({ _id: new ObjectId(documentId), userId });
    if (!original) return NextResponse.json({ error: "Dokument nicht gefunden" }, { status: 404 });

    // Strip _id and signature/lock fields — neue Version startet clean
    const { _id, signatureImage, signedAt, signedBy, signatureStatus, locked, lockedAt, lockedBy, ...rest } = original;

    const currentVersion = typeof original.version === "number" ? original.version : 1;
    const year = new Date().getFullYear();
    const suffix = Date.now().toString(36).toUpperCase().slice(-4);
    const newNumber = type === "angebot"
      ? `ANG-${year}-${suffix}`
      : `RE-${year}-${suffix}`;

    const newDoc = {
      ...rest,
      number: newNumber,
      userId,
      version: currentVersion + 1,
      parentDocumentId: String(_id),
      status: type === "angebot" ? "draft" : "offen",
      locked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await db.collection(collection).insertOne(newDoc);

    return NextResponse.json({ success: true, newId: String(result.insertedId), number: newNumber, version: newDoc.version });
  } catch {
    return NextResponse.json({ error: "Fehler beim Erstellen der neuen Version" }, { status: 500 });
  }
});
