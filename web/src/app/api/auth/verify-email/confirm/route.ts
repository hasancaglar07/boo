import { NextResponse, type NextRequest } from "next/server";
import { encode } from "next-auth/jwt";

import { audit } from "@/lib/auth/audit";
import { hashToken } from "@/lib/auth/crypto";
import { resolveAuthSecret } from "@/lib/auth/env";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/seo";

const authSecret = resolveAuthSecret();

function isLocalOrPrivateHostname(hostname: string) {
  const normalized = hostname.toLowerCase();

  if (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "0.0.0.0" ||
    normalized === "::1" ||
    normalized.endsWith(".local")
  ) {
    return true;
  }

  if (/^10\.\d+\.\d+\.\d+$/.test(normalized)) return true;
  if (/^192\.168\.\d+\.\d+$/.test(normalized)) return true;

  const private172Match = normalized.match(/^172\.(\d{1,2})\.\d+\.\d+$/);
  if (private172Match) {
    const octet = Number(private172Match[1]);
    if (octet >= 16 && octet <= 31) return true;
  }

  return false;
}

function resolvePublicOrigin(request: NextRequest) {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host")?.trim() || request.nextUrl.host;
  const protocol = forwardedProto || request.nextUrl.protocol.replace(/:$/, "") || "https";

  if (host) {
    try {
      const candidate = new URL(`${protocol}://${host}`);
      if (!isLocalOrPrivateHostname(candidate.hostname)) {
        return candidate.origin;
      }
    } catch {
      // fallback below
    }
  }

  return new URL(absoluteUrl("/")).origin;
}

function loginRedirectUrl(request: NextRequest, verified: "0" | "1") {
  const url = new URL("/login", resolvePublicOrigin(request));
  url.searchParams.set("verified", verified);
  return url;
}

function appLibraryRedirectUrl(request: NextRequest) {
  return new URL("/app/library", resolvePublicOrigin(request));
}

function sessionCookieConfig(request: NextRequest) {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const secure =
    forwardedProto === "https" ||
    request.nextUrl.protocol === "https:" ||
    process.env.NODE_ENV === "production";

  return {
    secure,
    name: `${secure ? "__Secure-" : ""}authjs.session-token`,
  };
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  if (!token) {
    return NextResponse.redirect(loginRedirectUrl(request, "0"));
  }

  const record = await prisma.emailVerificationToken.findUnique({
    where: {
      tokenHash: hashToken(token),
    },
  });

  if (!record || record.expiresAt <= new Date()) {
    return NextResponse.redirect(loginRedirectUrl(request, "0"));
  }

  const verifiedAt = new Date();
  const [user] = await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: verifiedAt, lastLoginAt: verifiedAt },
      select: {
        id: true,
        email: true,
        name: true,
        goal: true,
        role: true,
        emailVerified: true,
      },
    }),
    prisma.emailVerificationToken.delete({
      where: { id: record.id },
    }),
  ]);
  await audit({
    action: "email-verification.completed",
    entityType: "user",
    entityId: record.userId,
    actorUserId: record.userId,
    request,
  });

  if (!authSecret) {
    return NextResponse.redirect(loginRedirectUrl(request, "1"));
  }

  const cookie = sessionCookieConfig(request);
  const encoded = await encode({
    secret: authSecret,
    salt: cookie.name,
    maxAge: 30 * 24 * 60 * 60,
    token: {
      sub: user.id,
      email: user.email,
      name: user.name || user.email.split("@")[0] || "Book Creator",
      goal: user.goal || "",
      role: user.role,
      emailVerified: user.emailVerified ? user.emailVerified.toISOString() : verifiedAt.toISOString(),
    },
  });

  const response = NextResponse.redirect(appLibraryRedirectUrl(request));
  response.cookies.set(cookie.name, encoded, {
    httpOnly: true,
    sameSite: "lax",
    secure: cookie.secure,
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
  return response;
}
