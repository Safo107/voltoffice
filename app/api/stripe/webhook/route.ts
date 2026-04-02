import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getDb } from "@/lib/mongodb";
import type Stripe from "stripe";
import type { Db } from "mongodb";

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe nicht konfiguriert" }, { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
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

      const filter = await resolveUserFilter(
        session.metadata as Record<string, string> | null,
        typeof session.customer === "string" ? session.customer : null,
        session.customer_details?.email || session.customer_email
      );

      if (filter) {
        const subId = typeof session.subscription === "string" ? session.subscription : null;
        await db.collection("users").updateOne(
          filter,
          {
            $set: {
              pro: true,
              subscriptionTier: "pro",
              proSince: new Date().toISOString(),
              ...(subId && { stripeSubscriptionId: subId }),
              ...(typeof session.customer === "string" && { stripeCustomerId: session.customer }),
            },
          },
          { upsert: true }
        );
        console.log(`✅ Pro aktiviert für filter=`, filter);
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

      const filter = await resolveUserFilter(
        subscription.metadata as Record<string, string> | null,
        typeof subscription.customer === "string" ? subscription.customer : null,
        null
      );

      if (filter) {
        const isActive = subscription.status === "active";
        const shouldDowngrade = ["canceled", "incomplete_expired", "unpaid"].includes(subscription.status);
        await db.collection("users").updateOne(
          filter,
          {
            $set: {
              pro: isActive,
              subscriptionTier: isActive ? "pro" : (shouldDowngrade ? "free" : "pro"),
              stripeSubscriptionStatus: subscription.status,
            },
          }
        );
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
  }

  return NextResponse.json({ received: true });
}
