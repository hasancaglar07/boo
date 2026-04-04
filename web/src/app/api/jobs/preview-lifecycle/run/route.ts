import { NextResponse, type NextRequest } from "next/server";

import {
  listPreviewLifecycleCandidates,
  createPreviewCampaignToken,
  markPreviewLifecycleSent,
} from "@/lib/auth/data";
import {
  PREVIEW_MONTHLY_NUDGE_DAYS,
  PREVIEW_RECOVERY_DELAY_DAYS,
} from "@/lib/auth/constants";
import {
  sendPreviewReadyEmail,
  sendPreviewRecoveryEmail,
} from "@/lib/auth/mailer";
import { resolveAuthSecret } from "@/lib/auth/env";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const BACKEND_ORIGIN =
  process.env.DASHBOARD_ORIGIN ||
  process.env.NEXT_PUBLIC_DASHBOARD_ORIGIN ||
  "http://127.0.0.1:8765";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}

function isAuthorized(request: NextRequest) {
  if (process.env.NODE_ENV !== "production") return true;
  const expected = process.env.CRON_SECRET || resolveAuthSecret() || "";
  if (!expected) return false;
  const header = request.headers.get("authorization") || "";
  return header === `Bearer ${expected}`;
}

async function backendPreviewStatus(slug: string) {
  const response = await fetch(
    new URL(`/api/books/${encodeURIComponent(slug)}/preview`, BACKEND_ORIGIN),
    { cache: "no-store" },
  );
  const payload = (await response.json().catch(() => null)) as
    | {
        book?: { title?: string };
        generation?: { preview_ready?: boolean; first_chapter_ready?: boolean };
        preview?: { visible_sections?: unknown[] };
      }
    | null;
  if (!response.ok || !payload) return null;
  return payload;
}

async function recordLifecycleAnalytics(
  userId: string,
  eventName: "recovery_email_sent",
  properties: Record<string, unknown>,
) {
  await prisma.analyticsEvent.create({
    data: {
      userId,
      eventName,
      pathname: "/api/jobs/preview-lifecycle/run",
      properties: properties as never,
    },
  });
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  const now = Date.now();
  const candidates = await listPreviewLifecycleCandidates();
  const results: Array<Record<string, unknown>> = [];

  for (const candidate of candidates) {
    if (candidate.paid || candidate.optedOut || !candidate.email) {
      continue;
    }

    const preview = await backendPreviewStatus(candidate.slug);
    const previewReady = Boolean(
      preview?.generation?.preview_ready ||
        preview?.generation?.first_chapter_ready ||
        (preview?.preview?.visible_sections || []).length,
    );

    if (!previewReady) {
      continue;
    }

    const ageDays = Math.floor((now - candidate.createdAt.getTime()) / (24 * 60 * 60 * 1000));

    if (!candidate.previewReadySent) {
      const title = preview?.book?.title || candidate.slug;
      const token = await createPreviewCampaignToken({
        userId: candidate.userId,
        bookSlug: candidate.slug,
        lifecycleType: "preview_ready",
        metadata: { reason: "preview_ready" },
      });
      await sendPreviewReadyEmail({
        to: candidate.email,
        name: candidate.name,
        title,
        slug: candidate.slug,
        token,
      });
      await markPreviewLifecycleSent({
        userId: candidate.userId,
        bookSlug: candidate.slug,
        lifecycleType: "preview_ready",
        metadata: { sentFrom: "cron" },
      });
      results.push({ slug: candidate.slug, type: "preview_ready", status: "sent" });
      continue;
    }

    if (ageDays >= PREVIEW_RECOVERY_DELAY_DAYS && !candidate.recoverySent) {
      const title = preview?.book?.title || candidate.slug;
      const token = await createPreviewCampaignToken({
        userId: candidate.userId,
        bookSlug: candidate.slug,
        lifecycleType: "day10_recovery",
        metadata: { reason: "day10_recovery" },
      });
      await sendPreviewRecoveryEmail({
        to: candidate.email,
        name: candidate.name,
        title,
        token,
        stage: "day10",
      });
      await markPreviewLifecycleSent({
        userId: candidate.userId,
        bookSlug: candidate.slug,
        lifecycleType: "day10_recovery",
        metadata: { sentFrom: "cron" },
      });
      await recordLifecycleAnalytics(candidate.userId, "recovery_email_sent", {
        slug: candidate.slug,
        lifecycleType: "day10_recovery",
      });
      results.push({ slug: candidate.slug, type: "day10_recovery", status: "sent" });
      continue;
    }

    const dueForMonthlyNudge =
      ageDays >= PREVIEW_MONTHLY_NUDGE_DAYS &&
      (!candidate.lastMonthlyNudgeAt ||
        now - candidate.lastMonthlyNudgeAt.getTime() >= PREVIEW_MONTHLY_NUDGE_DAYS * 24 * 60 * 60 * 1000);

    if (dueForMonthlyNudge) {
      const title = preview?.book?.title || candidate.slug;
      const token = await createPreviewCampaignToken({
        userId: candidate.userId,
        bookSlug: candidate.slug,
        lifecycleType: "monthly_nudge",
        metadata: { reason: "monthly_nudge" },
      });
      await sendPreviewRecoveryEmail({
        to: candidate.email,
        name: candidate.name,
        title,
        token,
        stage: "monthly",
      });
      await markPreviewLifecycleSent({
        userId: candidate.userId,
        bookSlug: candidate.slug,
        lifecycleType: "monthly_nudge",
        metadata: { sentFrom: "cron" },
      });
      await recordLifecycleAnalytics(candidate.userId, "recovery_email_sent", {
        slug: candidate.slug,
        lifecycleType: "monthly_nudge",
      });
      results.push({ slug: candidate.slug, type: "monthly_nudge", status: "sent" });
    }
  }

  return NextResponse.json({
    ok: true,
    processed: candidates.length,
    sent: results.length,
    results,
  });
}
