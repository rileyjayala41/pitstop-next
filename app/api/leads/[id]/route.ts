import { NextRequest, NextResponse } from "next/server";
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

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function toNullableNumber(v: unknown) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing lead id" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const update: Record<string, any> = {};

  if ("status" in body) update.status = clean(body.status);
  if ("assigned_to" in body) update.assigned_to = clean(body.assigned_to);
  if ("notes" in body) update.notes = clean(body.notes);

  if ("contacted_at" in body) {
    update.contacted_at = body.contacted_at || null;
  }

  if ("booked" in body) {
    update.booked = !!body.booked;
  }

  if ("job_value" in body) {
    update.job_value = toNullableNumber(body.job_value);
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { ok: false, error: "No valid fields to update" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("leads")
    .update(update)
    .eq("id", id)
    .select("id, status, assigned_to, notes, contacted_at, booked, job_value")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, lead: data }, { status: 200 });
}
