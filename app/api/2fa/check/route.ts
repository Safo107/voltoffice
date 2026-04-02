import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";
import { getDb } from "@/lib/mongodb";
import { decrypt } from "@/lib/encrypt";
import { rateLimit } from "@/lib/rateLimit";

/** POST /api/2fa/check
 *  Body: { uid: string, token: string }
 *  Used during login flow to verify TOTP code.
 *  Returns: { ok: boolean }
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(`2fa-check:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Zu viele Versuche. Bitte warten." }, { status: 429 });
  }

  try {
    const { uid, token } = await req.json();
    if (!uid || !token) {
      return NextResponse.json({ error: "uid und token erforderlich" }, { status: 400 });
    }

    const db = await getDb();
    const user = await db.collection("users").findOne({ uid });

    if (!user?.twoFactorEnabled || !user?.twoFactorSecret) {
      // 2FA nicht aktiviert – Login erlauben
      return NextResponse.json({ ok: true });
    }

    // Backup-Code Check
    if (user.backupCodes?.includes(token.toUpperCase())) {
      // Backup-Code einmalig verbrauchen
      await db.collection("users").updateOne(
        { uid },
        { $pull: { backupCodes: token.toUpperCase() } } as never
      );
      return NextResponse.json({ ok: true, usedBackupCode: true });
    }

    // TOTP Check
    const secret = decrypt(user.twoFactorSecret);
    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!verified) {
      return NextResponse.json({ error: "Ungültiger Code." }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Fehler bei der 2FA-Prüfung" }, { status: 500 });
  }
}

/** GET /api/2fa/check?uid=xxx
 *  Check if 2FA is enabled for a user (for login flow)
 */
export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid");
  if (!uid) return NextResponse.json({ enabled: false });

  try {
    const db = await getDb();
    const user = await db.collection("users").findOne({ uid });
    return NextResponse.json({ enabled: !!user?.twoFactorEnabled });
  } catch {
    return NextResponse.json({ enabled: false });
  }
}
