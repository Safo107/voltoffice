import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid");
  if (!uid) return NextResponse.json({ pro: false });

  try {
    const db = await getDb();
    const user = await db.collection("users").findOne({ uid });
    return NextResponse.json({ pro: user?.pro === true });
  } catch {
    return NextResponse.json({ pro: false });
  }
}
