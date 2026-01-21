"use client";

import { useMemo, useState } from "react";

export type CampaignRow = {
  id: string;
  name: string;
  utm_campaign: string;
  platform: "Facebook" | "Google" | "TikTok" | "Nextdoor" | "Other" | string;
  spend: number;
  start_date: string;
  end_date: string | null;
  status: "active" | "paused" | "ended" | string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadLite = {
  id: string;
  created_at: string;
  utm_campaign: string | null;
  utm_source: string | null;
  utm_medium: string | null;
};

type DateRangeKey = "7" | "30" | "90" | "all";
type SortKey = "leads_desc" | "cpl_asc" | "spend_desc" | "newest";

// ✅ tracking link base (your current Vercel domain)
const BASE_URL = "https://pitstop-next.vercel.app";

function clean(v: unknown) {
  if (typeof v !== "string") return "";
  return v.trim();
}

function toNumber(v: unknown) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function formatPct(n: number) {
  return `${(n * 100).toFixed(0)}%`;
}

function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

type Props = {
  campaigns: CampaignRow[];
  leads: LeadLite[];
};

type EditableCampaign = Pick<
  CampaignRow,
  | "id"
  | "name"
  | "platform"
  | "spend"
  | "start_date"
  | "end_date"
  | "status"
  | "notes"
  | "utm_campaign"
>;

type NewCampaignDraft = {
  name: string;
  utm_campaign: string;
  platform: string;
  spend: string;
  start_date: string;
  end_date: string;
  status: string;
  notes: string;
};

function todayDateInput() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function MarketingDashboardClient({ campaigns, leads }: Props) {
  const [campaignsState, setCampaignsState] = useState<CampaignRow[]>(campaigns);

  // Filters + sorting
  const [dateRange, setDateRange] = useState<DateRangeKey>("30");
  const [platformFilter, setPlatformFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [sort, setSort] = useState<SortKey>("leads_desc");

  // Search UX: Search button + Enter-to-search
  const [searchDraft, setSearchDraft] = useState("");
  const [searchApplied, setSearchApplied] = useState("");

  // Add campaign UI
  const [showAdd, setShowAdd] = useState(false);
  const [newCampaign, setNewCampaign] = useState<NewCampaignDraft>({
    name: "",
    utm_campaign: "",
    platform: "Facebook",
    spend: "0",
    start_date: todayDateInput(),
    end_date: "",
    status: "active",
    notes: "",
  });

  // Edit/delete UI state
  const [editing, setEditing] = useState<EditableCampaign | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const filteredLeads = useMemo(() => {
    const minIso =
      dateRange === "all"
        ? null
        : dateRange === "7"
        ? daysAgoIso(7)
        : dateRange === "30"
        ? daysAgoIso(30)
        : daysAgoIso(90);

    return leads.filter((l) => {
      if (!l.utm_campaign) return false;
      if (!minIso) return true;
      return l.created_at >= minIso;
    });
  }, [leads, dateRange]);

  // Aggregate lead counts by utm_campaign + top sources
  const leadAgg = useMemo(() => {
    const map = new Map<
      string,
      { leads: number; sources: Record<string, number>; mediums: Record<string, number> }
    >();

    for (const l of filteredLeads) {
      const campaign = clean(l.utm_campaign);
      if (!campaign) continue;

      const source = clean(l.utm_source) || "—";
      const medium = clean(l.utm_medium) || "—";

      if (!map.has(campaign)) {
        map.set(campaign, { leads: 0, sources: {}, mediums: {} });
      }

      const entry = map.get(campaign)!;
      entry.leads += 1;
      entry.sources[source] = (entry.sources[source] || 0) + 1;
      entry.mediums[medium] = (entry.mediums[medium] || 0) + 1;
    }

    return map;
  }, [filteredLeads]);

  const platformOptions = useMemo(() => {
    const set = new Set<string>();
    for (const c of campaignsState) set.add(clean(c.platform) || "Other");
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [campaignsState]);

  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    for (const c of campaignsState) set.add(clean(c.status) || "active");
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [campaignsState]);

  const rows = useMemo(() => {
    const q = clean(searchApplied).toLowerCase();

    const base = campaignsState
      .map((c) => {
        const utm = clean(c.utm_campaign);
        const agg = leadAgg.get(utm);

        const leadsCount = agg?.leads || 0;
        const spend = toNumber(c.spend);
        const cpl = leadsCount > 0 ? spend / leadsCount : null;

        const topSources = agg
          ? Object.entries(agg.sources)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 2)
              .map(([k, v]) => `${k} (${v})`)
              .join(", ")
          : "—";

        return { ...c, leads: leadsCount, cpl, topSources };
      })
      .filter((r) => {
        if (platformFilter !== "All" && clean(r.platform) !== platformFilter) return false;
        if (statusFilter !== "All" && clean(r.status) !== statusFilter) return false;

        if (q) {
          const hay = `${r.name} ${r.utm_campaign} ${r.platform} ${r.status}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });

    const totalLeadsInRange = base.reduce((sum, r) => sum + r.leads, 0);

    const withShare = base.map((r) => ({
      ...r,
      leadShare: totalLeadsInRange > 0 ? r.leads / totalLeadsInRange : 0,
    }));

    withShare.sort((a, b) => {
      if (sort === "newest") return b.created_at.localeCompare(a.created_at);
      if (sort === "spend_desc") return toNumber(b.spend) - toNumber(a.spend);
      if (sort === "cpl_asc") {
        const ac = a.cpl ?? Number.POSITIVE_INFINITY;
        const bc = b.cpl ?? Number.POSITIVE_INFINITY;
        return ac - bc;
      }
      return b.leads - a.leads; // leads_desc default
    });

    return withShare;
  }, [campaignsState, leadAgg, platformFilter, statusFilter, sort, searchApplied]);

  const totals = useMemo(() => {
    const totalSpend = rows.reduce((sum, r) => sum + toNumber(r.spend), 0);
    const totalLeads = rows.reduce((sum, r) => sum + r.leads, 0);
    const blendedCpl = totalLeads > 0 ? totalSpend / totalLeads : null;
    return { totalSpend, totalLeads, blendedCpl };
  }, [rows]);

  function applySearch() {
    setSearchApplied(searchDraft);
  }

  function clearSearch() {
    setSearchDraft("");
    setSearchApplied("");
  }

  function openEdit(c: any) {
    setMsg(null);
    setEditing({
      id: c.id,
      name: c.name,
      platform: c.platform,
      spend: toNumber(c.spend),
      start_date: c.start_date,
      end_date: c.end_date,
      status: c.status,
      notes: c.notes ?? "",
      utm_campaign: c.utm_campaign,
    });
  }

  function closeEdit() {
    if (saving) return;
    setEditing(null);
  }

  // ✅ Copy Tracking Link (added without changing anything else)
  function copyTrackingLink(c: CampaignRow) {
    const source = clean(c.platform).toLowerCase() || "other";
    const url =
      `${BASE_URL}/?` +
      `utm_campaign=${encodeURIComponent(c.utm_campaign)}` +
      `&utm_source=${encodeURIComponent(source)}` +
      `&utm_medium=cpc`;

    navigator.clipboard.writeText(url);
    setMsg("Tracking link copied ✅");
    setTimeout(() => setMsg(null), 1500);
  }

  async function saveEdit() {
    if (!editing) return;

    setSaving(true);
    setMsg(null);

    try {
      const res = await fetch(`/api/marketing-campaigns/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editing.name,
          platform: editing.platform,
          spend: Number(editing.spend) || 0,
          start_date: editing.start_date,
          end_date: editing.end_date || null,
          status: editing.status,
          notes: editing.notes || null,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || `Failed to update campaign (${res.status})`);
      }

      setCampaignsState((prev) =>
        prev.map((c) =>
          c.id === editing.id
            ? {
                ...c,
                name: editing.name,
                platform: editing.platform,
                spend: Number(editing.spend) || 0,
                start_date: editing.start_date,
                end_date: editing.end_date || null,
                status: editing.status,
                notes: editing.notes || null,
              }
            : c
        )
      );

      setMsg("Saved ✅");
      setEditing(null);
    } catch (e: any) {
      setMsg(`Error: ${e?.message || "Save failed"}`);
    } finally {
      setSaving(false);
    }
  }

  async function deleteCampaign(campaignId: string) {
    const c = campaignsState.find((x) => x.id === campaignId);
    const label = c ? `${c.name} (${c.utm_campaign})` : "this campaign";

    const ok = window.confirm(`Delete ${label}? This cannot be undone.`);
    if (!ok) return;

    setSaving(true);
    setMsg(null);

    try {
      const res = await fetch(`/api/marketing-campaigns/${campaignId}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || `Failed to delete campaign (${res.status})`);
      }

      setCampaignsState((prev) => prev.filter((x) => x.id !== campaignId));
      setMsg("Deleted ✅");
    } catch (e: any) {
      setMsg(`Error: ${e?.message || "Delete failed"}`);
    } finally {
      setSaving(false);
    }
  }

  function normalizeUtm(input: string) {
    return clean(input).toLowerCase().replace(/\s+/g, "-");
  }

  async function createCampaign() {
    setMsg(null);

    const name = clean(newCampaign.name);
    const utm = normalizeUtm(newCampaign.utm_campaign);

    if (!name) return setMsg("Error: Campaign name is required.");
    if (!utm) return setMsg("Error: utm_campaign is required (must match your ad URL).");

    setSaving(true);

    try {
      const res = await fetch(`/api/marketing-campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          utm_campaign: utm,
          platform: newCampaign.platform,
          spend: Number(newCampaign.spend) || 0,
          start_date: newCampaign.start_date,
          end_date: newCampaign.end_date || null,
          status: newCampaign.status,
          notes: clean(newCampaign.notes) || null,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || `Failed to create campaign (${res.status})`);
      }

      const created = (json.campaign ?? json.data ?? json) as CampaignRow;
      setCampaignsState((prev) => [created, ...prev]);

      setMsg("Campaign added ✅");
      setShowAdd(false);
      setNewCampaign({
        name: "",
        utm_campaign: "",
        platform: "Facebook",
        spend: "0",
        start_date: todayDateInput(),
        end_date: "",
        status: "active",
        notes: "",
      });
    } catch (e: any) {
      setMsg(`Error: ${e?.message || "Create failed"}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {/* ADD CAMPAIGN */}
      <div style={{ border: "1px solid #2a2a2a", borderRadius: 14, padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16 }}>Campaigns</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              Add campaigns here so your dashboard can calculate leads + CPL.
            </div>
          </div>
          <button className="quote-btn" onClick={() => setShowAdd((v) => !v)} disabled={saving}>
            {showAdd ? "Close" : "Add Campaign"}
          </button>
        </div>

        {showAdd && (
          <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, opacity: 0.75 }}>Name</span>
                <input
                  className="input"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  placeholder="Google Brakes - Jan"
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, opacity: 0.75 }}>utm_campaign (must match your URLs)</span>
                <input
                  className="input"
                  value={newCampaign.utm_campaign}
                  onChange={(e) => setNewCampaign({ ...newCampaign, utm_campaign: e.target.value })}
                  placeholder="brakes-jan"
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, opacity: 0.75 }}>Platform</span>
                <select
                  className="input"
                  value={newCampaign.platform}
                  onChange={(e) => setNewCampaign({ ...newCampaign, platform: e.target.value })}
                >
                  <option>Facebook</option>
                  <option>Google</option>
                  <option>TikTok</option>
                  <option>Nextdoor</option>
                  <option>Other</option>
                </select>
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, opacity: 0.75 }}>Spend</span>
                <input
                  className="input"
                  inputMode="decimal"
                  value={newCampaign.spend}
                  onChange={(e) => setNewCampaign({ ...newCampaign, spend: e.target.value })}
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, opacity: 0.75 }}>Start date</span>
                <input
                  className="input"
                  type="date"
                  value={newCampaign.start_date}
                  onChange={(e) => setNewCampaign({ ...newCampaign, start_date: e.target.value })}
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, opacity: 0.75 }}>End date (optional)</span>
                <input
                  className="input"
                  type="date"
                  value={newCampaign.end_date}
                  onChange={(e) => setNewCampaign({ ...newCampaign, end_date: e.target.value })}
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, opacity: 0.75 }}>Status</span>
                <select
                  className="input"
                  value={newCampaign.status}
                  onChange={(e) => setNewCampaign({ ...newCampaign, status: e.target.value })}
                >
                  <option value="active">active</option>
                  <option value="paused">paused</option>
                  <option value="ended">ended</option>
                </select>
              </label>
            </div>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, opacity: 0.75 }}>Notes (optional)</span>
              <textarea
                className="input"
                rows={3}
                value={newCampaign.notes}
                onChange={(e) => setNewCampaign({ ...newCampaign, notes: e.target.value })}
                placeholder="Any notes about targeting, offer, etc."
              />
            </label>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="quote-btn" onClick={createCampaign} disabled={saving}>
                {saving ? "Adding..." : "Add Campaign"}
              </button>
              <button className="quote-btn" onClick={() => setShowAdd(false)} disabled={saving}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CONTROLS */}
      <div
        style={{
          border: "1px solid #2a2a2a",
          borderRadius: 14,
          padding: 12,
          display: "grid",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "end" }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, opacity: 0.75 }}>Date range (leads)</span>
            <select className="input" value={dateRange} onChange={(e) => setDateRange(e.target.value as DateRangeKey)}>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, opacity: 0.75 }}>Platform</span>
            <select className="input" value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}>
              {platformOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, opacity: 0.75 }}>Status</span>
            <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, opacity: 0.75 }}>Sort</span>
            <select className="input" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              <option value="leads_desc">Best (Most Leads)</option>
              <option value="cpl_asc">Best (Lowest CPL)</option>
              <option value="spend_desc">Most Spend</option>
              <option value="newest">Newest Campaign</option>
            </select>
          </label>

          <label style={{ display: "grid", gap: 6, minWidth: 260, flex: 1 }}>
            <span style={{ fontSize: 12, opacity: 0.75 }}>Search</span>
            <input
              className="input"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
              placeholder="Search name, utm_campaign, platform..."
            />
          </label>

          <button className="quote-btn" onClick={applySearch} disabled={saving}>
            Search
          </button>
          <button className="quote-btn" onClick={clearSearch} disabled={saving}>
            Clear
          </button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 13, opacity: 0.9 }}>
          <span>
            Campaigns shown: <b>{rows.length}</b>
          </span>
          <span>
            Leads in range: <b>{totals.totalLeads}</b>
          </span>
          <span>
            Spend (shown): <b>{formatMoney(totals.totalSpend)}</b>
          </span>
          <span>
            Blended CPL: <b>{totals.blendedCpl == null ? "—" : formatMoney(totals.blendedCpl)}</b>
          </span>
          {msg ? <span style={{ opacity: 1 }}>{msg}</span> : null}
        </div>
      </div>

      {/* TABLE */}
      <div style={{ border: "1px solid #2a2a2a", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.06)" }}>
                <th style={th}>Campaign</th>
                <th style={th}>Platform</th>
                <th style={th}>Status</th>
                <th style={thRight}>Spend</th>
                <th style={thRight}>Leads</th>
                <th style={thRight}>Lead %</th>
                <th style={thRight}>CPL</th>
                <th style={th}>Top Sources</th>
                <th style={th}>UTM</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => {
                const cplText = r.cpl == null ? "—" : formatMoney(r.cpl);
                const spendText = formatMoney(toNumber(r.spend));

                return (
                  <tr key={r.id} style={{ borderTop: "1px solid #2a2a2a" }}>
                    <td style={td}>
                      <div style={{ fontWeight: 800 }}>{r.name}</div>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>
                        Started: {new Date(r.start_date).toLocaleDateString()}
                        {r.end_date ? ` • End: ${new Date(r.end_date).toLocaleDateString()}` : ""}
                      </div>
                    </td>
                    <td style={td}>{clean(r.platform) || "Other"}</td>
                    <td style={td}>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: 999,
                          border: "1px solid #2a2a2a",
                          background:
                            r.status === "active"
                              ? "rgba(0, 255, 140, 0.10)"
                              : r.status === "paused"
                              ? "rgba(255, 215, 0, 0.10)"
                              : "rgba(255, 90, 90, 0.10)",
                        }}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td style={tdRight}>{spendText}</td>
                    <td style={tdRight}>
                      <b>{r.leads}</b>
                    </td>
                    <td style={tdRight}>{formatPct(r.leadShare)}</td>
                    <td style={tdRight}>{cplText}</td>
                    <td style={td}>{r.topSources}</td>
                    <td style={td}>
                      <code style={{ fontSize: 12, opacity: 0.9 }}>{r.utm_campaign}</code>
                    </td>
                    <td style={td}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button className="quote-btn" onClick={() => copyTrackingLink(r)} disabled={saving}>
                          Copy Link
                        </button>
                        <button className="quote-btn" onClick={() => openEdit(r)} disabled={saving}>
                          Edit
                        </button>
                        <button className="quote-btn" onClick={() => deleteCampaign(r.id)} disabled={saving}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {rows.length === 0 && (
                <tr>
                  <td style={{ padding: 12 }} colSpan={10}>
                    No campaigns match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT PANEL */}
      {editing && (
        <div style={{ border: "1px solid #2a2a2a", borderRadius: 14, padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 16 }}>Edit Campaign</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>
                UTM (read-only): <code>{editing.utm_campaign}</code>
              </div>
            </div>
            <button className="quote-btn" onClick={closeEdit} disabled={saving}>
              Close
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, opacity: 0.75 }}>Name</span>
              <input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, opacity: 0.75 }}>Platform</span>
              <select className="input" value={editing.platform} onChange={(e) => setEditing({ ...editing, platform: e.target.value })}>
                <option>Facebook</option>
                <option>Google</option>
                <option>TikTok</option>
                <option>Nextdoor</option>
                <option>Other</option>
              </select>
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, opacity: 0.75 }}>Spend</span>
              <input className="input" inputMode="decimal" value={String(editing.spend)} onChange={(e) => setEditing({ ...editing, spend: Number(e.target.value) || 0 })} />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, opacity: 0.75 }}>Status</span>
              <select className="input" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                <option value="active">active</option>
                <option value="paused">paused</option>
                <option value="ended">ended</option>
              </select>
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, opacity: 0.75 }}>Start date</span>
              <input className="input" type="date" value={editing.start_date} onChange={(e) => setEditing({ ...editing, start_date: e.target.value })} />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, opacity: 0.75 }}>End date (optional)</span>
              <input className="input" type="date" value={editing.end_date ?? ""} onChange={(e) => setEditing({ ...editing, end_date: e.target.value || null })} />
            </label>

            <label style={{ display: "grid", gap: 6, gridColumn: "1 / -1" }}>
              <span style={{ fontSize: 12, opacity: 0.75 }}>Notes</span>
              <textarea className="input" rows={4} value={editing.notes ?? ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
            </label>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <button className="quote-btn" onClick={saveEdit} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button className="quote-btn" onClick={closeEdit} disabled={saving}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ fontSize: 13, opacity: 0.75 }}>
        This table counts leads that have <code>utm_campaign</code> set. If a lead has no UTMs, it won’t be attributed here.
      </div>
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: 10,
  fontSize: 12,
  opacity: 0.85,
  whiteSpace: "nowrap",
};

const thRight: React.CSSProperties = {
  ...th,
  textAlign: "right",
};

const td: React.CSSProperties = {
  padding: 10,
  verticalAlign: "top",
};

const tdRight: React.CSSProperties = {
  ...td,
  textAlign: "right",
  whiteSpace: "nowrap",
};
