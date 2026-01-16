import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // ✅ IMPORTANT FIX
    const body = await req.json();

    const update: Record<string, any> = {};

    if (typeof body.status === "string") update.status = body.status;
    if (typeof body.assigned_to === "string") update.assigned_to = body.assigned_to || null;
    if (typeof body.notes === "string") update.notes = body.notes || null;

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { ok: false, error: "Nothing to update" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("leads")
      .update(update)
      .eq("id", id)
      .select("id, status, assigned_to, notes")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, lead: data });
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
}
