import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { rateLimit } from "@/lib/rateLimit";

/** POST /api/2fa/setup
 *  Body: { uid: string, email: string }
 *  Returns: { secret: string, qrCode: string (data URL) }
 *  Secret ist noch NICHT in DB gespeichert – erst nach Verifikation via /verify
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(`2fa-setup:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: "Zu viele Anfragen. Bitte warten." }, { status: 429 });
  }

  try {
    const { uid, email } = await req.json();
    if (!uid) return NextResponse.json({ error: "uid fehlt" }, { status: 400 });

    const secret = speakeasy.generateSecret({
      length: 20,
      name: `VoltOffice (${email || uid})`,
      issuer: "VoltOffice",
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    return NextResponse.json({
      secret: secret.base32,
      qrCode,
    });
  } catch {
    return NextResponse.json({ error: "Fehler beim Setup" }, { status: 500 });
  }
}
