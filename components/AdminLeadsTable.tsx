"use client";

import { useEffect, useMemo, useState } from "react";

type Lead = {
  id: string;
  created_at: string;

  name: string;
  phone: string;
  address: string;
  vehicle: string;
  service: string;
  message: string | null;

  status: string;
  assigned_to: string | null;
  notes: string | null;

  // legacy / optional
  source: string | null;

  // NEW: UTM tracking fields (from Supabase)
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
};

type StatusFilter =
  | "All"
  | "New"
  | "Contacted"
  | "Scheduled"
  | "In Progress"
  | "Completed"
  | "Closed";

const STATUS_OPTIONS: StatusFilter[] = [
  "All",
  "New",
  "Contacted",
  "Scheduled",
  "In Progress",
  "Completed",
  "Closed",
];

function cleanKey(v: unknown) {
  if (typeof v !== "string") return "";
  return v.trim();
}

export default function AdminLeadsTable({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialLeads[0]?.id ?? null
  );

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [sourceFilter, setSourceFilter] = useState<string>("All");
  const [campaignFilter, setCampaignFilter] = useState<string>("All");

  const selected = useMemo(
    () => leads.find((l) => l.id === selectedId) ?? null,
    [leads, selectedId]
  );

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { All: leads.length };
    for (const l of leads) c[l.status] = (c[l.status] || 0) + 1;
    return c;
  }, [leads]);

  const sourceOptions = useMemo(() => {
    const set = new Set<string>();
    for (const l of leads) {
      const s = cleanKey(l.utm_source ?? l.source);
      if (s) set.add(s);
    }
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [leads]);

  const campaignOptions = useMemo(() => {
    const set = new Set<string>();
    for (const l of leads) {
      const c = cleanKey(l.utm_campaign);
      if (c) set.add(c);
    }
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (statusFilter !== "All" && l.status !== statusFilter) return false;

      const leadSource = cleanKey(l.utm_source ?? l.source);
      if (sourceFilter !== "All" && leadSource !== sourceFilter) return false;

      const leadCampaign = cleanKey(l.utm_campaign);
      if (campaignFilter !== "All" && leadCampaign !== campaignFilter) return false;

      return true;
    });
  }, [leads, statusFilter, sourceFilter, campaignFilter]);

  // Editor state
  const [status, setStatus] = useState("New");
  const [assignedTo, setAssignedTo] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!selected) return;
    setStatus(selected.status || "New");
    setAssignedTo(selected.assigned_to ?? "");
    setNotes(selected.notes ?? "");
    setMsg(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // Keep selection valid when filters change
  useEffect(() => {
    if (!selectedId) return;
    if (!filteredLeads.some((l) => l.id === selectedId)) {
      setSelectedId(filteredLeads[0]?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, sourceFilter, campaignFilter, leads]);

  async function patchLead(
    id: string,
    payload: { status?: string; assigned_to?: string; notes?: string }
  ) {
    const res = await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json?.error || "Update failed");
    return json.lead as {
      id: string;
      status: string;
      assigned_to: string | null;
      notes: string | null;
    };
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    setMsg(null);

    try {
      const updated = await patchLead(selected.id, {
        status,
        assigned_to: assignedTo,
        notes,
      });

      setLeads((prev) =>
        prev.map((l) =>
          l.id === selected.id
            ? {
                ...l,
                status: updated.status,
                assigned_to: updated.assigned_to,
                notes: updated.notes,
              }
            : l
        )
      );

      setMsg("Saved ✅");
    } catch (e: any) {
      setMsg(`Error: ${e?.message || "Save failed"}`);
    } finally {
      setSaving(false);
    }
  }

  async function markContacted() {
    if (!selected) return;
    setSaving(true);
    setMsg(null);

    try {
      const updated = await patchLead(selected.id, { status: "Contacted" });
      setStatus(updated.status);

      setLeads((prev) =>
        prev.map((l) => (l.id === selected.id ? { ...l, status: updated.status } : l))
      );

      setMsg("Marked Contacted ✅");
    } catch (e: any) {
      setMsg(`Error: ${e?.message || "Update failed"}`);
    } finally {
      setSaving(false);
    }
  }

  function copySummary() {
    if (!selected) return;

    const source = cleanKey(selected.utm_source ?? selected.source) || "-";
    const campaign = cleanKey(selected.utm_campaign) || "-";

    const text = `
Name: ${selected.name}
Phone: ${selected.phone}
Address: ${selected.address}
Service: ${selected.service}
Vehicle: ${selected.vehicle}
Source: ${source}
Campaign: ${campaign}
Status: ${status}
Assigned To: ${assignedTo || "-"}
Notes: ${notes || "-"}
    `.trim();

    navigator.clipboard.writeText(text);
    setMsg("Copied to clipboard 📋");
  }

  const selectedSource = cleanKey(selected?.utm_source ?? selected?.source) || "—";
  const selectedCampaign = cleanKey(selected?.utm_campaign) || "—";
  const selectedMedium = cleanKey(selected?.utm_medium) || "—";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 18 }}>
      {/* LEFT */}
      <div style={{ border: "1px solid #2a2a2a", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: 12, borderBottom: "1px solid #2a2a2a" }}>
          <strong>Leads</strong>

          {/* STATUS FILTER PILLS */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            {STATUS_OPTIONS.map((k) => (
              <button
                key={k}
                onClick={() => setStatusFilter(k)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid #2a2a2a",
                  background:
                    statusFilter === k ? "rgba(255,255,255,0.12)" : "transparent",
                  color: "inherit",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                {k} ({statusCounts[k] || 0})
              </button>
            ))}
          </div>

          {/* SOURCE + CAMPAIGN FILTERS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginTop: 12,
            }}
          >
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, opacity: 0.75 }}>Source</span>
              <select
                className="input"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
              >
                {sourceOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, opacity: 0.75 }}>Campaign</span>
              <select
                className="input"
                value={campaignFilter}
                onChange={(e) => setCampaignFilter(e.target.value)}
              >
                {campaignOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* QUICK COUNTS */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10, fontSize: 13, opacity: 0.85 }}>
            <span>
              Showing: <b>{filteredLeads.length}</b>
            </span>
            <span>
              Total: <b>{leads.length}</b>
            </span>
          </div>
        </div>

        <div style={{ maxHeight: 520, overflowY: "auto" }}>
          {filteredLeads.map((l) => {
            const active = l.id === selectedId;
            const isNew = l.status === "New";

            const source = cleanKey(l.utm_source ?? l.source);
            const campaign = cleanKey(l.utm_campaign);

            return (
              <button
                key={l.id}
                onClick={() => setSelectedId(l.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: 12,
                  border: "none",
                  borderBottom: "1px solid #2a2a2a",
                  background: active
                    ? "rgba(255,255,255,0.10)"
                    : isNew
                    ? "rgba(255, 215, 0, 0.12)"
                    : "transparent",
                  color: "inherit",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <strong>{l.name}</strong>
                  <span style={{ opacity: 0.7, whiteSpace: "nowrap" }}>
                    {new Date(l.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div style={{ opacity: 0.85, marginTop: 4 }}>
                  {l.service} • {l.vehicle}
                </div>

                <div style={{ opacity: 0.75, marginTop: 4, fontSize: 13 }}>
                  {source ? (
                    <>
                      <span>
                        Source: <b>{source}</b>
                      </span>
                      {campaign ? (
                        <span style={{ opacity: 0.9 }}>
                          {" "}
                          • Campaign: <b>{campaign}</b>
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <span>Source: —</span>
                  )}
                </div>

                <div style={{ opacity: 0.7, marginTop: 2 }}>
                  Status: <strong>{l.status}</strong>
                </div>

                {isNew && (
                  <span
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 12,
                      fontSize: 12,
                      padding: "2px 8px",
                      borderRadius: 999,
                      border: "1px solid rgba(255,215,0,0.5)",
                      background: "rgba(255,215,0,0.15)",
                    }}
                  >
                    NEW
                  </span>
                )}
              </button>
            );
          })}

          {filteredLeads.length === 0 && (
            <div style={{ padding: 12 }}>
              No leads match these filters.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT */}
      <div style={{ border: "1px solid #2a2a2a", borderRadius: 14, padding: 14 }}>
        <h3 style={{ marginTop: 0 }}>Lead Details</h3>

        {!selected ? (
          <p>Select a lead.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <strong>Name:</strong> {selected.name}
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a className="quote-btn" href={`tel:${selected.phone}`}>Call</a>
              <a className="quote-btn" href={`sms:${selected.phone}`}>Text</a>
              <a
                className="quote-btn"
                target="_blank"
                rel="noreferrer"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  selected.address
                )}`}
              >
                Maps
              </a>
              <button className="quote-btn" onClick={copySummary}>
                Copy
              </button>
              <button className="quote-btn" onClick={markContacted} disabled={saving}>
                Mark Contacted
              </button>
            </div>

            <div><strong>Address:</strong> {selected.address}</div>
            <div><strong>Service:</strong> {selected.service}</div>
            <div><strong>Vehicle:</strong> {selected.vehicle}</div>

            {/* MARKETING TRACKING */}
            <div style={{ border: "1px solid #2a2a2a", borderRadius: 12, padding: 10, marginTop: 6 }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Marketing Tracking</div>
              <div style={{ display: "grid", gap: 4, fontSize: 13, opacity: 0.9 }}>
                <div>
                  <strong>Source:</strong> {selectedSource}
                </div>
                <div>
                  <strong>Campaign:</strong> {selectedCampaign}
                </div>
                <div>
                  <strong>Medium:</strong> {selectedMedium}
                </div>
                {(cleanKey(selected.gclid) || cleanKey(selected.fbclid)) ? (
                  <div style={{ opacity: 0.85 }}>
                    <strong>Click IDs:</strong>{" "}
                    {cleanKey(selected.gclid) ? `gclid=${cleanKey(selected.gclid)} ` : ""}
                    {cleanKey(selected.fbclid) ? `fbclid=${cleanKey(selected.fbclid)}` : ""}
                  </div>
                ) : null}
              </div>
            </div>

            {/* MESSAGE */}
            {selected.message ? (
              <div style={{ border: "1px solid #2a2a2a", borderRadius: 12, padding: 10 }}>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>Customer Message</div>
                <div style={{ whiteSpace: "pre-wrap", opacity: 0.9 }}>{selected.message}</div>
              </div>
            ) : null}

            <label>
              <strong>Status</strong>
              <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option>New</option>
                <option>Contacted</option>
                <option>Scheduled</option>
                <option>In Progress</option>
                <option>Completed</option>
                <option>Closed</option>
              </select>
            </label>

            <label>
              <strong>Assigned To</strong>
              <input
                className="input"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              />
            </label>

            <label>
              <strong>Notes</strong>
              <textarea
                className="input"
                rows={6}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>

            <button className="quote-btn" disabled={saving} onClick={save}>
              {saving ? "Saving..." : "Save Updates"}
            </button>

            {msg && <div>{msg}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
