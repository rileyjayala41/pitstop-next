import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const ADMIN_COOKIE_NAME = "pitstop_admin";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!token) return { ok: false as const, error: "Not logged in" };

  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) return { ok: false as const, error: "Missing ADMIN_JWT_SECRET" };

  try {
    jwt.verify(token, secret);
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Invalid session" };
  }
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isBoolean(v: unknown): v is boolean {
  return typeof v === "boolean";
}

function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 401 });

  const id = ctx.params.id;
  if (!id) return NextResponse.json({ ok: false, error: "Missing lead id" }, { status: 400 });

  const body = (await req.json().catch(() => null)) as any;
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });

  // Only accept the fields we actually support (keeps it stable)
  const patch: Record<string, any> = {};

  if (body.status !== undefined) {
    if (!isString(body.status)) return NextResponse.json({ ok: false, error: "status must be a string" }, { status: 400 });
    patch.status = body.status.trim();
  }

  if (body.assigned_to !== undefined) {
    if (!isString(body.assigned_to)) return NextResponse.json({ ok: false, error: "assigned_to must be a string" }, { status: 400 });
    patch.assigned_to = body.assigned_to.trim() || null;
  }

  if (body.notes !== undefined) {
    if (!isString(body.notes)) return NextResponse.json({ ok: false, error: "notes must be a string" }, { status: 400 });
    patch.notes = body.notes.trim() || null;
  }

  if (body.contacted_at !== undefined) {
    // allow string ISO or null
    if (!(isString(body.contacted_at) || body.contacted_at === null)) {
      return NextResponse.json({ ok: false, error: "contacted_at must be an ISO string or null" }, { status: 400 });
    }
    patch.contacted_at = body.contacted_at;
  }

  if (body.booked !== undefined) {
    if (!isBoolean(body.booked)) return NextResponse.json({ ok: false, error: "booked must be boolean" }, { status: 400 });
    patch.booked = body.booked;
  }

  if (body.job_value !== undefined) {
    // allow number or null
    if (!(isNumber(body.job_value) || body.job_value === null)) {
      return NextResponse.json({ ok: false, error: "job_value must be a number or null" }, { status: 400 });
    }
    patch.job_value = body.job_value;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: false, error: "No valid fields to update" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("leads")
    .update(patch)
    .eq("id", id)
    .select("id,status,assigned_to,notes,contacted_at,booked,job_value")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, lead: data }, { status: 200 });
}
