import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const ADMIN_COOKIE_NAME = "pitstop_admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const password = String(body?.password || "");

    const hash = process.env.ADMIN_PASSWORD_HASH;
    const secret = process.env.ADMIN_JWT_SECRET;

    if (!hash) {
      return NextResponse.json(
        { ok: false, error: "Missing ADMIN_PASSWORD_HASH in environment variables" },
        { status: 500 }
      );
    }
    if (!secret) {
      return NextResponse.json(
        { ok: false, error: "Missing ADMIN_JWT_SECRET in environment variables" },
        { status: 500 }
      );
    }

    const ok = await bcrypt.compare(password, hash);
    if (!ok) {
      return NextResponse.json({ ok: false, error: "Login failed" }, { status: 401 });
    }

    const token = jwt.sign({ role: "admin" }, secret, { expiresIn: "7d" });

    const res = NextResponse.json({ ok: true });

    // IMPORTANT: path="/" so it works on /admin/leads, /admin/marketing, etc.
    res.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: false, // dev
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Login error" },
      { status: 500 }
    );
  }
}
