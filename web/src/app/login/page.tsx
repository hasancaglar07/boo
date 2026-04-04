import Link from "next/link";
import type { Metadata } from "next";

import { ThemeToggle } from "@/components/theme-toggle";
import { AuthForm } from "@/components/forms/auth-form";
import { LoginLogo } from "@/components/forms/login-logo";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Giriş | Kitap Oluşturucu",
  description: "Kitap Oluşturucu oturumunu aç, sihirbaz akışına geç ve kitap üretimine kaldığın yerden devam et.",
  path: "/login",
  noIndex: true,
});

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const verified = params.verified === "1";
  const nextPath = typeof params.next === "string" ? params.next : "";
  const signupHref = nextPath ? `/signup?next=${encodeURIComponent(nextPath)}` : "/signup";

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="hero-glow" />
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-lg space-y-6">
        <LoginLogo />
        {verified && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/8 px-5 py-4 text-sm text-emerald-700 dark:text-emerald-400">
            <strong>E-posta doğrulandı.</strong> Şimdi giriş yaparak satın alma akışına devam edebilirsin.
          </div>
        )}
        <div className="text-center text-sm leading-7 text-muted-foreground">
          Önizleme, kütüphane ve ödeme akışı aynı hesapta kalır. Giriş yap, kitabın kaldığı yerden devam etsin.
        </div>
        <div className="rounded-2xl border border-border/70 bg-card/60 px-4 py-3 text-center text-sm text-muted-foreground">
          Hesabın yok mu?{" "}
          <Link href={signupHref} className="font-semibold text-foreground hover:underline">
            Hızlı kayıt ol
          </Link>
        </div>
        <AuthForm mode="login" />
      </div>
    </div>
  );
}
