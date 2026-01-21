import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireAdminOrThrow } from "@/lib/requireAdmin";

function isYmd(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export async function GET(req: Request) {
  try {
    await requireAdminOrThrow();

    const url = new URL(req.url);
    const start = (url.searchParams.get("start") || "").trim();
    const end = (url.searchParams.get("end") || "").trim();
    const medium = (url.searchParams.get("medium") || "").trim();

    let q = supabaseServer
      .from("leads")
      .select("created_at, utm_campaign, utm_source, utm_medium");

    if (start && isYmd(start)) q = q.gte("created_at", `${start}T00:00:00.000Z`);
    if (end && isYmd(end)) q = q.lte("created_at", `${end}T23:59:59.999Z`);
    if (medium) q = q.eq("utm_medium", medium);

    const { data, error } = await q;

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const byCampaign: Record<string, number> = {};
    const bySource: Record<string, number> = {};

    for (const row of data ?? []) {
      const c = (row as any)?.utm_campaign;
      const s = (row as any)?.utm_source;

      if (c && typeof c === "string" && c.trim()) {
        const key = c.trim();
        byCampaign[key] = (byCampaign[key] || 0) + 1;
      }

      if (s && typeof s === "string" && s.trim()) {
        const key = s.trim();
        bySource[key] = (bySource[key] || 0) + 1;
      }
    }

    return NextResponse.json(
      { ok: true, byCampaign, bySource, total: (data ?? []).length },
      { status: 200 }
    );
  } catch (e: any) {
    const msg = e?.message === "UNAUTHORIZED" ? "Unauthorized" : (e?.message || "Server error");
    const status = e?.message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
