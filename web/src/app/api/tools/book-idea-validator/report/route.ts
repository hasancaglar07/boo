import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { EMAIL_ACTION_RATE_LIMIT } from "@/lib/auth/constants";
import { audit } from "@/lib/auth/audit";
import { normalizeEmail } from "@/lib/auth/crypto";
import { getGuestIdentityFromCookies } from "@/lib/auth/data";
import { sendBookIdeaReportEmail } from "@/lib/auth/mailer";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  topic: z.string().trim().min(9).max(600),
  audience: z.string().trim().min(6).max(300),
  goal: z.string().trim().min(9).max(300),
  intent: z.enum(["lead_magnet", "authority_book", "paid_guide", "kdp_publish", "not_sure"]),
  language: z.enum(["turkish", "english", "multilingual", "other"]),
  materials: z.enum(["none", "notes", "content", "framework"]),
  score: z.number().int().min(0).max(100).optional(),
});

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message || "Geçersiz report isteği." },
      { status: 400 },
    );
  }

  const session = await auth();
  const guest = await getGuestIdentityFromCookies();
  const email = normalizeEmail(parsed.data.email);

  const rateLimit = await consumeRateLimit({
    scope: "book-idea-validator-report",
    key: `${email}:${guest?.id || session?.user?.id || "anon"}`,
    ...EMAIL_ACTION_RATE_LIMIT,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Çok fazla rapor istedin. Biraz sonra tekrar dene." },
      { status: 429 },
    );
  }

  const payload = {
    topic: parsed.data.topic,
    audience: parsed.data.audience,
    goal: parsed.data.goal,
    intent: parsed.data.intent,
    language: parsed.data.language,
    materials: parsed.data.materials,
  } as const;

  await sendBookIdeaReportEmail({
    to: email,
    payload,
  });

  await prisma.analyticsEvent.create({
    data: {
      eventName: "tool_full_report_delivered",
      pathname: "/tools/book-idea-validator",
      userId: session?.user?.id || null,
      guestIdentityId: guest?.id || null,
      properties: {
        tool: "book_idea_validator",
        email,
        score: parsed.data.score ?? null,
        intent: parsed.data.intent,
        language: parsed.data.language,
      } as never,
    },
  });

  await audit({
    action: "tool.book_idea_validator.report_requested",
    entityType: "tool_report",
    entityId: email,
    actorUserId: session?.user?.id || null,
    guestIdentityId: guest?.id || null,
    request,
    metadata: {
      tool: "book_idea_validator",
      score: parsed.data.score ?? null,
      intent: parsed.data.intent,
      language: parsed.data.language,
      topic: parsed.data.topic,
    },
  });

  return NextResponse.json({ ok: true });
}
