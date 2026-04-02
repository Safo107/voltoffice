import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";
import { getDb } from "@/lib/mongodb";
import { decrypt } from "@/lib/encrypt";
import { rateLimit } from "@/lib/rateLimit";

/** POST /api/2fa/disable
 *  Body: { uid: string, token: string }
 *  Requires a valid TOTP code to disable 2FA (prevents lockout attacks)
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(`2fa-disable:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: "Zu viele Anfragen." }, { status: 429 });
  }

  try {
    const { uid, token } = await req.json();
    if (!uid || !token) {
      return NextResponse.json({ error: "uid und token erforderlich" }, { status: 400 });
    }

    const db = await getDb();
    const user = await db.collection("users").findOne({ uid });

    if (!user?.twoFactorEnabled || !user?.twoFactorSecret) {
      return NextResponse.json({ error: "2FA ist nicht aktiviert" }, { status: 400 });
    }

    const secret = decrypt(user.twoFactorSecret);
    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!verified) {
      return NextResponse.json({ error: "Ungültiger Code. 2FA bleibt aktiv." }, { status: 400 });
    }

    await db.collection("users").updateOne(
      { uid },
      {
        $unset: { twoFactorSecret: "", backupCodes: "" },
        $set: { twoFactorEnabled: false },
      }
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Fehler beim Deaktivieren" }, { status: 500 });
  }
}
