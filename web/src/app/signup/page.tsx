import type { Metadata } from "next";
import Link from "next/link";

import { AuthForm } from "@/components/forms/auth-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Kayıt Ol | Book Generator",
  description: "Book Generator hesabı oluştur, preview'ını kaydet ve kitap akışına devam et.",
  path: "/signup",
  noIndex: true,
});

export default function SignupPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="hero-glow" />
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-lg space-y-6">
        <Link href="/" className="mx-auto flex w-fit items-center gap-3 text-sm font-medium text-foreground">
          <span className="flex size-10 items-center justify-center rounded-2xl border border-border bg-card">
            BG
          </span>
          <span>Book Generator</span>
        </Link>
        <AuthForm mode="register" />
      </div>
    </div>
  );
}
