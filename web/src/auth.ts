/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Email from "next-auth/providers/email";
import Google from "next-auth/providers/google";
import type { UserRole } from "@prisma/client";
import { z } from "zod";

import { ensureBootstrapAdmin } from "@/lib/auth/bootstrap";
import { EMAIL_ACTION_RATE_LIMIT, LOGIN_RATE_LIMIT, MAGIC_LINK_TTL_SECONDS } from "@/lib/auth/constants";
import { audit } from "@/lib/auth/audit";
import { findUserByEmail } from "@/lib/auth/data";
import { normalizeEmail, verifyPasswordHash } from "@/lib/auth/crypto";
import { sendMagicLinkEmail } from "@/lib/auth/mailer";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const authSecret =
  process.env.AUTH_SECRET ||
  (process.env.NODE_ENV !== "production" ? "book-generator-dev-secret" : undefined);
const authEmailServer = process.env.AUTH_EMAIL_SERVER || "smtp://127.0.0.1:2525";

const providers: any[] = [
  Email({
    id: "email",
    name: "Magic Link",
    maxAge: MAGIC_LINK_TTL_SECONDS,
    server: authEmailServer,
    from: process.env.AUTH_EMAIL_FROM || "Book Generator <noreply@bookgenerator.local>",
    async sendVerificationRequest({ identifier, url }) {
      const rateLimit = await consumeRateLimit({
        scope: "magic-link-send",
        key: normalizeEmail(identifier),
        ...EMAIL_ACTION_RATE_LIMIT,
      });
      if (!rateLimit.allowed) {
        throw new Error("Magic link sınırına ulaşıldı.");
      }
      await sendMagicLinkEmail(identifier, url);
    },
  }),
  Credentials({
    name: "Email ve Şifre",
    credentials: {
      email: { label: "E-posta", type: "email" },
      password: { label: "Şifre", type: "password" },
    },
    async authorize(rawCredentials) {
      const parsed = credentialsSchema.safeParse(rawCredentials);
      if (!parsed.success) {
        throw new Error("Geçersiz giriş bilgileri.");
      }

      const email = normalizeEmail(parsed.data.email);
      const rateLimit = await consumeRateLimit({
        scope: "login",
        key: email,
        ...LOGIN_RATE_LIMIT,
      });
      if (!rateLimit.allowed) {
        throw new Error("Çok fazla giriş denemesi yapıldı. Lütfen daha sonra tekrar dene.");
      }

      const user = await findUserByEmail(email);
      if (!user?.passwordHash) {
        throw new Error("E-posta veya şifre hatalı.");
      }

      const valid = await verifyPasswordHash(parsed.data.password, user.passwordHash);
      if (!valid) {
        throw new Error("E-posta veya şifre hatalı.");
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        goal: user.goal,
        emailVerified: user.emailVerified,
        role: user.role,
      };
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.unshift(
    Google({
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

const nextAuth = NextAuth as any;

export const { handlers, auth, signIn, signOut } = nextAuth({
  adapter: PrismaAdapter(prisma) as any,
  secret: authSecret,
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  pages: {
    signIn: "/login",
    verifyRequest: "/login?checkEmail=1",
  },
  providers,
  callbacks: {
    async signIn({ user }: { user: any }) {
      if (user?.id) {
        await ensureBootstrapAdmin(user.id, user.email || null);
      }
      return true;
    },
    async jwt({ token, user }: { token: any; user: any }) {
      if (user?.id) {
        token.sub = user.id;
        token.goal = user.goal || "";
        token.role = user.role || "USER";
        token.emailVerified = user.emailVerified ? user.emailVerified.toISOString() : null;
      }

      return token;
    },
    async session({ session, user, token }: { session: any; user: any; token: any }) {
      const userId = user?.id || token?.sub || null;
      const dbUser = userId
        ? await prisma.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              goal: true,
              emailVerified: true,
              role: true,
            },
          })
        : null;

      if (session.user) {
        session.user.id = userId || "";
        session.user.goal = dbUser?.goal || user?.goal || token?.goal || "";
        session.user.emailVerified = dbUser?.emailVerified
          ? dbUser.emailVerified.toISOString()
          : user?.emailVerified
            ? user.emailVerified.toISOString()
            : (token?.emailVerified ?? null);
        session.user.role = ((dbUser?.role || user?.role || token?.role || "USER") as UserRole);
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account, isNewUser }: { user: any; account: any; isNewUser: boolean }) {
      await audit({
        action: isNewUser ? "signup.completed" : "login.success",
        entityType: "user",
        entityId: user.id,
        actorUserId: user.id,
        metadata: {
          provider: account?.provider || "unknown",
        },
      });
    },
    async signOut(message: any) {
      const actorUserId =
        "session" in message && message.session && typeof message.session === "object" && "userId" in message.session
          ? String(message.session.userId || "")
          : "";
      if (!actorUserId) return;
      await audit({
        action: "logout",
        entityType: "user",
        entityId: actorUserId,
        actorUserId,
      });
    },
  },
});
