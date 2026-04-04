import Link from "next/link";
import type { Metadata } from "next";

import { AuthForm } from "@/components/forms/auth-form";
import { LoginLogo } from "@/components/forms/login-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { isBillingAutostartNextPath } from "@/lib/auth/checkout-intent";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Kayıt Ol | Kitap Oluşturucu",
  description: "Kitap Oluşturucu hesabı oluştur, ön izlemeni kaydet ve kitap akışına devam et.",
  path: "/signup",
  noIndex: true,
});

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const nextPath = typeof params.next === "string" ? params.next : "";
  const checkoutIntent = isBillingAutostartNextPath(nextPath);
  const loginHref = nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login";

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="hero-glow" />
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-lg space-y-6">
        <LoginLogo />
        <div className="text-center text-sm leading-7 text-muted-foreground">
          {checkoutIntent
            ? "Hızlı kayıt sonrası ödeme penceresi otomatik açılır. Akış kesilmeden satın almaya devam edersin."
            : "Bu adım ödeme için değil. Hazırlanan kitabını hesabına kaydetmek, preview'yi saklamak ve aynı yerden devam etmek için."}
        </div>
        {!checkoutIntent ? (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-center text-sm text-muted-foreground">
            Hesabı açtıktan sonra preview ve satın alma akışı aynı yerde kalır.
          </div>
        ) : null}
        <div className="rounded-2xl border border-border/70 bg-card/60 px-4 py-3 text-center text-sm text-muted-foreground">
          Zaten hesabın var mı?{" "}
          <Link href={loginHref} className="font-semibold text-foreground hover:underline">
            Girişe dön
          </Link>
        </div>
        <AuthForm mode="register" />
      </div>
    </div>
  );
}
