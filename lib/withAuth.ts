import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "./firebase-admin";

export type AuthedHandler<C = undefined> = (
  req: NextRequest,
  userId: string,
  context: C
) => Promise<NextResponse>;

/** Wraps a route handler with Firebase token verification.
 *  Expects: Authorization: Bearer <firebase-id-token>
 */
export function withAuth<C = undefined>(handler: AuthedHandler<C>) {
  return async (req: NextRequest, context: C) => {
    try {
      const authHeader = req.headers.get("authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
      }
      const token = authHeader.split(" ")[1];

      if (!adminAuth) {
        // Dev-Fallback: wenn Firebase Admin nicht konfiguriert, UID aus Header lesen
        const uid = req.headers.get("x-uid");
        if (!uid) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
        return handler(req, uid, context);
      }

      const decoded = await adminAuth.verifyIdToken(token);
      return handler(req, decoded.uid, context);
    } catch {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
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
