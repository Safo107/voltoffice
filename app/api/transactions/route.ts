import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { withAuth } from "@/lib/withAuth";

export const GET = withAuth(async (req, userId) => {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "income" | "expense" | null (all)
    const year  = searchParams.get("year");

    const db = await getDb();
    const filter: Record<string, unknown> = { userId };
    if (type) filter.type = type;
    if (year) {
      const y = parseInt(year, 10);
      filter.date = {
        $gte: new Date(y, 0, 1).toISOString(),
        $lt:  new Date(y + 1, 0, 1).toISOString(),
      };
    }

    const items = await db.collection("transactions").find(filter).sort({ date: -1 }).limit(200).toArray();
    return NextResponse.json(items);
  } catch {
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
});

// Manuellen Eintrag erstellen (z. B. Ausgaben)
export const POST = withAuth(async (req, userId) => {
  try {
    const body = await req.json();
    const { type, amount, date, description } = body;
    if (!type || !amount || !date) {
      return NextResponse.json({ error: "type, amount und date sind Pflichtfelder" }, { status: 400 });
    }
    if (type !== "income" && type !== "expense") {
      return NextResponse.json({ error: "type muss 'income' oder 'expense' sein" }, { status: 400 });
    }
    const db = await getDb();
    const now = new Date().toISOString();
    const doc = { userId, type, amount: Number(amount), date, description: description || "", createdAt: now };
    const result = await db.collection("transactions").insertOne(doc);
    return NextResponse.json({ ...doc, _id: result.insertedId }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Fehler beim Erstellen" }, { status: 500 });
  }
});
