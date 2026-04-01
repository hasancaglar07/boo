import type { Metadata } from "next";

import { ContinueAuthScreen } from "@/components/funnel/continue-auth-screen";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Giriş ve Devam Et | Book Generator",
  description: "Kitap önizlemene geri dönmek için oturumunu aç.",
  path: "/login/continue",
  noIndex: true,
});

export default function LoginContinuePage() {
  return <ContinueAuthScreen mode="login" />;
}
