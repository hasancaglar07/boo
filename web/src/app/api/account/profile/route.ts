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

  const updatedUser = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name || null,
      goal: parsed.data.goal,
    },
    select: {
      id: true,
      email: true,
      name: true,
      goal: true,
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
    },
  });

  return NextResponse.json({
    ok: true,
    viewer: {
      id: updatedUser.id,
      name: state.account.name,
      email: state.account.email,
      goal: state.account.goal,
      planId: state.planId,
      emailVerified: state.emailVerified,
      role: state.role,
    },
  });
}
