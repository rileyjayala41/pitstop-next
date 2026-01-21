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

  // UTM tracking fields
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  gclid?: string | null;
  fbclid?: string | null;

  // follow-up + conversion fields
  contacted_at?: string | null;
  booked?: boolean | null;
  job_value?: number | null;
};

type StatusFilter =
  | "All"
  | "New"
  | "Contacted"
  | "Scheduled"
  | "In Progress"
  | "Completed"
  | "Closed";

type FollowUpFilter =
  | "All"
  | "Needs follow-up"
  | "Contacted"
  | "Booked"
  | "Unbooked";

const STATUS_OPTIONS: StatusFilter[] = [
  "All",
  "New",
  "Contacted",
  "Scheduled",
  "In Progress",
  "Completed",
  "Closed",
];

const FOLLOWUP_OPTIONS: FollowUpFilter[] = [
  "All",
  "Needs follow-up",
  "Contacted",
  "Booked",
  "Unbooked",
];

function cleanKey(v: unknown) {
  if (typeof v !== "string") return "";
  return v.trim();
}

function formatMoney(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export default function AdminLeadsTable({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialLeads?.[0]?.id ?? null
  );

  // filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [followUpFilter, setFollowUpFilter] = useState<FollowUpFilter>("All");
  const [sourceFilter, setSourceFilter] = useState<string>("All");
  const [campaignFilter, setCampaignFilter] = useState<string>("All");
  const [search, setSearch] = useState<string>("");

  // editor fields
  const selected = useMemo(
    () => leads.find((l) => l.id === selectedId) ?? null,
    [leads, selectedId]
  );

  const [status, setStatus] = useState<string>("New");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [jobValueDraft, setJobValueDraft] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Keep sidebar editor in sync with selection
  useEffect(() => {
    if (!selected) return;
    setStatus(selected.status || "New");
    setAssignedTo(selected.assigned_to ?? "");
    setNotes(selected.notes ?? "");
    setJobValueDraft(
      selected.job_value === null || selected.job_value === undefined
        ? ""
        : String(selected.job_value)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

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
    const q = cleanKey(search).toLowerCase();

    return leads.filter((l) => {
      // status filter
      if (statusFilter !== "All" && l.status !== statusFilter) return false;

      // source filter
      if (sourceFilter !== "All") {
        const s = cleanKey(l.utm_source ?? l.source);
        if (s !== sourceFilter) return false;
      }

      // campaign filter
      if (campaignFilter !== "All") {
        const c = cleanKey(l.utm_campaign);
        if (c !== campaignFilter) return false;
      }

      // follow-up filter
      const contacted = !!l.contacted_at;
      const booked = !!l.booked;

      if (followUpFilter === "Needs follow-up") {
        if (contacted || booked) return false;
      } else if (followUpFilter === "Contacted") {
        if (!contacted) return false;
      } else if (followUpFilter === "Booked") {
        if (!booked) return false;
      } else if (followUpFilter === "Unbooked") {
        if (booked) return false;
      }

      // search
      if (q) {
        const hay =
          `${l.name} ${l.phone} ${l.address} ${l.vehicle} ${l.service} ${l.message ?? ""} ${l.status} ${l.utm_campaign ?? ""} ${l.utm_source ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [leads, statusFilter, sourceFilter, campaignFilter, followUpFilter, search]);

  // Keep selection valid when filters change
  useEffect(() => {
    if (!selectedId) return;
    if (!filteredLeads.some((l) => l.id === selectedId)) {
      setSelectedId(filteredLeads[0]?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, sourceFilter, campaignFilter, followUpFilter, leads]);

  async function patchLead(
    id: string,
    payload: {
      status?: string;
      assigned_to?: string;
      notes?: string;
      contacted_at?: string | null;
      booked?: boolean;
      job_value?: number | null;
    }
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
      contacted_at: string | null;
      booked: boolean;
      job_value: number | null;
    };
  }

  async function saveEdits() {
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
                contacted_at: updated.contacted_at,
                booked: updated.booked,
                job_value: updated.job_value,
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
      const nowIso = new Date().toISOString();
      const nextStatus = selected.status === "New" ? "Contacted" : selected.status;

      const updated = await patchLead(selected.id, {
        contacted_at: nowIso,
        status: nextStatus,
      });

      setStatus(updated.status);

      setLeads((prev) =>
        prev.map((l) =>
          l.id === selected.id
            ? { ...l, status: updated.status, contacted_at: updated.contacted_at }
            : l
        )
      );

      setMsg("Marked Contacted ✅");
    } catch (e: any) {
      setMsg(`Error: ${e?.message || "Update failed"}`);
    } finally {
      setSaving(false);
    }
  }

  async function markBooked() {
    if (!selected) return;
    setSaving(true);
    setMsg(null);

    try {
      const v = jobValueDraft.trim();
      const jobValue = v.length ? Number(v) : null;
      if (v.length && !Number.isFinite(jobValue)) {
        setMsg("Job value must be a number (decimals ok).");
        setSaving(false);
        return;
      }

      const nextStatus =
        selected.status === "New" || selected.status === "Contacted"
          ? "Scheduled"
          : selected.status;

      const updated = await patchLead(selected.id, {
        booked: true,
        job_value: jobValue,
        status: nextStatus,
      });

      setStatus(updated.status);

      setLeads((prev) =>
        prev.map((l) =>
          l.id === selected.id
            ? {
                ...l,
                status: updated.status,
                booked: updated.booked,
                job_value: updated.job_value,
              }
            : l
        )
      );

      setMsg("Marked Booked ✅");
    } catch (e: any) {
      setMsg(`Error: ${e?.message || "Update failed"}`);
    } finally {
      setSaving(false);
    }
  }

  function copySummary() {
    if (!selected) return;

    const source = cleanKey(selected.utm_source ?? selected.source) || "—";
    const medium = cleanKey(selected.utm_medium) || "—";
    const campaign = cleanKey(selected.utm_campaign) || "—";

    const text =
      `Lead ${selected.id}\n` +
      `Name: ${selected.name}\n` +
      `Phone: ${selected.phone}\n` +
      `Address: ${selected.address}\n` +
      `Vehicle: ${selected.vehicle}\n` +
      `Service: ${selected.service}\n` +
      `Status: ${selected.status}\n` +
      `Contacted: ${selected.contacted_at ? "Yes" : "No"}\n` +
      `Booked: ${selected.booked ? "Yes" : "No"}\n` +
      `Job Value: ${selected.job_value == null ? "—" : formatMoney(selected.job_value)}\n` +
      `Source: ${source}\n` +
      `Medium: ${medium}\n` +
      `Campaign: ${campaign}\n` +
      `Message: ${selected.message ?? ""}\n`;

    navigator.clipboard.writeText(text);
    setMsg("Copied ✅");
  }

  const contacted = !!selected?.contacted_at;
  const booked = !!selected?.booked;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 14 }}>
      {/* LEFT: LEAD LIST + FILTERS */}
      <div
        style={{
          border: "1px solid #2a2a2a",
          borderRadius: 14,
          overflow: "hidden",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <div style={{ padding: 12, borderBottom: "1px solid #2a2a2a" }}>
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, opacity: 0.8 }}>Status</span>
                <select
                  className="input"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s} {statusCounts[s] ? `(${statusCounts[s]})` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, opacity: 0.8 }}>Follow-up</span>
                <select
                  className="input"
                  value={followUpFilter}
                  onChange={(e) => setFollowUpFilter(e.target.value as FollowUpFilter)}
                >
                  {FOLLOWUP_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <label style={{ display: "grid", gap: 6, flex: 1, minWidth: 140 }}>
                <span style={{ fontSize: 12, opacity: 0.8 }}>Source</span>
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

              <label style={{ display: "grid", gap: 6, flex: 1, minWidth: 140 }}>
                <span style={{ fontSize: 12, opacity: 0.8 }}>Campaign</span>
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

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, opacity: 0.8 }}>Search</span>
              <input
                className="input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, phone, address, service..."
              />
            </label>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 13, opacity: 0.9 }}>
              <span>
                Showing: <b>{filteredLeads.length}</b>
              </span>
              <span>
                Total: <b>{leads.length}</b>
              </span>
            </div>
          </div>
        </div>

        <div style={{ maxHeight: 520, overflowY: "auto" }}>
          {filteredLeads.map((l) => {
            const active = l.id === selectedId;

            const source = cleanKey(l.utm_source ?? l.source);
            const campaign = cleanKey(l.utm_campaign);

            const isContacted = !!l.contacted_at;
            const isBooked = !!l.booked;

            return (
              <button
                key={l.id}
                onClick={() => setSelectedId(l.id)}
                onMouseEnter={(e) => {
                  if (active) return;
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(255,255,255,0.07)";
                }}
                onMouseLeave={(e) => {
                  if (active) return;
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(255,255,255,0.04)";
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: 12,
                  border: "none",
                  borderBottom: "1px solid rgba(255,255,255,0.10)",
                  cursor: "pointer",
                  color: "#F3F3F3",
                  background: active ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.04)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontWeight: 900, letterSpacing: 0.2 }}>{l.name}</div>
                  <div style={{ fontSize: 12, opacity: 0.9 }}>
                    {new Date(l.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div style={{ fontSize: 13, opacity: 0.95, marginTop: 4 }}>
                  {l.service} • {l.vehicle}
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                  <span style={pill}>{l.status}</span>
                  {isContacted ? (
                    <span style={pillGreen}>Contacted</span>
                  ) : (
                    <span style={pillGray}>Not contacted</span>
                  )}
                  {isBooked ? (
                    <span style={pillBlue}>Booked</span>
                  ) : (
                    <span style={pillGray}>Unbooked</span>
                  )}
                </div>

                {(source || campaign) && (
                  <div style={{ fontSize: 12, opacity: 0.9, marginTop: 6 }}>
                    {source ? `Src: ${source}` : ""}
                    {source && campaign ? " • " : ""}
                    {campaign ? `Camp: ${campaign}` : ""}
                  </div>
                )}
              </button>
            );
          })}

          {filteredLeads.length === 0 && (
            <div style={{ padding: 12, opacity: 0.9, color: "#F3F3F3" }}>
              No leads match your filters.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: DETAILS + ACTIONS */}
      <div style={{ border: "1px solid #2a2a2a", borderRadius: 14, padding: 12 }}>
        {!selected ? (
          <div style={{ opacity: 0.8 }}>Select a lead to view details.</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 18 }}>{selected.name}</div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>
                  Created: {new Date(selected.created_at).toLocaleString()}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <a className="quote-btn" href={`tel:${selected.phone}`}>
                  Call
                </a>
                <a className="quote-btn" href={`sms:${selected.phone}`}>
                  Text
                </a>
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
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="quote-btn" onClick={markContacted} disabled={saving || contacted}>
                {contacted ? "Contacted ✅" : "Mark Contacted"}
              </button>

              <button className="quote-btn" onClick={markBooked} disabled={saving || booked}>
                {booked ? "Booked ✅" : "Mark Booked"}
              </button>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, opacity: 0.75 }}>Job value (optional)</span>
                <input
                  className="input"
                  inputMode="decimal"
                  value={jobValueDraft}
                  onChange={(e) => setJobValueDraft(e.target.value)}
                  placeholder="250.00"
                  style={{ minWidth: 160 }}
                />
              </label>
            </div>

            {msg ? <div style={{ fontSize: 13 }}>{msg}</div> : null}

            <hr style={{ border: "none", borderTop: "1px solid #2a2a2a" }} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={label}>Phone</div>
                <div>{selected.phone}</div>
              </div>
              <div>
                <div style={label}>Address</div>
                <div>{selected.address}</div>
              </div>
              <div>
                <div style={label}>Vehicle</div>
                <div>{selected.vehicle}</div>
              </div>
              <div>
                <div style={label}>Service</div>
                <div>{selected.service}</div>
              </div>
            </div>

            {selected.message ? (
              <div>
                <div style={label}>Message</div>
                <div style={{ whiteSpace: "pre-wrap" }}>{selected.message}</div>
              </div>
            ) : null}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={label}>Status</span>
                <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                  {STATUS_OPTIONS.filter((s) => s !== "All").map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={label}>Assigned To</span>
                <input
                  className="input"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="Riley"
                />
              </label>
            </div>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={label}>Notes</span>
              <textarea
                className="input"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Follow-up notes..."
              />
            </label>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="quote-btn" onClick={saveEdits} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>

            {/* Attribution */}
            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
              <div>
                <b>Attribution:</b>{" "}
                {cleanKey(selected.utm_source ?? selected.source) || "—"}{" "}
                {selected.utm_medium ? ` / ${selected.utm_medium}` : ""}{" "}
                {selected.utm_campaign ? ` / ${selected.utm_campaign}` : ""}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const label: React.CSSProperties = { fontSize: 12, opacity: 0.75, marginBottom: 4 };

const pill: React.CSSProperties = {
  fontSize: 12,
  padding: "3px 8px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.18)",
  opacity: 0.95,
};

const pillGreen: React.CSSProperties = {
  ...pill,
  background: "rgba(0, 255, 140, 0.12)",
};

const pillBlue: React.CSSProperties = {
  ...pill,
  background: "rgba(80, 170, 255, 0.14)",
};

const pillGray: React.CSSProperties = {
  ...pill,
  background: "rgba(255,255,255,0.08)",
};
