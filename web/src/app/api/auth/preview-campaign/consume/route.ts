import { NextResponse, type NextRequest } from "next/server";
import { encode } from "next-auth/jwt";

import { audit } from "@/lib/auth/audit";
import { resolvePreviewCampaignToken } from "@/lib/auth/data";
import { prisma } from "@/lib/prisma";

const authSecret =
  process.env.AUTH_SECRET ||
  (process.env.NODE_ENV !== "production" ? "book-generator-dev-secret" : undefined);

function sessionCookieName(request: NextRequest) {
  const secure = request.nextUrl.protocol === "https:" || process.env.NODE_ENV === "production";
  return {
    secure,
    name: `${secure ? "__Secure-" : ""}authjs.session-token`,
  };
}

function requestOrigin(request: NextRequest) {
  const protocol =
    request.headers.get("x-forwarded-proto") ||
    request.nextUrl.protocol.replace(/:$/, "") ||
    "http";
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    request.nextUrl.host;
  return `${protocol}://${host}`;
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  const origin = requestOrigin(request);
  const loginUrl = new URL("/login", origin);
  if (!token || !authSecret) {
    loginUrl.searchParams.set("error", "PreviewLink");
    return NextResponse.redirect(loginUrl);
  }

  const record = await resolvePreviewCampaignToken(token);
  if (!record?.user) {
    loginUrl.searchParams.set("error", "PreviewExpired");
    return NextResponse.redirect(loginUrl);
  }

  await prisma.user.update({
    where: { id: record.user.id },
    data: { lastLoginAt: new Date() },
  });

  const cookie = sessionCookieName(request);
  const encoded = await encode({
    secret: authSecret,
    salt: cookie.name,
    maxAge: 30 * 24 * 60 * 60,
    token: {
      sub: record.user.id,
      email: record.user.email,
      name: record.user.name || record.user.email.split("@")[0] || "Book Creator",
      goal: record.user.goal || "",
      role: record.user.role,
      emailVerified: record.user.emailVerified ? record.user.emailVerified.toISOString() : null,
    },
  });

  await audit({
    action: "login.success",
    entityType: "user",
    entityId: record.user.id,
    actorUserId: record.user.id,
    request,
    metadata: {
      provider: "preview_campaign",
      bookSlug: record.bookSlug,
      lifecycleType: record.lifecycleType,
    },
  });

  await prisma.analyticsEvent.create({
    data: {
      userId: record.user.id,
      eventName: "recovery_email_clicked",
      pathname: `/app/book/${record.bookSlug}/preview`,
      properties: {
        slug: record.bookSlug,
        lifecycleType: record.lifecycleType,
      } as never,
    },
  });

  const previewUrl = new URL(`/app/book/${encodeURIComponent(record.bookSlug)}/preview`, origin);
  previewUrl.searchParams.set("reentry", "email");

  const response = NextResponse.redirect(previewUrl);
  response.cookies.set(cookie.name, encoded, {
    httpOnly: true,
    sameSite: "lax",
    secure: cookie.secure,
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
  return response;
}
