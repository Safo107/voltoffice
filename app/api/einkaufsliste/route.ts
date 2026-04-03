import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { withAuth } from "@/lib/withAuth";
import { ObjectId } from "mongodb";

// GET: Alle Materialien mit verbraucht:true (= Einkaufsliste) + Projektname
export const GET = withAuth(async (_req, userId) => {
  try {
    const db = await getDb();

    // Business-Plan: auch Mitarbeiter-UIDs einschließen (future-ready)
    const user = await db.collection("users").findOne({ uid: userId });
    const isBusiness = user?.plan === "business" || user?.subscriptionTier === "business";

    const uids: string[] = [userId];
    if (isBusiness) {
      const members = await db
        .collection("users")
        .find({ companyAdminId: userId })
        .project({ uid: 1 })
        .toArray();
      uids.push(...members.map((m) => m.uid as string).filter(Boolean));
    }

    // Materialien wo verbraucht = true
    const materials = await db
      .collection("material")
      .find({ userId: { $in: uids }, verbraucht: true })
      .sort({ createdAt: -1 })
      .toArray();

    // Projektnamen auflösen
    const projektIds = [
      ...new Set(materials.map((m) => m.projektId).filter(Boolean)),
    ];

    const projekte =
      projektIds.length > 0
        ? await db
            .collection("projekte")
            .find({
              _id: {
                $in: projektIds
                  .map((id) => {
                    try {
                      return new ObjectId(id as string);
                    } catch {
                      return null;
                    }
                  })
                  .filter(Boolean) as ObjectId[],
              },
            })
            .project({ _id: 1, title: 1 })
            .toArray()
        : [];

    const projektMap = Object.fromEntries(
      projekte.map((p) => [p._id.toString(), p.title as string || "Projekt"])
    );

    const items = materials.map((m) => ({
      ...m,
      _id: m._id.toString(),
      projektName: projektMap[m.projektId as string] || "Projekt",
    }));

    return NextResponse.json(items);
  } catch {
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
});

// PATCH: Material als eingekauft markieren (verbraucht: false)
export const PATCH = withAuth(async (req, userId) => {
  try {
    const { materialId } = await req.json();
    if (!materialId) {
      return NextResponse.json({ error: "materialId fehlt" }, { status: 400 });
    }

    const db = await getDb();

    // Business: auch Team-Materialien erlaubt
    const user = await db.collection("users").findOne({ uid: userId });
    const isBusiness = user?.plan === "business" || user?.subscriptionTier === "business";

    let uidFilter: unknown = userId;
    if (isBusiness) {
      const members = await db
        .collection("users")
        .find({ companyAdminId: userId })
        .project({ uid: 1 })
        .toArray();
      const uids = [userId, ...members.map((m) => m.uid as string).filter(Boolean)];
      uidFilter = { $in: uids };
    }

    await db.collection("material").updateOne(
      { _id: new ObjectId(materialId as string), userId: uidFilter },
      { $set: { verbraucht: false, updatedAt: new Date().toISOString() } }
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 });
  }
});
