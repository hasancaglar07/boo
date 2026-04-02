import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { audit } from "@/lib/auth/audit";
import { getAuthStateForUser } from "@/lib/auth/data";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .max(120)
    .refine((value) => value.length === 0 || value.length >= 2, {
      message: "Ad en az 2 karakter olmalı.",
    }),
  goal: z.string().trim().max(500),
  publisherImprint: z.string().trim().max(120).optional().default(""),
  publisherLogoUrl: z.string().trim().max(1_200_000).optional().default(""),
});

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Oturum gerekli." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message || "Geçersiz profil alanları." },
      { status: 400 },
    );
  }

  const currentState = await getAuthStateForUser(session.user.id, session.user.email || null);
  if (!currentState.authenticated) {
    return NextResponse.json({ ok: false, error: "Profil durumu yüklenemedi." }, { status: 500 });
  }

  const wantsBrandingUpdate = Boolean(parsed.data.publisherImprint || parsed.data.publisherLogoUrl);
  if (wantsBrandingUpdate && currentState.planId !== "pro") {
    return NextResponse.json(
      { ok: false, error: "Özel yayınevi logosu yalnızca Pro planında kullanılabilir." },
      { status: 403 },
    );
  }

  const updatedUser = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name || null,
      goal: parsed.data.goal,
      publisherImprint: currentState.planId === "pro" ? parsed.data.publisherImprint : undefined,
      publisherLogoUrl: currentState.planId === "pro" ? parsed.data.publisherLogoUrl : undefined,
    },
    select: {
      id: true,
      email: true,
      name: true,
      goal: true,
      publisherImprint: true,
      publisherLogoUrl: true,
    },
  });

  const state = await getAuthStateForUser(updatedUser.id, updatedUser.email);
  if (!state.authenticated) {
    return NextResponse.json({ ok: false, error: "Profil durumu yüklenemedi." }, { status: 500 });
  }

  await audit({
    action: "profile.updated",
    entityType: "user",
    entityId: updatedUser.id,
    actorUserId: updatedUser.id,
    request,
    metadata: {
      hasName: Boolean(parsed.data.name),
      hasGoal: Boolean(parsed.data.goal),
      hasPublisherBrand: Boolean(parsed.data.publisherImprint || parsed.data.publisherLogoUrl),
    },
  });

  return NextResponse.json({
    ok: true,
    viewer: {
      id: updatedUser.id,
      name: state.account.name,
      email: state.account.email,
      goal: state.account.goal,
      publisherImprint: state.account.publisherImprint,
      publisherLogoUrl: state.account.publisherLogoUrl,
      planId: state.planId,
      emailVerified: state.emailVerified,
      role: state.role,
      usage: {
        ...state.usage,
        resetAt: state.usage.resetAt?.toISOString() || null,
      },
    },
  });
}
