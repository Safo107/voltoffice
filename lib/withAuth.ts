import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "./firebase-admin";

export type AuthedHandler<C = unknown> = (
  req: NextRequest,
  userId: string,
  context: C
) => Promise<NextResponse>;

/** Wraps a route handler with Firebase token verification.
 *  Expects: Authorization: Bearer <firebase-id-token>
 */
export function withAuth<C = unknown>(handler: AuthedHandler<C>) {
  return async (req: NextRequest, context: C) => {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.warn(`[withAuth] 401 – Kein Bearer-Header. URL: ${req.nextUrl.pathname}`);
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];

    if (!adminAuth) {
      // Dev-Fallback: nur in Development erlaubt
      if (process.env.NODE_ENV === "production") {
        console.error("[withAuth] Firebase Admin nicht konfiguriert – FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY prüfen!");
        return NextResponse.json({ error: "Firebase Admin nicht konfiguriert" }, { status: 503 });
      }
      const uid = req.headers.get("x-uid");
      if (!uid) return NextResponse.json({ error: "Nicht autorisiert (Dev: x-uid Header fehlt)" }, { status: 401 });
      console.warn(`[withAuth] DEV-FALLBACK aktiv – UID aus x-uid Header: ${uid}`);
      return handler(req, uid, context);
    }

    try {
      const decoded = await adminAuth.verifyIdToken(token, /* checkRevoked */ true);
      return handler(req, decoded.uid, context);
    } catch (err: unknown) {
      const code = (err as Record<string, unknown>)?.["errorInfo"]
        ? ((err as Record<string, unknown>)["errorInfo"] as Record<string, unknown>)["code"]
        : (err as Record<string, unknown>)?.["code"];
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[withAuth] Token-Verifikation fehlgeschlagen. URL: ${req.nextUrl.pathname} | Code: ${String(code)} | Fehler: ${message}`);

      // Bei widerrufenen Tokens spezifischere Meldung
      if (String(code) === "auth/id-token-revoked") {
        return NextResponse.json({ error: "Sitzung abgelaufen – bitte neu einloggen", code: "token_revoked" }, { status: 401 });
      }
      return NextResponse.json({ error: "Nicht autorisiert", code: String(code) }, { status: 401 });
    }
  };
}

/** Soft-verify: returns UID or null (non-blocking, for optional auth) */
export async function getAuthUser(req: NextRequest): Promise<string | null> {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token || !adminAuth) return null;
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}
