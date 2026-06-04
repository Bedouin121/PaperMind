// Server-only auth utilities.
// PASSWORD_HASH and SESSION_SECRET never leave the server.

import { createHmac, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";

/** Verify a plain-text password attempt against the stored bcrypt hash */
export async function verifyPassword(attempt: string): Promise<boolean> {
  // Read inside function — not at module scope — so Cloudflare/Vercel env is available at request time
  // Trim to handle any \r\n issues from Windows .env files
  const hash = (process.env.PASSWORD_HASH ?? "").trim();
  console.log("[auth] PASSWORD_HASH present:", !!hash, "| length:", hash.length);
  console.log("[auth] attempt length:", attempt.length);
  if (!hash) {
    console.error("[auth] PASSWORD_HASH env var is not set");
    return false;
  }
  const result = await bcrypt.compare(attempt.trim(), hash);
  console.log("[auth] bcrypt.compare result:", result);
  return result;
}

/** Issue a simple HMAC session token bound to a timestamp */
export function issueSessionToken(): string {
  const secret = process.env.SESSION_SECRET ?? "papermind-dev-secret";
  const payload = `papermind:${Date.now()}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

/** Verify a session token. Tokens expire after 8 hours. */
export function verifySessionToken(token: string): boolean {
  const secret = process.env.SESSION_SECRET ?? "papermind-dev-secret";
  try {
    const [payloadB64, sig] = token.split(".");
    if (!payloadB64 || !sig) return false;

    const payload = Buffer.from(payloadB64, "base64url").toString();
    const expectedSig = createHmac("sha256", secret).update(payload).digest("hex");

    // Timing-safe comparison
    const sigBuf = Buffer.from(sig, "hex");
    const expectedBuf = Buffer.from(expectedSig, "hex");
    if (sigBuf.length !== expectedBuf.length) return false;
    if (!timingSafeEqual(sigBuf, expectedBuf)) return false;

    // Check expiry — 8 hours
    const ts = parseInt(payload.split(":")[1] ?? "0", 10);
    const age = Date.now() - ts;
    return age < 8 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}
