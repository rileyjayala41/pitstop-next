import { cookies } from "next/headers";

const COOKIE_NAME = "pitstop_admin";

function getEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name} in environment variables`);
  return v;
}

export async function isAdmin() {
  const c = await cookies();
  return Boolean(c.get(COOKIE_NAME)?.value);
}

export async function requireAdminOrThrow() {
  const ok = await isAdmin();
  if (!ok) throw new Error("UNAUTHORIZED");
  return true;
}

export function getAdminPassword() {
  return getEnv("ADMIN_PASSWORD");
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
