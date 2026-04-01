import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid");
  if (!uid) return NextResponse.json({ pro: false, tier: "free", isTrial: false, trialDaysLeft: 0 });

  try {
    const db = await getDb();
    const user = await db.collection("users").findOne({ uid });

    const isPro = user?.pro === true;
    const tier: string = user?.subscriptionTier || "free";
    const trialEndsAt = user?.trialEndsAt ? new Date(user.trialEndsAt) : null;
    const now = new Date();
    const isTrial = tier === "trial" && trialEndsAt !== null && trialEndsAt > now;
    const trialDaysLeft = isTrial && trialEndsAt
      ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    return NextResponse.json({
      pro: isPro || isTrial,
      tier: isTrial ? "trial" : (isPro ? "pro" : "free"),
      isTrial,
      trialDaysLeft,
      trialEndsAt: trialEndsAt?.toISOString() || null,
    });
  } catch {
    return NextResponse.json({ pro: false, tier: "free", isTrial: false, trialDaysLeft: 0 });
  }
}
