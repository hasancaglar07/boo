import type { Metadata } from "next";

import { ContinueAuthScreen } from "@/components/funnel/continue-auth-screen";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Continue | Book Generator",
  description: "Link your book to your account and proceed to preview.",
  path: "/signup/continue",
  noIndex: true,
});

export default function SignupContinuePage() {
  return <ContinueAuthScreen mode="signup" />;
}
