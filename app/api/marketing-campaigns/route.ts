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

function cleanString(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function cleanNullableString(v: unknown) {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

function toNumber(v: unknown) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

type CreateCampaignBody = {
  name: string;
  utm_campaign: string;
  platform?: string;
  spend?: number;
  start_date?: string;
  end_date?: string | null;
  status?: string;
  notes?: string | null;
};

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("marketing_campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, campaigns: data }, { status: 200 });
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as CreateCampaignBody | null;
  if (!body) {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const name = cleanString(body.name);
  const utm_campaign = cleanString(body.utm_campaign);
  const platform = cleanString(body.platform ?? "Other") || "Other";
  const status = cleanString(body.status ?? "active") || "active";
  const spend = toNumber(body.spend);
  const start_date = cleanString(body.start_date) || undefined;
  const end_date = cleanNullableString(body.end_date);

  if (!name || !utm_campaign) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields: name, utm_campaign" },
      { status: 400 }
    );
  }

  const allowedPlatforms = new Set(["Facebook", "Google", "TikTok", "Nextdoor", "Other"]);
  if (!allowedPlatforms.has(platform)) {
    return NextResponse.json({ ok: false, error: "Invalid platform" }, { status: 400 });
  }

  const allowedStatus = new Set(["active", "paused", "ended"]);
  if (!allowedStatus.has(status)) {
    return NextResponse.json({ ok: false, error: "Invalid status" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const insertRow: any = {
    name,
    utm_campaign,
    platform,
    spend,
    status,
    notes: cleanNullableString(body.notes),
  };

  // keep DB defaults if caller doesn't send dates
  if (start_date) insertRow.start_date = start_date;

  // end_date: allow explicit null if provided
  if (body.end_date !== undefined) insertRow.end_date = end_date;

  const { data, error } = await supabase
    .from("marketing_campaigns")
    .insert([insertRow])
    .select("*")
    .single();

  if (error) {
    const msg = error.message || "Insert failed";
    const isDuplicate = msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("unique");
    return NextResponse.json(
      { ok: false, error: isDuplicate ? "utm_campaign already exists" : msg },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, campaign: data }, { status: 201 });
}
