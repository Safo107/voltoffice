import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { withAuth } from "@/lib/withAuth";

const MAX_BYTES = 200 * 1024; // 200 KB

export const POST = withAuth(async (req: NextRequest, userId) => {
  try {
    const formData = await req.formData();
    const file = formData.get("logo") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Keine Datei übermittelt" }, { status: 400 });
    }

    const mime = file.type;
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(mime)) {
      return NextResponse.json({ error: "Nur PNG, JPG, WebP oder GIF erlaubt" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: "Logo zu groß (max. 200 KB)" }, { status: 400 });
    }

    const base64 = `data:${mime};base64,${buffer.toString("base64")}`;

    const db = await getDb();
    await db.collection("users").updateOne(
      { uid: userId },
      { $set: { companyLogoBase64: base64, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );

    return NextResponse.json({ success: true, logoUrl: base64 });
  } catch {
    return NextResponse.json({ error: "Upload fehlgeschlagen" }, { status: 500 });
  }
});
