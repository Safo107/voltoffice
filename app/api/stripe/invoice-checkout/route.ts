import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth } from "@/lib/withAuth";

export const POST = withAuth(async (req, userId) => {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe nicht konfiguriert" }, { status: 503 });
  }

  try {
    const { invoiceId } = await req.json();
    if (!invoiceId) {
      return NextResponse.json({ error: "invoiceId fehlt" }, { status: 400 });
    }

    const db = await getDb();
    const invoice = await db.collection("rechnungen").findOne({ _id: new ObjectId(invoiceId), userId });
    if (!invoice) {
      return NextResponse.json({ error: "Rechnung nicht gefunden" }, { status: 404 });
    }
    if (invoice.status === "bezahlt") {
      return NextResponse.json({ error: "Rechnung ist bereits bezahlt" }, { status: 400 });
    }

    const brutto = invoice.grossAmount ?? invoice.total ?? 0;
    const amountCents = Math.round(brutto * 100);
    if (amountCents <= 0) {
      return NextResponse.json({ error: "Ungültiger Betrag" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://voltoffice.elektrogenius.de";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: amountCents,
            product_data: {
              name: `Rechnung ${invoice.number || invoiceId}`,
              description: invoice.betreff || invoice.customerName || undefined,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        invoiceId: String(invoiceId),
        userId,
        type: "invoice_payment",
      },
      customer_email: invoice.customerEmail || undefined,
      success_url: `${appUrl}/rechnungen?paid=${invoiceId}`,
      cancel_url: `${appUrl}/rechnungen`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[invoice-checkout]", e);
    return NextResponse.json({ error: "Checkout-Fehler" }, { status: 500 });
  }
});
