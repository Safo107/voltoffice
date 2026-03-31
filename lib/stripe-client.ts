import { loadStripe } from "@stripe/stripe-js";

const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
if (!key) throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY fehlt");

export const stripePromise = loadStripe(key);
