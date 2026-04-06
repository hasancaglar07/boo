import Link from "next/link";
import type { Metadata } from "next";

import { AuthForm } from "@/components/forms/auth-form";
import { LoginLogo } from "@/components/forms/login-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Sign Up | Book Generator",
  description: "Create a Book Generator account, save your preview, and continue your book workflow.",
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
  const loginHref = nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login";

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

        {/* Main Form Card - Clean, minimal styling */}
        <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-sm">
          {/* Header Section */}
          <div className="border-b border-border/40 px-8 pt-8 pb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Create Account
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Start for free • 2 minutes
            </p>
          </div>

          {/* Form Section - Clean spacing */}
          <div className="px-8 py-6">
            <AuthForm mode="register" />
          </div>

          {/* Footer Link - Minimal */}
          <div className="border-t border-border/40 px-8 py-4">
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link 
                href={loginHref} 
                className="font-medium text-foreground hover:text-primary transition-colors"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>

        {/* Trust Indicator - Optional, subtle */}
        <p className="mt-6 text-center text-xs text-muted-foreground/70">
          No credit card required • Secure sign-up
        </p>
      </div>
    </div>
  );
}
