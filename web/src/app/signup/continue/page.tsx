import type { Metadata } from "next";

import { ContinueAuthScreen } from "@/components/funnel/continue-auth-screen";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Devam Et | Book Generator",
  description: "Kitabını hesabına bağla ve preview'a geç.",
  path: "/signup/continue",
  noIndex: true,
});

export default function SignupContinuePage() {
  return <ContinueAuthScreen mode="signup" />;
}
