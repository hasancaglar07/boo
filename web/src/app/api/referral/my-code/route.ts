import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/auth";
import { generateUniqueCode } from "@/lib/referral";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://kitapol.com";

export async function GET(_request: NextRequest) {
  void _request;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  let referralCode = await prisma.referralCode.findUnique({ where: { userId } });

  if (!referralCode) {
    const code = await generateUniqueCode(prisma);
    referralCode = await prisma.referralCode.create({
      data: { userId, code },
    });
  }

  return NextResponse.json({
    ok: true,
    code: referralCode.code,
    clicks: referralCode.clicks,
    referralUrl: `${BASE_URL}/?ref=${referralCode.code}`,
  });
}
