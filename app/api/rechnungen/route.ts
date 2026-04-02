import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { withAuth } from "@/lib/withAuth";
import { nextInvoiceNumber } from "@/lib/invoiceCounter";
import { getPlanLimits, isWithinLimit } from "@/lib/planLimits";
import { getUserPlan } from "@/lib/getUserPlan";

export const GET = withAuth(async (_req, userId) => {
  try {
    console.log("[rechnungen] UID:", userId);
    const db = await getDb();
    const rechnungen = await db.collection("rechnungen").find({ userId }).sort({ createdAt: -1 }).toArray();
    return NextResponse.json(rechnungen);
  } catch {
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
});

export const POST = withAuth(async (req, userId) => {
  try {
    const db = await getDb();

    const plan = await getUserPlan(db, userId);
    const limits = getPlanLimits(plan);

    if (limits.rechnungen === 0) {
      return NextResponse.json(
        { error: "Rechnungen sind im Free-Plan nicht verfügbar.", limitReached: true, resource: "rechnungen" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { number, invoiceYear, invoiceIndex } = await nextInvoiceNumber(db, userId);

    const doc = {
      ...body,
      userId,
      number,
      invoiceYear,
      invoiceIndex,
      status: "offen",
      createdAt: new Date().toISOString(),
    };
    const result = await db.collection("rechnungen").insertOne(doc);
    return NextResponse.json({ ...doc, _id: result.insertedId }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Fehler beim Erstellen" }, { status: 500 });
  }
});
