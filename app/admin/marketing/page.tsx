"use client";

import { useEffect, useMemo, useState } from "react";

type CampaignStatus = "active" | "paused" | "ended";

type Campaign = {
  id: string;
  name: string;
  utm_campaign: string;
  platform: "Facebook" | "Google" | "TikTok" | "Nextdoor" | "Other";
  spend: number;
  start_date: string; // yyyy-mm-dd
  end_date: string | null; // yyyy-mm-dd or null
  status: CampaignStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type LeadStatsResponse = {
  ok: boolean;
  byCampaign?: Record<string, number>;
  bySource?: Record<string, number>;
  total?: number;
  error?: string;
};

type CampaignsResponse = {
  ok: boolean;
  campaigns?: Campaign[];
  campaign?: Campaign;
  error?: string;
};

const BASE_URL_KEY = "pitstop_marketing_baseurl_v1";

function money(n: number) {
  return `$${(Number.isFinite(n) ? n : 0).toFixed(2)}`;
}

function todayYMD() {
  return new Date().toISOString().slice(0, 10);
}

function platformToUtmSource(p: Campaign["platform"]) {
  switch (p) {
    case "Facebook":
      return "facebook";
    case "Google":
      return "google";
    case "TikTok":
      return "tiktok";
    case "Nextdoor":
      return "nextdoor";
    default:
      return "other";
  }
}

function safeUtmCampaign(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
}

function buildTrackingLink(
  baseUrl: string,
  platform: Campaign["platform"],
  utmCampaign: string
) {
  const url = baseUrl.replace(/\/+$/, "");
  const utm_source = platformToUtmSource(platform);

  const p = new URLSearchParams();
  p.set("utm_source", utm_source);
  p.set("utm_medium", "paid");
  p.set("utm_campaign", utmCampaign);

  return `${url}/?${p.toString()}`;
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    alert("Copied!");
  } catch {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    alert("Copied!");
  }
}

export default function MarketingPage() {
  // Base URL for tracking links
  const [baseUrl, setBaseUrl] = useState("https://pitstopautomotive.com");

  // Campaigns from Supabase
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [campaignsError, setCampaignsError] = useState<string | null>(null);

  // Lead stats from Supabase leads table (counts)
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [byCampaign, setByCampaign] = useState<Record<string, number>>({});
  const [bySource, setBySource] = useState<Record<string, number>>({});
  const [totalLeads, setTotalLeads] = useState<number>(0);

  // NEW: Lead stats filters
  const [statsStart, setStatsStart] = useState(""); // YYYY-MM-DD
  const [statsEnd, setStatsEnd] = useState(""); // YYYY-MM-DD
  const [mediumFilter, setMediumFilter] = useState<"all" | "paid">("paid");

  // Form state (Add campaign)
  const [name, setName] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [platform, setPlatform] = useState<Campaign["platform"]>("Facebook");
  const [spend, setSpend] = useState("0");
  const [startDate, setStartDate] = useState(todayYMD());
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<CampaignStatus>("active");
  const [notes, setNotes] = useState("");

  // UI state
  const [saving, setSaving] = useState(false);

  // Load base url from localStorage
  useEffect(() => {
    try {
      const base = localStorage.getItem(BASE_URL_KEY);
      if (base) setBaseUrl(base);
    } catch {
      // ignore
    }
  }, []);

  // Save base url
  useEffect(() => {
    try {
      localStorage.setItem(BASE_URL_KEY, baseUrl);
    } catch {
      // ignore
    }
  }, [baseUrl]);

  function buildLeadStatsUrl() {
    const p = new URLSearchParams();
    if (statsStart) p.set("start", statsStart);
    if (statsEnd) p.set("end", statsEnd);
    if (mediumFilter === "paid") p.set("medium", "paid");
    const qs = p.toString();
    return qs ? `/api/lead-stats?${qs}` : "/api/lead-stats";
  }

  async function loadStats() {
    setStatsLoaded(false);
    setStatsError(null);

    try {
      const url = buildLeadStatsUrl();
      const res = await fetch(url, { method: "GET" });
      const json = (await res.json().catch(() => null)) as LeadStatsResponse | null;

      if (!res.ok || !json?.ok) {
        setStatsError(json?.error || "Failed to load lead stats.");
        setByCampaign({});
        setBySource({});
        setTotalLeads(0);
        setStatsLoaded(true);
        return;
      }

      setByCampaign(json.byCampaign || {});
      setBySource(json.bySource || {});
      setTotalLeads(Number(json.total || 0));
      setStatsLoaded(true);
    } catch (e: any) {
      setStatsError(e?.message || "Failed to load lead stats.");
      setByCampaign({});
      setBySource({});
      setTotalLeads(0);
      setStatsLoaded(true);
    }
  }

  async function loadCampaigns() {
    setLoadingCampaigns(true);
    setCampaignsError(null);

    try {
      const res = await fetch("/api/marketing-campaigns", { method: "GET" });
      const json = (await res.json().catch(() => null)) as CampaignsResponse | null;

      if (!res.ok || !json?.ok) {
        setCampaignsError(json?.error || "Failed to load campaigns.");
        setCampaigns([]);
        setLoadingCampaigns(false);
        return;
      }

      setCampaigns(json.campaigns || []);
      setLoadingCampaigns(false);
    } catch (e: any) {
      setCampaignsError(e?.message || "Failed to load campaigns.");
      setCampaigns([]);
      setLoadingCampaigns(false);
    }
  }

  useEffect(() => {
    loadCampaigns();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => {
    const activeCount = campaigns.filter((c) => c.status === "active").length;
    const totalSpend = campaigns.reduce(
      (sum, c) => sum + (Number(c.spend) || 0),
      0
    );
    const totalTrackedLeads = Object.values(byCampaign).reduce((s, n) => s + (n || 0), 0);
    return { activeCount, totalSpend, totalTrackedLeads };
  }, [campaigns, byCampaign]);

  const previewLink = useMemo(() => {
    const safe = safeUtmCampaign(utmCampaign || name || "");
    if (!safe) return "";
    return buildTrackingLink(baseUrl, platform, safe);
  }, [baseUrl, platform, utmCampaign, name]);

  function leadsForCampaign(c: Campaign) {
    return byCampaign[c.utm_campaign] || 0;
  }

  function costPerLead(c: Campaign) {
    const leads = leadsForCampaign(c);
    if (!leads) return "—";
    const cpl = (Number(c.spend) || 0) / leads;
    return money(cpl);
  }

  async function addCampaign(e: React.FormEvent) {
    e.preventDefault();
    setCampaignsError(null);

    if (!name.trim()) return alert("Campaign name is required.");
    const spendNum = Number(spend);
    if (!Number.isFinite(spendNum) || spendNum < 0) return alert("Spend must be 0 or more.");

    const utm = safeUtmCampaign(utmCampaign || name);
    if (!utm) return alert("UTM Campaign is required.");

    setSaving(true);
    try {
      const res = await fetch("/api/marketing-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          utm_campaign: utm,
          platform,
          spend: spendNum,
          startDate,
          endDate,
          status,
          notes,
        }),
      });

      const json = (await res.json().catch(() => null)) as CampaignsResponse | null;

      if (!res.ok || !json?.ok || !json.campaign) {
        throw new Error(json?.error || "Failed to add campaign.");
      }

      setCampaigns((prev) => [json.campaign as Campaign, ...prev]);

      setName("");
      setUtmCampaign("");
      setSpend("0");
      setEndDate("");
      setNotes("");

      alert("Campaign added ✅ (saved to Supabase)");
    } catch (e: any) {
      setCampaignsError(e?.message || "Failed to add campaign.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCampaign(id: string) {
    const ok = confirm("Delete this campaign?");
    if (!ok) return;

    setSaving(true);
    setCampaignsError(null);

    try {
      const res = await fetch(`/api/marketing-campaigns/${id}`, { method: "DELETE" });
      const json = (await res.json().catch(() => null)) as CampaignsResponse | null;

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to delete campaign.");
      }

      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    } catch (e: any) {
      setCampaignsError(e?.message || "Failed to delete campaign.");
    } finally {
      setSaving(false);
    }
  }

  async function patchCampaign(id: string, patch: Partial<Campaign>) {
    const existing = campaigns.find((c) => c.id === id);
    if (!existing) throw new Error("Campaign not found.");

    const next: Campaign = { ...existing, ...patch };

    const res = await fetch(`/api/marketing-campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: next.name,
        utm_campaign: next.utm_campaign,
        platform: next.platform,
        spend: Number(next.spend) || 0,
        startDate: next.start_date,
        endDate: next.end_date || "",
        status: next.status,
        notes: next.notes || "",
      }),
    });

    const json = (await res.json().catch(() => null)) as CampaignsResponse | null;

    if (!res.ok || !json?.ok || !json.campaign) {
      throw new Error(json?.error || "Failed to update campaign.");
    }

    setCampaigns((prev) => prev.map((c) => (c.id === id ? (json.campaign as Campaign) : c)));
  }

  async function editSpend(id: string, current: number) {
    const v = prompt("New spend amount in dollars (example: 125.50)", String(current));
    if (v === null) return;

    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) return alert("Spend must be a valid number (0 or more).");

    setSaving(true);
    setCampaignsError(null);
    try {
      await patchCampaign(id, { spend: n });
    } catch (e: any) {
      setCampaignsError(e?.message || "Failed to update campaign.");
    } finally {
      setSaving(false);
    }
  }

  async function editNotes(id: string, current: string | null) {
    const v = prompt("Edit notes", current || "");
    if (v === null) return;

    setSaving(true);
    setCampaignsError(null);
    try {
      await patchCampaign(id, { notes: v });
    } catch (e: any) {
      setCampaignsError(e?.message || "Failed to update campaign.");
    } finally {
      setSaving(false);
    }
  }

  async function editStatus(id: string, next: CampaignStatus) {
    setSaving(true);
    setCampaignsError(null);
    try {
      await patchCampaign(id, { status: next });
    } catch (e: any) {
      setCampaignsError(e?.message || "Failed to update campaign.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 6 }}>Marketing</h1>
          <p style={{ opacity: 0.75, marginBottom: 0 }}>
            Campaigns saved in Supabase + lead stats filtered by date + paid.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button type="button" style={outlineBtn} onClick={loadCampaigns}>
            Refresh campaigns
          </button>
          <button type="button" style={outlineBtn} onClick={loadStats}>
            Refresh lead stats
          </button>
        </div>
      </div>

      <div style={{ marginTop: 10, opacity: 0.85, fontSize: 13 }}>
        {!statsLoaded ? (
          <>Loading lead stats…</>
        ) : statsError ? (
          <span style={{ color: "#dc2626", fontWeight: 700 }}>Lead stats error: {statsError}</span>
        ) : (
          <>
            Lead stats loaded ✅ (Filtered leads: <b>{totalLeads}</b>)
          </>
        )}
      </div>

      {campaignsError ? (
        <div style={{ marginTop: 10, color: "#dc2626", fontWeight: 800 }}>
          Campaign error: {campaignsError}
        </div>
      ) : null}

      {/* Lead stats filters */}
      <section style={{ ...card, marginTop: 14 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Lead Stats Filters</h2>
        <p style={{ opacity: 0.75, marginTop: 6 }}>
          Use this to measure performance for a specific time period.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, marginTop: 10 }}>
          <Field label="Start date (optional)">
            <input type="date" value={statsStart} onChange={(e) => setStatsStart(e.target.value)} style={input} />
          </Field>

          <Field label="End date (optional)">
            <input type="date" value={statsEnd} onChange={(e) => setStatsEnd(e.target.value)} style={input} />
          </Field>

          <Field label="Medium">
            <select
              value={mediumFilter}
              onChange={(e) => setMediumFilter(e.target.value as any)}
              style={input}
            >
              <option value="paid">paid only</option>
              <option value="all">all leads</option>
            </select>
          </Field>

          <div style={{ alignSelf: "end" }}>
            <button type="button" style={primaryBtn} onClick={loadStats}>
              Apply
            </button>
          </div>
        </div>
      </section>

      {/* Base URL */}
      <section style={{ ...card, marginTop: 14 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Tracking Base URL</h2>
        <p style={{ opacity: 0.75, marginTop: 6 }}>
          This is the website address your ads should send people to.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, marginTop: 10 }}>
          <input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://pitstopautomotive.com"
            style={input}
          />
          <button style={outlineBtn} onClick={() => copy(baseUrl)}>
            Copy
          </button>
        </div>
      </section>

      {/* Quick Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 12,
          marginTop: 14,
          marginBottom: 16,
        }}
      >
        <StatCard label="Active campaigns" value={String(campaigns.filter((c) => c.status === "active").length)} />
        <StatCard label="Total spend" value={money(totals.totalSpend)} />
        <StatCard label="Tracked leads (UTM)" value={String(totals.totalTrackedLeads)} />
      </div>

      {/* Add Campaign */}
      <section style={{ ...card, marginTop: 14 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Add Campaign</h2>

        <form onSubmit={addCampaign} style={{ marginTop: 12, display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10 }}>
            <Field label="Campaign name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Austin Mobile Mechanic - January"
                style={input}
              />
            </Field>

            <Field label="Platform">
              <select value={platform} onChange={(e) => setPlatform(e.target.value as any)} style={input}>
                <option>Facebook</option>
                <option>Google</option>
                <option>TikTok</option>
                <option>Nextdoor</option>
                <option>Other</option>
              </select>
            </Field>

            <Field label="Spend ($)">
              <input
                value={spend}
                onChange={(e) => setSpend(e.target.value)}
                inputMode="decimal"
                placeholder="0"
                style={input}
              />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <Field label="UTM Campaign (used in your ad link)">
              <input
                value={utmCampaign}
                onChange={(e) => setUtmCampaign(e.target.value)}
                placeholder="austin-mobile-mechanic-jan"
                style={input}
              />
            </Field>

            <Field label="Start date">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={input} />
            </Field>

            <Field label="End date (optional)">
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={input} />
            </Field>
          </div>

          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value as CampaignStatus)} style={input}>
              <option value="active">active</option>
              <option value="paused">paused</option>
              <option value="ended">ended</option>
            </select>
          </Field>

          <Field label="Notes">
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Targeting notes..." style={input} />
          </Field>

          <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Generated Tracking Link</div>
            <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 10 }}>
              Use this as the website URL inside your ads.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
              <input value={previewLink} readOnly style={input} />
              <button
                type="button"
                style={outlineBtn}
                onClick={() => {
                  if (!previewLink) return alert("Enter a campaign name first.");
                  copy(previewLink);
                }}
              >
                Copy link
              </button>
            </div>
          </section>

          <div>
            <button type="submit" style={primaryBtn} disabled={saving}>
              {saving ? "Saving..." : "Add campaign"}
            </button>
          </div>
        </form>
      </section>

      {/* Campaign List */}
      <section style={{ ...card, marginTop: 14 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Campaigns</h2>

        {loadingCampaigns ? (
          <div style={{ opacity: 0.75, marginTop: 10 }}>Loading…</div>
        ) : campaigns.length === 0 ? (
          <div style={{ opacity: 0.75, marginTop: 10 }}>
            No campaigns yet. Add one above — it will appear in Supabase.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {campaigns.map((c) => {
              const link = buildTrackingLink(baseUrl, c.platform, c.utm_campaign);
              const leads = leadsForCampaign(c);

              return (
                <div key={c.id} style={row}>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ fontWeight: 800 }}>
                      {c.name}{" "}
                      <span style={{ opacity: 0.6, fontWeight: 600 }}>• {c.platform}</span>
                    </div>

                    <div style={{ fontSize: 13, opacity: 0.8 }}>
                      {c.start_date} {c.end_date ? `→ ${c.end_date}` : ""} • Spend:{" "}
                      <b>{money(Number(c.spend) || 0)}</b> • Status: <b>{c.status}</b>
                    </div>

                    <div style={{ fontSize: 13, opacity: 0.9 }}>
                      UTM Campaign: <b>{c.utm_campaign}</b>
                    </div>

                    <div style={{ fontSize: 13, opacity: 0.9 }}>
                      Leads (filtered): <b>{leads}</b> • Cost/Lead: <b>{costPerLead(c)}</b>
                    </div>

                    <div style={{ fontSize: 13, opacity: 0.8, wordBreak: "break-all" }}>
                      Link: {link}
                    </div>

                    {c.notes ? (
                      <div style={{ fontSize: 13, opacity: 0.75 }}>Notes: {c.notes}</div>
                    ) : null}
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <button type="button" style={outlineBtn} onClick={() => copy(link)}>
                      Copy link
                    </button>

                    <select
                      value={c.status}
                      onChange={(e) => editStatus(c.id, e.target.value as CampaignStatus)}
                      style={smallInput}
                      disabled={saving}
                    >
                      <option value="active">active</option>
                      <option value="paused">paused</option>
                      <option value="ended">ended</option>
                    </select>

                    <button type="button" style={outlineBtn} onClick={() => editSpend(c.id, Number(c.spend) || 0)} disabled={saving}>
                      Edit spend
                    </button>

                    <button type="button" style={outlineBtn} onClick={() => editNotes(c.id, c.notes)} disabled={saving}>
                      Edit notes
                    </button>

                    <button type="button" style={dangerBtn} onClick={() => deleteCampaign(c.id)} disabled={saving}>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 12, opacity: 0.75 }}>{label}</span>
      {children}
    </label>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14 }}>
      <div style={{ fontSize: 12, opacity: 0.75 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, marginTop: 2 }}>{value}</div>
    </div>
  );
}

const card: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 14,
};

const row: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 12,
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
};

const input: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "10px 12px",
  outline: "none",
  width: "100%",
};

const smallInput: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "8px 10px",
  outline: "none",
};

const primaryBtn: React.CSSProperties = {
  border: "1px solid #111827",
  borderRadius: 10,
  padding: "10px 12px",
  background: "#111827",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
};

const outlineBtn: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "8px 10px",
  background: "white",
  cursor: "pointer",
  fontWeight: 600,
};

const dangerBtn: React.CSSProperties = {
  border: "1px solid #dc2626",
  borderRadius: 10,
  padding: "8px 10px",
  background: "#dc2626",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
};
