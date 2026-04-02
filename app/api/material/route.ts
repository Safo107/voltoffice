import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projektId = searchParams.get("projektId");
    const db = await getDb();
    const items = await db
      .collection("material")
      .find(projektId ? { projektId } : {})
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json(items);
  } catch {
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = await getDb();
    const doc = { ...body, createdAt: new Date().toISOString() };
    const result = await db.collection("material").insertOne(doc);
    return NextResponse.json({ ...doc, _id: result.insertedId }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Fehler beim Erstellen" }, { status: 500 });
  }
}
