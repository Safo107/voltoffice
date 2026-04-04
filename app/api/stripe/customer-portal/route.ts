import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getDb } from "@/lib/mongodb";
import { withAuth } from "@/lib/withAuth";

export const POST = withAuth(async (req, userId) => {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe nicht konfiguriert" }, { status: 503 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://voltoffice.elektrogenius.de";
    const redirectUrl = (body.returnUrl as string) || `${appUrl}/einstellungen`;

    const db = await getDb();
    const userDoc = await db.collection("users").findOne({ uid: userId });

    if (!userDoc) {
      return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 });
    }

    let customerId: string = userDoc.stripeCustomerId;

    // Kein Stripe-Customer vorhanden → automatisch anlegen und speichern
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userDoc.email || undefined,
        metadata: { uid: userId },
      });
      customerId = customer.id;
      await db.collection("users").updateOne(
        { uid: userId },
        { $set: { stripeCustomerId: customerId } }
      );
      console.log(`[customer-portal] Neuer Stripe Customer angelegt: ${customerId} für uid=${userId}`);
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: redirectUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    // Stripe-Fehlerdetails aus dem Error-Objekt extrahieren
    let stripeMessage = "Portal konnte nicht geöffnet werden";
    let stripeCode = "";

    if (err && typeof err === "object") {
      const e = err as Record<string, unknown>;
      if (typeof e.message === "string") stripeMessage = e.message;
      if (typeof e.code === "string") stripeCode = e.code;
      // Stripe-spezifische Fehlercodes leserlich machen
      if (stripeCode === "resource_missing" || stripeMessage.includes("portal configuration")) {
        stripeMessage = "Das Stripe Kundenportal ist noch nicht konfiguriert. Bitte im Stripe-Dashboard unter Einstellungen → Billing → Kundenportal aktivieren.";
      }
    }

    console.error("[customer-portal] Stripe-Fehler:", { stripeCode, stripeMessage, err });

    return NextResponse.json(
      { error: stripeMessage, code: stripeCode },
      { status: 500 }
    );
  }
});
