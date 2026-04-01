import type { UserRole } from "@prisma/client";

import { normalizeEmail } from "@/lib/auth/crypto";
import { prisma } from "@/lib/prisma";

function configuredAdminEmails() {
  const raw = process.env.ADMIN_EMAILS || process.env.AUTH_ADMIN_EMAILS || "";
  return new Set(
    raw
      .split(",")
      .map((item) => normalizeEmail(item))
      .filter(Boolean),
  );
}

export function getAuthProviderAvailability() {
  return {
    google: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
    magicLink: true,
    credentials: true,
  };
}

export async function resolveBootstrapRole(email: string): Promise<UserRole> {
  const normalizedEmail = normalizeEmail(email);
  const adminEmails = configuredAdminEmails();

  if (adminEmails.has(normalizedEmail)) {
    return "SUPER_ADMIN";
  }

  if (process.env.NODE_ENV !== "production") {
    const existingAdminCount = await prisma.user.count({
      where: {
        role: {
          in: ["ADMIN", "SUPER_ADMIN"],
        },
      },
    });

    if (existingAdminCount === 0) {
      return "SUPER_ADMIN";
    }
  }

  return "USER";
}

export async function ensureBootstrapAdmin(userId: string, email?: string | null): Promise<UserRole> {
  if (!email) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return user?.role || "USER";
  }

  const nextRole = await resolveBootstrapRole(email);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    return nextRole;
  }

  if (user.role === nextRole || nextRole === "USER") {
    return user.role;
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role: nextRole },
    select: { role: true },
  });

  return updated.role;
}
