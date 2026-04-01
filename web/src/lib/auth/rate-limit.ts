import { prisma } from "@/lib/prisma";

type RateLimitInput = {
  scope: string;
  key: string;
  max: number;
  windowMs: number;
};

export async function consumeRateLimit(input: RateLimitInput) {
  const now = new Date();
  const windowStart = new Date(Math.floor(now.getTime() / input.windowMs) * input.windowMs);
  const expiresAt = new Date(windowStart.getTime() + input.windowMs);

  await prisma.rateLimitCounter.deleteMany({
    where: {
      expiresAt: { lte: now },
    },
  });

  const existing = await prisma.rateLimitCounter.findUnique({
    where: {
      scope_key_windowStart: {
        scope: input.scope,
        key: input.key,
        windowStart,
      },
    },
  });

  if (!existing) {
    await prisma.rateLimitCounter.create({
      data: {
        scope: input.scope,
        key: input.key,
        windowStart,
        expiresAt,
        count: 1,
      },
    });
    return {
      allowed: true,
      remaining: Math.max(0, input.max - 1),
      retryAfterSeconds: Math.ceil((expiresAt.getTime() - now.getTime()) / 1000),
    };
  }

  if (existing.count >= input.max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((expiresAt.getTime() - now.getTime()) / 1000),
    };
  }

  const updated = await prisma.rateLimitCounter.update({
    where: { id: existing.id },
    data: { count: { increment: 1 } },
  });

  return {
    allowed: true,
    remaining: Math.max(0, input.max - updated.count),
    retryAfterSeconds: Math.ceil((expiresAt.getTime() - now.getTime()) / 1000),
  };
}
