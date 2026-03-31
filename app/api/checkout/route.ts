import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getDb } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe nicht konfiguriert" }, { status: 503 });
  }

  try {
    const { uid, email } = await req.json();

    if (!uid || !email) {
      return NextResponse.json({ error: "uid und email erforderlich" }, { status: 400 });
    }

    const priceId = process.env.STRIPE_PRICE_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (!priceId) {
      return NextResponse.json({ error: "STRIPE_PRICE_ID nicht konfiguriert" }, { status: 500 });
    }

    const db = await getDb();
    const userDoc = await db.collection("users").findOne({ uid });
    let customerId = userDoc?.stripeCustomerId as string | undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { uid },
      });
      customerId = customer.id;
      await db.collection("users").updateOne(
        { uid },
        { $set: { uid, email, stripeCustomerId: customerId, createdAt: new Date() } },
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
      metadata: { uid },
      subscription_data: {
        metadata: { uid },
      },
      locale: "de",
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("Checkout Fehler:", err);
    return NextResponse.json({ error: "Checkout konnte nicht erstellt werden" }, { status: 500 });
  }
}
