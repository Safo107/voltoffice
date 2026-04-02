import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { withAuth } from "@/lib/withAuth";

// GET — alle Notifications des Users
export const GET = withAuth(async (_req, userId) => {
  try {
    const db = await getDb();
    const items = await db
      .collection("notifications")
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
    return NextResponse.json(items);
  } catch {
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
});

// PUT — alle als gelesen markieren
export const PUT = withAuth(async (_req, userId) => {
  try {
    const db = await getDb();
    await db.collection("notifications").updateMany(
      { userId, read: false },
      { $set: { read: true, readAt: new Date().toISOString() } }
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
});
