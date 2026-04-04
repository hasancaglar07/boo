import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import { LoginLogo } from "@/components/forms/login-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Şifre Sıfırla | Kitap Oluşturucu",
  description: "Kitap Oluşturucu hesabının şifresini güvenli şekilde sıfırla.",
  path: "/reset-password",
  noIndex: true,
});

export default function ResetPasswordPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="hero-glow" />
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-lg space-y-6">
        <LoginLogo />
        <ResetPasswordForm />
      </div>
    </div>
  );
}
