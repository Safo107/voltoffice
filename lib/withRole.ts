import { NextResponse } from "next/server";
import { getDb } from "./mongodb";
import { withAuth, type AuthedHandler } from "./withAuth";

/**
 * Wraps withAuth and additionally checks that the user has one of the required roles.
 * Users without a role field default to "admin" (existing account owners).
 */
export function withRole<C = unknown>(roles: string[], handler: AuthedHandler<C>) {
  return withAuth<C>(async (req, userId, context) => {
    try {
      const db = await getDb();
      const user = await db.collection("users").findOne({ uid: userId });
      // Default: "admin" for existing users without role field
      const role: string = user?.role || "admin";
      if (!roles.includes(role)) {
        return NextResponse.json(
          { error: `Keine Berechtigung. Erforderliche Rolle: ${roles.join(" oder ")}` },
          { status: 403 }
        );
      }
      return handler(req, userId, context);
    } catch {
      return NextResponse.json({ error: "Fehler bei der Rollenprüfung" }, { status: 500 });
    }
  });
}
