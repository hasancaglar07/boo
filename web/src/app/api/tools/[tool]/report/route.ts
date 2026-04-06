import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { EMAIL_ACTION_RATE_LIMIT } from "@/lib/auth/constants";
import { audit } from "@/lib/auth/audit";
import { normalizeEmail } from "@/lib/auth/crypto";
import { getGuestIdentityFromCookies } from "@/lib/auth/data";
import { sendGenericMarketingToolReportEmail } from "@/lib/auth/mailer";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { getGenericMarketingToolBySlug, type MarketingToolValues } from "@/lib/marketing-tools";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  values: z.record(z.string(), z.string()),
});

function validateToolValues(values: MarketingToolValues, toolSlug: string) {
  const tool = getGenericMarketingToolBySlug(toolSlug);
  if (!tool) {
    return { tool: null, error: "Tool not found." };
  }

  for (const field of tool.fields) {
    const value = values[field.name] || "";
    if (field.type === "select") {
      const allowedValues = new Set(field.options.map((option) => option.value));
      if (!allowedValues.has(value)) {
        return { tool: null, error: `${field.label} field has an invalid selection.` };
      }
      continue;
    }

    if (value.trim().length < field.minLength) {
      return { tool: null, error: `Please fill in the ${field.label} field more clearly.` };
    }
  }

  return { tool, error: "" };
}

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tool: string }> },
) {
  const { tool: toolSlug } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message || "Invalid report request." },
      { status: 400 },
    );
  }

  const validation = validateToolValues(parsed.data.values, toolSlug);
  if (!validation.tool) {
    return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });
  }

  const session = await auth();
  const guest = await getGuestIdentityFromCookies();
  const email = normalizeEmail(parsed.data.email);
  const result = validation.tool.evaluate(parsed.data.values);

  const rateLimit = await consumeRateLimit({
    scope: "marketing-tool-report",
    key: `${validation.tool.id}:${email}:${guest?.id || session?.user?.id || "anon"}`,
    ...EMAIL_ACTION_RATE_LIMIT,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many report requests. Please try again later." },
      { status: 429 },
    );
  }

  await sendGenericMarketingToolReportEmail({
    to: email,
    toolSlug: validation.tool.slug,
    values: parsed.data.values,
  });

  await prisma.analyticsEvent.create({
    data: {
      eventName: "tool_full_report_delivered",
      pathname: validation.tool.path,
      userId: session?.user?.id || null,
      guestIdentityId: guest?.id || null,
      properties: {
        tool: validation.tool.id,
        email,
        score: result.overallScore,
      } as never,
    },
  });

  await audit({
    action: `tool.${validation.tool.id}.report_requested`,
    entityType: "tool_report",
    entityId: email,
    actorUserId: session?.user?.id || null,
    guestIdentityId: guest?.id || null,
    request,
    metadata: {
      tool: validation.tool.id,
      score: result.overallScore,
      primaryInput:
        parsed.data.values.topic ||
        parsed.data.values.assetSummary ||
        parsed.data.values.niche ||
        parsed.data.values.expertise ||
        parsed.data.values.title ||
        null,
    },
  });

  return NextResponse.json({ ok: true });
}