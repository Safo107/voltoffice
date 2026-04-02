import { Db } from "mongodb";
import type { PlanName } from "./planLimits";

/**
 * Loads the user's plan ("free" | "pro" | "business") from the DB.
 * Trial users are treated as "pro" for limit purposes.
 */
export async function getUserPlan(db: Db, userId: string): Promise<PlanName> {
  const user = await db.collection("users").findOne({ uid: userId });
  if (!user) return "free";

  const isPro = user.pro === true;
  const storedTier: string = user.subscriptionTier || "free";

  // Trial = pro access
  if (storedTier === "trial") {
    const trialEnd = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
    if (trialEnd && trialEnd > new Date()) return "pro";
  }

  if (!isPro) return "free";
  if (user.plan === "business") return "business";
  return "pro";
}
