import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { AuthForm } from "@/components/forms/auth-form";
import { LoginLogo } from "@/components/forms/login-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const t = await getTranslations("SignupPage.metadata");
  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    path: "/signup",
    noIndex: true,
  });
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("SignupPage");
  const params = await searchParams;
  const nextPath = typeof params.next === "string" ? params.next : "";
  const loginHref = nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/10 px-4">
      <div className="fixed right-6 top-6 z-50">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <LoginLogo />
        </div>
        <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-sm">
          <div className="border-b border-border/40 px-8 pt-8 pb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("createAccount")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("startForFree")}</p>
          </div>
          <div className="px-8 py-6">
            <AuthForm mode="register" />
          </div>
          <div className="border-t border-border/40 px-8 py-4">
            <p className="text-center text-sm text-muted-foreground">
              {t("alreadyHaveAccount")}{" "}
              <Link href={loginHref} className="font-medium text-foreground hover:text-primary transition-colors">
                {t("loginLink")}
              </Link>
            </p>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground/70">{t("trustNote")}</p>
      </div>
    </div>
  );
}
