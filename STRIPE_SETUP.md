# Stripe Setup — VoltOffice

## Umgebungsvariablen (Vercel)

Alle Keys unter **Vercel → Settings → Environment Variables** eintragen:

| Variable | Wert | Wo finden |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_...` | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Stripe Dashboard → Developers → Webhooks → Endpoint |
| `STRIPE_PRICE_ID` | `price_...` | Stripe Dashboard → Products → VoltOffice Pro → Price ID |
| `NEXT_PUBLIC_APP_URL` | `https://voltoffice.elektrogenius.de` | Eigene Domain |

## Stripe Dashboard Setup

1. **Produkt anlegen:** Products → Add product
   - Name: `VoltOffice Pro`
   - Preis: `9,99 € / Monat` (recurring)
   - → Price ID kopieren → `STRIPE_PRICE_ID`

2. **Webhook anlegen:** Developers → Webhooks → Add endpoint
   - URL: `https://voltoffice.elektrogenius.de/api/stripe/webhook`
   - Events auswählen:
     - `checkout.session.completed`
     - `customer.subscription.deleted`
     - `customer.subscription.updated`
   - → Signing secret kopieren → `STRIPE_WEBHOOK_SECRET`

## Checkout Flow (Frontend)

```typescript
const res = await fetch("/api/checkout", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ uid: user.uid, email: user.email }),
});
const { url } = await res.json();
window.location.href = url; // Weiterleitung zu Stripe
```

## Was passiert nach Zahlung

- Stripe sendet `checkout.session.completed` → Webhook setzt `subscriptionTier: "pro"`, `pro: true`
- Bei Kündigung: `customer.subscription.deleted` → Webhook setzt `subscriptionTier: "free"`, `pro: false`
