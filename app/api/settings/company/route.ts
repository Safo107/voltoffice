import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { withAuth } from "@/lib/withAuth";

export const GET = withAuth(async (_req, userId) => {
  try {
    const db = await getDb();
    const user = await db.collection("users").findOne({ uid: userId });
    return NextResponse.json({
      companyName:       user?.companyName       || "",
      companyAddress:    user?.companyAddress     || "",
      companyZip:        user?.companyZip         || "",
      companyCity:       user?.companyCity        || "",
      companyPhone:      user?.companyPhone       || "",
      companyEmail:      user?.companyEmail       || "",
      companyWebsite:    user?.companyWebsite     || "",
      taxNumber:         user?.taxNumber          || "",
      vatId:             user?.vatId              || "",
      companyLogoBase64: user?.companyLogoBase64  || null,
    });
  } catch {
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
});

export const PUT = withAuth(async (req, userId) => {
  try {
    const body = await req.json();
    const allowed = ["companyName", "companyAddress", "companyZip", "companyCity",
                     "companyPhone", "companyEmail", "companyWebsite", "taxNumber", "vatId"];
    const update: Record<string, string> = {};
    for (const key of allowed) {
      if (typeof body[key] === "string") update[key] = body[key];
    }
    const db = await getDb();
    await db.collection("users").updateOne(
      { uid: userId },
      { $set: { ...update, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Fehler beim Speichern" }, { status: 500 });
  }
});
