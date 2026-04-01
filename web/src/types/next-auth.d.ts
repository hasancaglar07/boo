import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      goal: string;
      emailVerified: string | null;
      role: UserRole;
    };
  }

  interface User {
    goal?: string | null;
    passwordHash?: string | null;
    emailVerified?: Date | null;
    role?: UserRole;
  }
}
