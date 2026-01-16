import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Only protect /admin routes
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  const password = process.env.ADMIN_PASSWORD;
  const key = searchParams.get("key");

  // If no password configured, allow (so you don't lock yourself out by accident)
  if (!password) return NextResponse.next();

  // If correct key is provided, allow
  if (key && key === password) return NextResponse.next();

  // Otherwise redirect to a simple access page
  const url = req.nextUrl.clone();
  url.pathname = "/admin-access";
  url.search = ""; // clear params
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
