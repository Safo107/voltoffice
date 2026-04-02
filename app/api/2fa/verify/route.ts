import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";
import { randomBytes } from "crypto";
import { getDb } from "@/lib/mongodb";
import { encrypt } from "@/lib/encrypt";
import { rateLimit } from "@/lib/rateLimit";

/** POST /api/2fa/verify
 *  Body: { uid: string, secret: string, token: string }
 *  Verifies TOTP, then saves encrypted secret + backup codes to DB.
 *  Returns: { ok: boolean, backupCodes: string[] }
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(`2fa-verify:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Zu viele Anfragen. Bitte warten." }, { status: 429 });
  }

  try {
    const { uid, secret, token } = await req.json();
    if (!uid || !secret || !token) {
      return NextResponse.json({ error: "uid, secret und token erforderlich" }, { status: 400 });
    }

    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!verified) {
      return NextResponse.json({ error: "Ungültiger Code. Bitte erneut versuchen." }, { status: 400 });
    }

    // Backup-Codes generieren (8 Stück, je 8 Zeichen)
    const backupCodes = Array.from({ length: 8 }, () =>
      randomBytes(4).toString("hex").toUpperCase()
    );

    const db = await getDb();
    await db.collection("users").updateOne(
      { uid },
      {
        $set: {
          twoFactorEnabled: true,
          twoFactorSecret: encrypt(secret),
          backupCodes,
          twoFactorEnabledAt: new Date().toISOString(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ ok: true, backupCodes });
  } catch {
    return NextResponse.json({ error: "Fehler bei der Verifikation" }, { status: 500 });
  }
}
