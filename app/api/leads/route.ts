import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = String(body?.name ?? "").trim();
    const phone = String(body?.phone ?? "").trim();
    const address = String(body?.address ?? "").trim();
    const vehicle = String(body?.vehicle ?? "").trim();
    const service = String(body?.service ?? "").trim();
    const message = String(body?.message ?? "").trim();

    if (!name || !phone || !address || !vehicle || !service) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("leads")
      .insert([
        {
          name,
          phone,
          address,
          vehicle,
          service,
          message: message || null,
          status: "New",
          source: "Website",
        },
      ])
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, lead_id: data.id });
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }
}
