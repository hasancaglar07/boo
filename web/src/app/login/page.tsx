import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";

import { AuthForm } from "@/components/forms/auth-form";
import { LoginLogo } from "@/components/forms/login-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Introduction | Book Creator",
  description: "Open the Book Creator session, go to the wizard flow, and continue book production from where you left off.",
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/10 px-4">
      {/* Theme Toggle */}
      <div className="fixed right-6 top-6 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Logo Section - Premium spacing */}
        <div className="mb-8 text-center">
          <LoginLogo />
        </div>

        {/* Verification Alert - Subtle, minimal */}
        {verified ? (
          <div className="mb-6 flex items-center gap-3 rounded-lg bg-emerald-500/10 px-4 py-3 text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <p className="font-medium text-emerald-700 dark:text-emerald-400">
              Email verified. You can log in.
            </p>
          </div>
        ) : null}

        {/* Main Form Card - Clean, minimal styling */}
        <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-sm">
          {/* Header Section */}
          <div className="border-b border-border/40 px-8 pt-8 pb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Email verified. You can log in.

            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Welcome Back

            </p>
          </div>

          {/* Form Section - Clean spacing */}
          <div className="px-8 py-6">
            <AuthForm mode="login" />
          </div>

          {/* Footer Link - Minimal */}
          <div className="border-t border-border/40 px-8 py-4">
            <p className="text-center text-sm text-muted-foreground">
              Continue your book where you left off

              <Link 
                href={signupHref} 
                className="font-medium text-foreground hover:text-primary transition-colors"
              >
              Don't have an account?{" "}

              </Link>
            </p>
          </div>
        </div>

        {/* Trust Indicator - Optional, subtle */}
        <p className="mt-6 text-center text-xs text-muted-foreground/70">
              Email verified. You can log in.

        </p>
      </div>
    </div>
  );
}