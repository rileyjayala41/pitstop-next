import { NextResponse } from "next/server";

async function fetchVpicJson(url: string) {
  const r = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": "pitstop-next/1.0",
      Accept: "application/json,text/plain,*/*",
    },
  });

  const text = await r.text();

  if (text.trim().startsWith("<")) {
    throw new Error(`vPIC returned HTML (status ${r.status})`);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`vPIC returned non-JSON (status ${r.status})`);
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");
    const make = searchParams.get("make");

    if (!year || !make) {
      return NextResponse.json({ ok: false, error: "Missing year or make" }, { status: 400 });
    }

    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(
      make
    )}/modelyear/${encodeURIComponent(year)}?format=json`;

    const j = await fetchVpicJson(url);

    const models = (j?.Results || [])
      .map((x: any) => x?.Model_Name)
      .filter(Boolean)
      .sort((a: string, b: string) => a.localeCompare(b));

    return NextResponse.json({ ok: true, year, make, models });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "vPIC fetch failed" },
      { status: 502 }
    );
  }
}
