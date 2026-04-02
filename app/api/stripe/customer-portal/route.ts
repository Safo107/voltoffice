import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getDb } from "@/lib/mongodb";
import { withAuth } from "@/lib/withAuth";

export const POST = withAuth(async (req, userId) => {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe nicht konfiguriert" }, { status: 503 });
  }

  try {
    const { returnUrl } = await req.json();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://voltoffice.elektrogenius.de";
    const redirectUrl = returnUrl || `${appUrl}/einstellungen`;

    const db = await getDb();
    const userDoc = await db.collection("users").findOne({ uid: userId });

    if (!userDoc?.stripeCustomerId) {
      return NextResponse.json(
        { error: "Kein Stripe-Konto gefunden. Bitte zuerst ein Abo abschließen." },
        { status: 404 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: userDoc.stripeCustomerId,
      return_url: redirectUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("[customer-portal] Fehler:", err);
    return NextResponse.json({ error: "Portal konnte nicht geöffnet werden" }, { status: 500 });
  }
});
