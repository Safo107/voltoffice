import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getDb } from "@/lib/mongodb";
import type Stripe from "stripe";

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

  let db;
  try {
    db = await getDb();
  } catch {
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const uid = session.metadata?.uid;
      if (uid) {
        await db.collection("users").updateOne(
          { uid },
          {
            $set: {
              pro: true,
              proSince: new Date(),
              stripeSubscriptionId: session.subscription as string,
            },
          },
          { upsert: true }
        );
        console.log(`✅ Pro aktiviert für uid=${uid}`);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const uid = subscription.metadata?.uid;
      if (uid) {
        await db.collection("users").updateOne(
          { uid },
          { $set: { pro: false, proSince: null, stripeSubscriptionId: null } }
        );
        console.log(`❌ Pro deaktiviert für uid=${uid}`);
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const uid = subscription.metadata?.uid;
      const isActive = subscription.status === "active";
      if (uid) {
        await db.collection("users").updateOne(
          { uid },
          { $set: { pro: isActive } }
        );
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
