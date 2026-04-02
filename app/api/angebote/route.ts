import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { withAuth } from "@/lib/withAuth";
import { getPlanLimits, isWithinLimit } from "@/lib/planLimits";
import { getUserPlan } from "@/lib/getUserPlan";

export const GET = withAuth(async (_req, userId) => {
  try {
    const db = await getDb();
    const angebote = await db.collection("angebote").find({ userId }).sort({ createdAt: -1 }).toArray();
    return NextResponse.json(angebote);
  } catch {
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
});

export const POST = withAuth(async (req, userId) => {
  try {
    const db = await getDb();

    const plan = await getUserPlan(db, userId);
    const limits = getPlanLimits(plan);
    const count = await db.collection("angebote").countDocuments({ userId });

    if (!isWithinLimit(count, limits.angebote)) {
      return NextResponse.json(
        { error: "Limit erreicht", limitReached: true, limit: limits.angebote, count, resource: "angebote" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const year = new Date().getFullYear();
    const number = `${year}-${Date.now().toString(36).toUpperCase().slice(-4)}`;
    const doc = { ...body, userId, number, status: "draft", createdAt: new Date().toISOString() };
    const result = await db.collection("angebote").insertOne(doc);
    return NextResponse.json({ ...doc, _id: result.insertedId }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Fehler beim Erstellen" }, { status: 500 });
  }
});
