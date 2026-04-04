import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type Stripe from "stripe";
import type { Db } from "mongodb";

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe nicht konfiguriert" }, { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET nicht konfiguriert" }, { status: 503 });
  }
  if (!sig) {
    return NextResponse.json({ error: "Webhook-Signatur fehlt" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unbekannt";
    console.error("Webhook Signatur ungültig:", msg);
    return NextResponse.json({ error: `Webhook Fehler: ${msg}` }, { status: 400 });
  }

  let db: Db;
  try {
    db = await getDb();
  } catch {
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }

  /**
   * Dreifache Fallback-Strategie:
   * 1. userId aus Session-Metadata (zuverlässigste Methode)
   * 2. stripeCustomerId → MongoDB Lookup
   * 3. customer_email → MongoDB Lookup
   * Gibt den DB-Filter zurück der den User findet.
   */
  async function resolveUserFilter(
    metadata: Record<string, string> | null,
    customerId?: string | null,
    customerEmail?: string | null
  ): Promise<Record<string, string> | null> {
    // 1. userId / uid aus Metadata (uid = alter Key, userId = neuer Key)
    const uid = metadata?.userId || metadata?.uid;
    if (uid) {
      console.log(`[webhook] Matched via metadata.userId=${uid}`);
      return { uid };
    }

    // 2. stripeCustomerId
    if (customerId) {
      const found = await db.collection("users").findOne({ stripeCustomerId: customerId });
      if (found?.uid) {
        console.log(`[webhook] Matched via stripeCustomerId=${customerId}`);
        return { uid: found.uid };
      }
    }

    // 3. Email
    if (customerEmail) {
      const found = await db.collection("users").findOne({ email: customerEmail });
      if (found?.uid) {
        console.log(`[webhook] Matched via email=${customerEmail}`);
        return { uid: found.uid };
      }
    }

    console.error("[webhook] Kein User-Match! metadata=", metadata, "customerId=", customerId, "email=", customerEmail);
    return null;
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const meta = session.metadata as Record<string, string> | null;

      // ── Invoice-Zahlung via Stripe ────────────────────────────────────────
      if (meta?.type === "invoice_payment" && meta?.invoiceId) {
        const invoiceId = meta.invoiceId;
        const now = new Date().toISOString();
        try {
          const invoiceDoc = await db.collection("rechnungen").findOne({ _id: new ObjectId(invoiceId) });
          if (invoiceDoc && invoiceDoc.status !== "bezahlt") {
            await db.collection("rechnungen").updateOne(
              { _id: new ObjectId(invoiceId) },
              { $set: { status: "bezahlt", paymentMethod: "stripe", paidAt: now, updatedAt: now } }
            );
            // Create income transaction (avoid duplicate)
            const alreadyBooked = await db.collection("transactions").findOne({ relatedInvoiceId: invoiceId });
            if (!alreadyBooked) {
              await db.collection("transactions").insertOne({
                userId: invoiceDoc.userId,
                type: "income",
                amount: invoiceDoc.grossAmount ?? invoiceDoc.total ?? 0,
                date: now,
                description: `Rechnung ${invoiceDoc.number || invoiceId} — ${invoiceDoc.customerName || ""}`,
                relatedInvoiceId: invoiceId,
                invoiceNumber: invoiceDoc.number || invoiceId,
                customerName: invoiceDoc.customerName || "",
                paymentMethod: "stripe",
                createdAt: now,
              });
            }
            console.log(`✅ Rechnung ${invoiceId} via Stripe bezahlt`);
          }
        } catch (e) {
          console.error("[webhook] Invoice-Zahlung Fehler:", e);
        }
        break;
      }

      // ── VoltOffice Abo Aktivierung ────────────────────────────────────────
      const filter = await resolveUserFilter(
        meta,
        typeof session.customer === "string" ? session.customer : null,
        session.customer_details?.email || session.customer_email
      );

      if (filter) {
        const subId = typeof session.subscription === "string" ? session.subscription : null;
        const plan: "pro" | "business" = (meta?.plan === "business") ? "business" : "pro";

        // Trial-Status aus der Subscription lesen
        let inTrial = false;
        let trialEndsAt: string | null = null;
        if (subId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subId);
            inTrial = sub.status === "trialing";
            if (sub.trial_end) {
              trialEndsAt = new Date(sub.trial_end * 1000).toISOString();
            }
          } catch (e) {
            console.warn("[webhook] Subscription-Abruf fehlgeschlagen:", e);
          }
        }

        await db.collection("users").updateOne(
          filter,
          {
            $set: {
              pro: true,
              plan,
              subscriptionTier: inTrial ? "trial" : plan,
              proSince: new Date().toISOString(),
              ...(inTrial && trialEndsAt && { trialEndsAt }),
              ...(!inTrial && { trialEndsAt: null }),
              ...(subId && { stripeSubscriptionId: subId }),
              ...(typeof session.customer === "string" && { stripeCustomerId: session.customer }),
            },
          },
          { upsert: true }
        );
        console.log(`✅ Plan "${plan}" (${inTrial ? "Trial bis " + trialEndsAt : "aktiv"}) für filter=`, filter);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;

      const filter = await resolveUserFilter(
        subscription.metadata as Record<string, string> | null,
        typeof subscription.customer === "string" ? subscription.customer : null,
        null
      );

      if (filter) {
        await db.collection("users").updateOne(
          filter,
          { $set: { pro: false, subscriptionTier: "free", proSince: null, stripeSubscriptionId: null } }
        );
        console.log(`❌ Pro deaktiviert für filter=`, filter);
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const subMeta = subscription.metadata as Record<string, string> | null;

      const filter = await resolveUserFilter(
        subMeta,
        typeof subscription.customer === "string" ? subscription.customer : null,
        null
      );

      if (filter) {
        const status = subscription.status;
        const isActive = status === "active" || status === "trialing";
        const inTrial = status === "trialing";
        const shouldDowngrade = ["canceled", "incomplete_expired", "unpaid"].includes(status);
        const plan: "pro" | "business" = (subMeta?.plan === "business") ? "business" : "pro";
        const trialEndsAt = subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null;

        await db.collection("users").updateOne(
          filter,
          {
            $set: {
              pro: isActive,
              stripeSubscriptionStatus: status,
              ...(isActive && {
                plan,
                subscriptionTier: inTrial ? "trial" : plan,
                ...(inTrial && trialEndsAt ? { trialEndsAt } : { trialEndsAt: null }),
              }),
              ...(shouldDowngrade && { plan: "free", subscriptionTier: "free", trialEndsAt: null }),
            },
          }
        );
        console.log(`🔄 Subscription ${status} → tier=${inTrial ? "trial" : plan} für filter=`, filter);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice & { customer?: string };
      const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
      if (customerId) {
        await db.collection("users").updateOne(
          { stripeCustomerId: customerId },
          { $set: { lastPaymentFailed: new Date().toISOString() } }
        );
        console.warn(`⚠️ Zahlung fehlgeschlagen für customer=${customerId}`);
      }
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice & { customer?: string };
      const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
      if (customerId) {
        await db.collection("users").updateOne(
          { stripeCustomerId: customerId },
          { $set: { lastPaymentFailed: null, lastPaymentSucceeded: new Date().toISOString() } }
        );
        console.log(`✅ Zahlung erfolgreich für customer=${customerId}`);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
