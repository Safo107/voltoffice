import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const filter = userId ? { userId } : {};
    const eintraege = await db
      .collection("zeiterfassung")
      .find(filter)
      .sort({ date: -1 })
      .toArray();
    return NextResponse.json(eintraege);
  } catch {
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = await getDb();
    const doc = { ...body, createdAt: new Date().toISOString() };
    const result = await db.collection("zeiterfassung").insertOne(doc);
    return NextResponse.json({ ...doc, _id: result.insertedId }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Fehler beim Erstellen" }, { status: 500 });
  }
}
