import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getAuthProviderAvailability } from "@/lib/auth/bootstrap";
import { authStateLabel, getAuthStateForUser, getGuestIdentityFromCookies } from "@/lib/auth/data";

export async function GET() {
  const session = await auth();
  const guest = await getGuestIdentityFromCookies();
  const state = await getAuthStateForUser(session?.user?.id || null, session?.user?.email || null);
  const viewer =
    state.authenticated && session?.user?.id
      ? {
          id: session.user.id,
          name: state.account.name,
          email: state.account.email,
          goal: state.account.goal,
          planId: state.planId,
          emailVerified: state.emailVerified,
          role: state.role,
        }
      : null;

  return NextResponse.json({
    authenticated: state.authenticated,
    session: state.authenticated
      ? {
          email: state.account.email,
          loggedInAt: new Date().toISOString(),
          userId: session?.user?.id || "",
          emailVerified: state.emailVerified,
        }
      : null,
    account: state.account,
    planId: state.planId,
    emailVerified: state.emailVerified,
    anonymousId: guest?.id || null,
    authState: authStateLabel({
      authenticated: state.authenticated,
      emailVerified: state.emailVerified,
    }),
    providers: getAuthProviderAvailability(),
    viewer,
  });
}
