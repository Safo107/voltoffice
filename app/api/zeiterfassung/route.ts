import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { withAuth } from "@/lib/withAuth";

export const GET = withAuth(async (_req, userId) => {
  try {
    console.log("[zeiterfassung] UID:", userId);
    const db = await getDb();
    const eintraege = await db
      .collection("zeiterfassung")
      .find({ userId })
      .sort({ date: -1 })
      .toArray();
    return NextResponse.json(eintraege);
  } catch {
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
});

export const POST = withAuth(async (req, userId) => {
  try {
    const body = await req.json();
    const db = await getDb();
    const doc = { ...body, userId, createdAt: new Date().toISOString() };
    const result = await db.collection("zeiterfassung").insertOne(doc);
    return NextResponse.json({ ...doc, _id: result.insertedId }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Fehler beim Erstellen" }, { status: 500 });
  }
});
