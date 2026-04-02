import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const { uid, email } = await req.json();
    if (!uid) return NextResponse.json({ error: "uid fehlt" }, { status: 400 });

    const db = await getDb();
    const existing = await db.collection("users").findOne({ uid });
    if (existing) return NextResponse.json({ ok: true });

    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    await db.collection("users").insertOne({
      uid,
      email: email || "",
      subscriptionTier: "trial",
      trialEndsAt,
      pro: false,
      role: "admin",
      createdAt: new Date(),
    });

    return NextResponse.json({ ok: true, trialEndsAt });
  } catch {
    return NextResponse.json({ error: "Initialisierung fehlgeschlagen" }, { status: 500 });
  }
}
