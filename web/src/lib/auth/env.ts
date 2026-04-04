export function resolveAuthSecret() {
  return (
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTHJS_SECRET ||
    (process.env.NODE_ENV !== "production" ? "book-generator-dev-secret" : undefined)
  );
}

