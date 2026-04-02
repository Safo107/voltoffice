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

    const priceId = process.env.STRIPE_PRICE_ID || "price_1THakKEktxCnIq0C0Gz5DLKT";
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
      // userId in ALLEN Metadata-Feldern für sichere Webhook-Zuordnung
      metadata: { userId: uid },
      subscription_data: {
        metadata: { userId: uid },
      },
      locale: "de",
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("Checkout Fehler:", err);
    return NextResponse.json({ error: "Checkout konnte nicht erstellt werden" }, { status: 500 });
  }
}
