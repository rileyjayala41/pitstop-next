import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_COOKIE_NAME = "pitstop_admin";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect /admin/* (NOT /admin-access)
  const isAdminRoute = pathname.startsWith("/admin/");
  if (!isAdminRoute) return NextResponse.next();

  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;

  // If no cookie -> redirect to login page
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin-access";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Cookie exists -> allow
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
