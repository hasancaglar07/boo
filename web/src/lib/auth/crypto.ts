import { hash, verify } from "@node-rs/argon2";
import { createHash, randomBytes } from "node:crypto";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string) {
  return hash(password, {
    algorithm: 2,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
    outputLen: 32,
  });
}

export async function verifyPasswordHash(password: string, passwordHash: string) {
  return verify(passwordHash, password);
}

export function hashIp(value?: string | null) {
  if (!value) return null;
  return hashToken(value);
}
