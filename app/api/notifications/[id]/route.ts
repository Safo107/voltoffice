import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth } from "@/lib/withAuth";

type Context = { params: Promise<{ id: string }> };

// PUT — einzelne Notification als gelesen markieren
export const PUT = withAuth<Context>(async (_req, userId, { params }) => {
  try {
    const { id } = await params;
    const db = await getDb();
    await db.collection("notifications").updateOne(
      { _id: new ObjectId(id), userId },
      { $set: { read: true, readAt: new Date().toISOString() } }
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
});
