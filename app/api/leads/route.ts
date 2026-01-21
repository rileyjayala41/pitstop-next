import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type LeadPayload = {
  name: string;
  phone: string;
  address: string;
  vehicle: string;
  service: string;
  message: string;

  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  gclid: string | null;
  fbclid: string | null;
};

function cleanString(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function cleanNullableString(v: unknown) {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as LeadPayload | null;

    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const lead = {
      name: cleanString(body.name),
      phone: cleanString(body.phone),
      address: cleanString(body.address),
      vehicle: cleanString(body.vehicle),
      service: cleanString(body.service),
      message: cleanString(body.message),

      utm_source: cleanNullableString(body.utm_source),
      utm_medium: cleanNullableString(body.utm_medium),
      utm_campaign: cleanNullableString(body.utm_campaign),
      utm_content: cleanNullableString(body.utm_content),
      utm_term: cleanNullableString(body.utm_term),
      gclid: cleanNullableString(body.gclid),
      fbclid: cleanNullableString(body.fbclid),
    };

    if (!lead.name || !lead.phone) {
      return NextResponse.json(
        { error: "Missing required fields (name, phone)" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("leads")
      .insert([lead])
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Supabase insert failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, lead: data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
