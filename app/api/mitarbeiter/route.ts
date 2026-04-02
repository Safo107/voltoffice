import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { withAuth } from "@/lib/withAuth";
import { withRole } from "@/lib/withRole";

export const GET = withAuth(async (_req, userId) => {
  try {
    console.log("[mitarbeiter] UID:", userId);
    const db = await getDb();
    const mitarbeiter = await db.collection("mitarbeiter").find({ userId }).sort({ createdAt: -1 }).toArray();
    return NextResponse.json(mitarbeiter);
  } catch {
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
});

export const POST = withRole(["admin"], async (req, userId) => {
  try {
    const body = await req.json();
    const db = await getDb();
    const doc = { ...body, userId, createdAt: new Date().toISOString() };
    const result = await db.collection("mitarbeiter").insertOne(doc);
    return NextResponse.json({ ...doc, _id: result.insertedId }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Fehler beim Erstellen" }, { status: 500 });
  }
});
