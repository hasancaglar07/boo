export function sanitizeNextPath(input: string | null | undefined, fallbackPath: string) {
  const raw = String(input || "").trim();
  if (!raw) return fallbackPath;
  if (!raw.startsWith("/")) return fallbackPath;
  if (raw.startsWith("//")) return fallbackPath;

  try {
    const parsed = new URL(raw, "http://localhost");
    if (parsed.origin !== "http://localhost") {
      return fallbackPath;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallbackPath;
  }
}
