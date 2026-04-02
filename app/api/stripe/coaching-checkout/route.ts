import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

const COACHING_PRODUCTS: Record<string, { name: string; price: number; description: string }> = {
  cv:          { name: "Lebenslauf-Check",    price: 1900, description: "Professioneller Check deines Lebenslaufs für Elektroberufe" },
  bewerbung:   { name: "Bewerbungspaket",     price: 3900, description: "Komplettes Bewerbungspaket inkl. Anschreiben & Lebenslauf" },
  ausbildung:  { name: "Ausbildungsplatz finden", price: 2900, description: "Gezielte Unterstützung bei der Suche nach einem Ausbildungsplatz" },
  call:        { name: "1:1 Beratung (Zoom)", price: 2500, description: "60-minütige persönliche Beratung per Zoom" },
};

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe nicht konfiguriert" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { productType, email } = body as { productType: string; email?: string };

    const product = COACHING_PRODUCTS[productType];
    if (!product) {
      return NextResponse.json({ error: "Unbekanntes Produkt" }, { status: 400 });
    }

    const coachingUrl = "https://coaching.elektrogenius.de";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: product.price,
            product_data: {
              name: product.name,
              description: product.description,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "coaching_payment",
        productType,
      },
      ...(email ? { customer_email: email } : {}),
      success_url: `${coachingUrl}/success.html?product=${productType}`,
      cancel_url: coachingUrl,
      locale: "de",
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[coaching-checkout]", e);
    return NextResponse.json({ error: "Checkout-Fehler" }, { status: 500 });
  }
}
