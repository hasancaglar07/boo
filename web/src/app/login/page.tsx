import type { Metadata } from "next";

import { ThemeToggle } from "@/components/theme-toggle";
import { AuthForm } from "@/components/forms/auth-form";
import { LoginLogo } from "@/components/forms/login-logo";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Giriş | Book Generator",
  description: "Book Generator oturumunu ac, wizard akisina gec ve kitap uretimine kaldigin yerden devam et.",
  path: "/login",
  noIndex: true,
});

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="hero-glow" />
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-lg space-y-6">
        <LoginLogo />
        <AuthForm mode="login" />
      </div>
    </div>
  );
}
