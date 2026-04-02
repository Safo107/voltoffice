import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getDb } from "@/lib/mongodb";

type Plan = "pro" | "business";

function getPriceId(plan: Plan): string {
  if (plan === "business") {
    return process.env.STRIPE_PRICE_ID_BUSINESS || "";
  }
  // "pro" — 19,99€/Monat (STRIPE_PRICE_ID_PRO muss in Vercel gesetzt sein)
  // Note: legacy STRIPE_PRICE_ID (9,99€) is kept in .env for grandfathered subscribers only
  return process.env.STRIPE_PRICE_ID_PRO || "";
}

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe nicht konfiguriert" }, { status: 503 });
  }

  try {
    const { uid, email, plan = "pro" } = await req.json() as { uid: string; email: string; plan?: Plan };

    if (!uid || !email) {
      return NextResponse.json({ error: "uid und email erforderlich" }, { status: 400 });
    }

    const priceId = getPriceId(plan);
    if (!priceId) {
      return NextResponse.json({ error: `Kein Stripe-Preis für Plan "${plan}" konfiguriert` }, { status: 503 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://voltoffice.elektrogenius.de";

    const db = await getDb();
    const userDoc = await db.collection("users").findOne({ uid });
    let customerId = userDoc?.stripeCustomerId as string | undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { userId: uid },
      });
      customerId = customer.id;
      await db.collection("users").updateOne(
        { uid },
        { $set: { uid, email, stripeCustomerId: customerId } },
        { upsert: true }
      );
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${appUrl}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/upgrade`,
      metadata: { userId: uid, plan },
      subscription_data: {
        metadata: { userId: uid, plan },
        trial_period_days: 14,
      },
      locale: "de",
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("Checkout Fehler:", err);
    return NextResponse.json({ error: "Checkout konnte nicht erstellt werden" }, { status: 500 });
  }
}
