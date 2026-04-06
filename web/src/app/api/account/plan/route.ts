import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getEffectivePlanId } from "@/lib/auth/data";

export async function GET() {
  const session = await auth();
  const plan = await getEffectivePlanId(session?.user?.id || null);
  return NextResponse.json({ plan });
}
