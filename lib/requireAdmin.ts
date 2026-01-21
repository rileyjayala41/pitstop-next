import { cookies } from "next/headers";

const COOKIE_NAME = "pitstop_admin";

function getEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name} in environment variables`);
  return v;
}

function base64UrlToString(b64url: string) {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  return Buffer.from(b64 + pad, "base64").toString("utf8");
}

function signHS256(data: string, secret: string) {
  const crypto = require("crypto");
  return crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function verifyJwtHS256(token: string, secret: string) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("UNAUTHORIZED");

  const [headerB64, payloadB64, sigB64] = parts;
  const data = `${headerB64}.${payloadB64}`;

  const expected = signHS256(data, secret);
  if (expected !== sigB64) throw new Error("UNAUTHORIZED");

  const payloadJson = base64UrlToString(payloadB64);
  const payload = JSON.parse(payloadJson || "{}");

  if (payload?.exp && typeof payload.exp === "number") {
    const now = Math.floor(Date.now() / 1000);
    if (now >= payload.exp) throw new Error("UNAUTHORIZED");
  }

  return true;
}

export async function requireAdminOrThrow() {
  const secret = getEnv("ADMIN_JWT_SECRET");
  const c = await cookies();

  const token = c.get(COOKIE_NAME)?.value;
  if (!token) throw new Error("UNAUTHORIZED");

  verifyJwtHS256(token, secret);
  return true;
}
