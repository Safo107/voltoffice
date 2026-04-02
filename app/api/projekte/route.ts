import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { withAuth } from "@/lib/withAuth";
import { getPlanLimits, isWithinLimit } from "@/lib/planLimits";
import { getUserPlan } from "@/lib/getUserPlan";

export const GET = withAuth(async (_req, userId) => {
  try {
    const db = await getDb();
    const projekte = await db.collection("projekte").find({ userId }).sort({ createdAt: -1 }).toArray();
    return NextResponse.json(projekte);
  } catch {
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
});

export const POST = withAuth(async (req, userId) => {
  try {
    const db = await getDb();

    const plan = await getUserPlan(db, userId);
    const limits = getPlanLimits(plan);
    const count = await db.collection("projekte").countDocuments({ userId });

    if (!isWithinLimit(count, limits.projekte)) {
      return NextResponse.json(
        { error: "Limit erreicht", limitReached: true, limit: limits.projekte, count, resource: "projekte" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const doc = { ...body, userId, status: "active", createdAt: new Date().toISOString() };
    const result = await db.collection("projekte").insertOne(doc);
    return NextResponse.json({ ...doc, _id: result.insertedId }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Fehler beim Erstellen" }, { status: 500 });
  }
});
