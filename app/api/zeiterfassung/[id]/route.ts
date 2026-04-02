import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth } from "@/lib/withAuth";

type Context = { params: Promise<{ id: string }> };

export const DELETE = withAuth<Context>(async (_req, userId, { params }) => {
  try {
    const { id } = await params;
    const db = await getDb();
    await db.collection("zeiterfassung").deleteOne({ _id: new ObjectId(id), userId });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 });
  }
});
