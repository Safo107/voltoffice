import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const db = await getDb();
    await db.collection("material").updateOne(
      { _id: new ObjectId(params.id) },
      { $set: { ...body, updatedAt: new Date().toISOString() } }
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDb();
    await db.collection("material").deleteOne({ _id: new ObjectId(params.id) });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 });
  }
}
