import { sanitizeNextPath } from "@/lib/auth/safe-next";

export function isBillingAutostartNextPath(input: string | null | undefined) {
  const safePath = sanitizeNextPath(input, "");
  if (!safePath) return false;

  try {
    const parsed = new URL(safePath, "http://localhost");
    return (
      parsed.pathname === "/app/settings/billing" &&
      parsed.searchParams.get("autostart") === "1"
    );
  } catch {
    return false;
  }
}

