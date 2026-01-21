import { NextResponse } from "next/server";

const ADMIN_COOKIE_NAME = "pitstop_admin";

export async function POST() {
  const res = NextResponse.json({ ok: true });

  // Clear cookie for entire site
  res.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: false, // dev
    path: "/",
    maxAge: 0,
  });

  return res;
}
