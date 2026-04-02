import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth } from "@/lib/withAuth";

export const POST = withAuth(async (req, userId) => {
  try {
    const { documentId, type, signatureImage, signedBy } = await req.json();

    if (!documentId || !type || !signatureImage) {
      return NextResponse.json({ error: "Pflichtfelder fehlen" }, { status: 400 });
    }
    if (type !== "angebot" && type !== "rechnung") {
      return NextResponse.json({ error: "Ungültiger Dokumenttyp" }, { status: 400 });
    }

    const collection = type === "angebot" ? "angebote" : "rechnungen";
    const db = await getDb();

    const doc = await db.collection(collection).findOne({ _id: new ObjectId(documentId), userId });
    if (!doc) return NextResponse.json({ error: "Dokument nicht gefunden" }, { status: 404 });

    const now = new Date().toISOString();
    await db.collection(collection).updateOne(
      { _id: new ObjectId(documentId), userId },
      {
        $set: {
          signatureImage,
          signedAt: now,
          signedBy: signedBy || null,
          signatureStatus: "signed",
          locked: true,
          lockedAt: now,
          lockedBy: userId,
          updatedAt: now,
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Fehler beim Speichern der Unterschrift" }, { status: 500 });
  }
});
