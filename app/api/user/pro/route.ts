import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid");
  if (!uid) return NextResponse.json({ pro: false, tier: "free", isTrial: false, trialDaysLeft: 0 });

  try {
    const db = await getDb();
    const user = await db.collection("users").findOne({ uid });

    const isPro = user?.pro === true;
    const storedTier: string = user?.subscriptionTier || "free";
    const trialEndsAt = user?.trialEndsAt ? new Date(user.trialEndsAt) : null;
    const now = new Date();
    const trialActive = storedTier === "trial" && trialEndsAt !== null && trialEndsAt > now;

    // Auto-downgrade expired trial to free in DB
    if (storedTier === "trial" && trialEndsAt !== null && trialEndsAt <= now) {
      await db.collection("users").updateOne(
        { uid },
        { $set: { subscriptionTier: "free" } }
      );
    }

    const plan: "free" | "pro" | "business" = isPro
      ? (user?.plan === "business" ? "business" : "pro")
      : "free";
    const tier = trialActive ? "trial" : plan;
    const isTrial = trialActive;
    const trialDaysLeft = isTrial && trialEndsAt
      ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    return NextResponse.json({
      pro: isPro || isTrial,
      plan,
      tier,
      isTrial,
      trialDaysLeft,
      trialEndsAt: trialEndsAt?.toISOString() || null,
      hasStripeCustomer: !!user?.stripeCustomerId,
      stripeSubscriptionStatus: user?.stripeSubscriptionStatus || null,
      lastPaymentFailed: user?.lastPaymentFailed || null,
      proSince: user?.proSince || null,
    });
  } catch {
    return NextResponse.json({ pro: false, tier: "free", isTrial: false, trialDaysLeft: 0 });
  }
}
