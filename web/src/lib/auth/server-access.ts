import { redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  canAccessBookPreview,
  canAccessFullBook,
  getGuestIdentityFromCookies,
  viewerFromIds,
} from "@/lib/auth/data";

export async function requireAuthenticatedUser(nextPath: string) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return session;
}

export async function requireAdminSession(nextPath: string) {
  const session = await requireAuthenticatedUser(nextPath);
  if (!session.user?.role || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    redirect("/app/library");
  }
  return session;
}

export async function requireSuperAdminSession(nextPath: string) {
  const session = await requireAdminSession(nextPath);
  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }
  return session;
}

export async function requireBookPreviewAccess(slug: string, nextPath: string) {
  const session = await auth();
  const guest = await getGuestIdentityFromCookies();
  const allowed = await canAccessBookPreview(viewerFromIds(session?.user?.id || null, guest?.id || null), slug);

  if (allowed) {
    return { session, guest };
  }

  if (!session?.user?.id && !guest) {
    redirect(`/signup/continue?slug=${encodeURIComponent(slug)}&next=${encodeURIComponent(nextPath)}`);
  }

  redirect("/app/library");
}

export async function requireBookWorkspaceAccess(slug: string, nextPath: string) {
  const session = await requireAuthenticatedUser(nextPath);
  const ownsBook = await canAccessBookPreview(viewerFromIds(session.user?.id || null, null), slug);

  if (!ownsBook) {
    redirect("/app/library");
  }

  const fullAccess = await canAccessFullBook(session.user?.id || null, slug);
  if (!fullAccess) {
    redirect(`/app/book/${encodeURIComponent(slug)}/upgrade`);
  }

  return session;
}
