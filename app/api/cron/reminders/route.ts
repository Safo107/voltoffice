import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

// Vercel Cron: täglich 08:00 Uhr
// Authorization: Bearer ${CRON_SECRET}
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }
  }

  try {
    const db = await getDb();
    const now = new Date();
    const nowIso = now.toISOString();
    let created = 0;

    // Hilfsfunktion: Notification erstellen, wenn noch keine ungelesene für diese Kombination existiert
    async function upsertNotification(
      userId: string,
      type: string,
      relatedId: string,
      relatedType: string,
      title: string,
      message: string,
      severity: "critical" | "warning" | "info"
    ) {
      const existing = await db.collection("notifications").findOne({
        userId, type, relatedId, read: false,
      });
      if (!existing) {
        await db.collection("notifications").insertOne({
          userId, type, relatedId, relatedType,
          title, message, severity,
          read: false,
          createdAt: nowIso,
        });
        created++;
      }
    }

    // Alle User holen (nur UIDs)
    const users = await db.collection("users").find({}, { projection: { uid: 1 } }).toArray();

    for (const user of users) {
      const uid: string = user.uid;
      if (!uid) continue;

      // ── 1. Überfällige Rechnungen ────────────────────────────────────────────
      const overdueInvoices = await db.collection("rechnungen").find({
        userId: uid,
        status: { $nin: ["bezahlt", "storniert"] },
        dueDate: { $lt: nowIso },
      }).toArray();

      for (const inv of overdueInvoices) {
        await upsertNotification(
          uid,
          "overdue_invoice",
          String(inv._id),
          "rechnung",
          "Rechnung überfällig",
          `Rechnung #${inv.number || inv._id} (${(inv.total || 0).toLocaleString("de-DE")} €) ist seit ${
            inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("de-DE") : "unbekannt"
          } überfällig.`,
          "critical"
        );
      }

      // ── 2. Bald fällige Rechnungen (in 2 Tagen) ─────────────────────────────
      const in2Days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
      const soonInvoices = await db.collection("rechnungen").find({
        userId: uid,
        status: { $nin: ["bezahlt", "storniert"] },
        dueDate: { $gte: nowIso, $lte: in2Days },
      }).toArray();

      for (const inv of soonInvoices) {
        await upsertNotification(
          uid,
          "payment_reminder",
          String(inv._id),
          "rechnung",
          "Rechnung bald fällig",
          `Rechnung #${inv.number || inv._id} (${(inv.total || 0).toLocaleString("de-DE")} €) wird am ${
            inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("de-DE") : "?"
          } fällig.`,
          "warning"
        );
      }

      // ── 3. Nicht versendete Angebote (Draft, älter als 3 Tage) ───────────────
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const unsentOffers = await db.collection("angebote").find({
        userId: uid,
        status: "draft",
        createdAt: { $lt: threeDaysAgo },
      }).toArray();

      for (const offer of unsentOffers) {
        await upsertNotification(
          uid,
          "unsent_offer",
          String(offer._id),
          "angebot",
          "Angebot noch nicht versendet",
          `Angebot #${offer.number || offer._id} für ${offer.customerName || "Unbekannt"} wurde noch nicht versendet (erstellt ${
            offer.createdAt ? new Date(offer.createdAt).toLocaleDateString("de-DE") : "?"
          }).`,
          "warning"
        );
      }

      // ── 3. Projekte ohne Zeiterfassung > 2 Tage ──────────────────────────────
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
      const activeProjects = await db.collection("projekte").find({
        userId: uid,
        status: "active",
      }).toArray();

      for (const proj of activeProjects) {
        const lastEntry = await db.collection("zeiterfassung").findOne(
          { userId: uid, projektId: String(proj._id) },
          { sort: { date: -1 } }
        );
        const lastDate: string | null = lastEntry?.date || lastEntry?.createdAt || null;
        if (!lastDate || lastDate < twoDaysAgo) {
          await upsertNotification(
            uid,
            "inactive_project",
            String(proj._id),
            "projekt",
            "Projekt ohne Aktivität",
            `Projekt "${proj.title || proj._id}" hat seit mehr als 2 Tagen keine Zeiterfassung.`,
            "info"
          );
        }
      }
    }

    return NextResponse.json({ success: true, created, checkedUsers: users.length });
  } catch (err: unknown) {
    console.error("[cron/reminders] Fehler:", err);
    return NextResponse.json({ error: "Cron-Job fehlgeschlagen" }, { status: 500 });
  }
}
