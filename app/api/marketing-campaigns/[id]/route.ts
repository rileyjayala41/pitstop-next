import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdminOrThrow } from "@/lib/requireAdmin";

type Ctx = { params: Promise<{ id: string }> };

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function PATCH(req: Request, context: Ctx) {
  try {
    requireAdminOrThrow();

    const { id } = await context.params;

    const body = await req.json().catch(() => null);
    if (!body) return jsonError("Missing JSON body.");

    const name = String(body.name ?? "").trim();
    const utm_campaign = String(body.utm_campaign ?? "").trim();
    const platform = String(body.platform ?? "").trim();
    const status = String(body.status ?? "").trim();

    const spendNum = Number(body.spend);
    if (!Number.isFinite(spendNum) || spendNum < 0) {
      return jsonError("Spend must be a number (0 or more).");
    }

    const startDate = String(body.startDate ?? "").trim();
    const endDateRaw = String(body.endDate ?? "").trim();
    const endDate = endDateRaw ? endDateRaw : null;

    const notesRaw = body.notes;
    const notes = notesRaw === undefined || notesRaw === null ? null : String(notesRaw);

    if (!id) return jsonError("Missing id.");
    if (!name) return jsonError("Missing name.");
    if (!utm_campaign) return jsonError("Missing utm_campaign.");
    if (!platform) return jsonError("Missing platform.");
    if (!status) return jsonError("Missing status.");
    if (!startDate) return jsonError("Missing startDate.");

    const { data, error } = await supabaseAdmin
      .from("marketing_campaigns")
      .update({
        name,
        utm_campaign,
        platform,
        spend: spendNum,
        start_date: startDate,
        end_date: endDate,
        status,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) return jsonError(error.message, 500);

    return NextResponse.json({ ok: true, campaign: data }, { status: 200 });
  } catch (e: any) {
    const msg = e?.message === "UNAUTHORIZED" ? "Unauthorized" : (e?.message || "Server error");
    const status = e?.message === "UNAUTHORIZED" ? 401 : 500;
    return jsonError(msg, status);
  }
}

export async function DELETE(_req: Request, context: Ctx) {
  try {
    requireAdminOrThrow();

    const { id } = await context.params;

    if (!id) return jsonError("Missing id.");

    const { error } = await supabaseAdmin
      .from("marketing_campaigns")
      .delete()
      .eq("id", id);

    if (error) return jsonError(error.message, 500);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    const msg = e?.message === "UNAUTHORIZED" ? "Unauthorized" : (e?.message || "Server error");
    const status = e?.message === "UNAUTHORIZED" ? 401 : 500;
    return jsonError(msg, status);
  }
}
