import type { Metadata } from "next";

import { ContinueAuthScreen } from "@/components/funnel/continue-auth-screen";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Sign In and Continue | Book Generator",
  description: "Sign in to return to your book preview.",
  path: "/login/continue",
  noIndex: true,
});

export default function LoginContinuePage() {
  return <ContinueAuthScreen mode="login" />;
}
