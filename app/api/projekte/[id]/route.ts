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
    await db.collection("projekte").updateOne(
      { _id: new ObjectId(id), userId },
      { $set: { ...body, updatedAt: new Date().toISOString() } }
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 });
  }
});

export const DELETE = withAuth<Context>(async (_req, userId, { params }) => {
  try {
    const { id } = await params;
    const db = await getDb();
    await db.collection("projekte").deleteOne({ _id: new ObjectId(id), userId });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 });
  }
});
