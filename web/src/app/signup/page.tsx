import type { Metadata } from "next";

import { AuthForm } from "@/components/forms/auth-form";
import { LoginLogo } from "@/components/forms/login-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Kayıt Ol | Kitap Oluşturucu",
  description: "Kitap Oluşturucu hesabı oluştur, ön izlemeni kaydet ve kitap akışına devam et.",
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
        <LoginLogo />
        <div className="text-center text-sm leading-7 text-muted-foreground">
          Bu adım ödeme için değil. Hazırlanan kitabını hesabına kaydetmek ve önizleme hazır olduğunda aynı yerden devam etmek için.
        </div>
        <AuthForm mode="register" />
      </div>
    </div>
  );
}
