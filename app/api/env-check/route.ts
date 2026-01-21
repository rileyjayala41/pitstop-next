import { NextResponse } from "next/server";

function safeInfo(v: string | undefined) {
  return {
    exists: Boolean(v && v.length > 0),
    length: v?.length ?? 0,
    startsWith: v ? v.slice(0, 6) : "",
  };
}

export async function GET() {
  return NextResponse.json({
    ADMIN_PASSWORD_HASH: safeInfo(process.env.ADMIN_PASSWORD_HASH),
    ADMIN_JWT_SECRET: safeInfo(process.env.ADMIN_JWT_SECRET),
  });
}
