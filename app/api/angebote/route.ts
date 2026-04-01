import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const angebote = await db.collection("angebote").find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json(angebote);
  } catch {
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = await getDb();

    // Angebotsnummer generieren (timestamp-basiert um Race Conditions zu vermeiden)
    const year = new Date().getFullYear();
    const number = `${year}-${Date.now().toString(36).toUpperCase().slice(-4)}`;

    const doc = {
      ...body,
      number,
      status: "draft",
      createdAt: new Date().toISOString(),
    };
    const result = await db.collection("angebote").insertOne(doc);
    return NextResponse.json({ ...doc, _id: result.insertedId }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Fehler beim Erstellen" }, { status: 500 });
  }
}
