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
  source: string | null;
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

export default function AdminLeadsTable({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialLeads[0]?.id ?? null
  );
  const [filter, setFilter] = useState<StatusFilter>("All");

  const selected = useMemo(
    () => leads.find((l) => l.id === selectedId) ?? null,
    [leads, selectedId]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: leads.length };
    for (const l of leads) c[l.status] = (c[l.status] || 0) + 1;
    return c;
  }, [leads]);

  const filteredLeads = useMemo(() => {
    if (filter === "All") return leads;
    return leads.filter((l) => l.status === filter);
  }, [leads, filter]);

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

  useEffect(() => {
    if (!selectedId) return;
    if (!filteredLeads.some((l) => l.id === selectedId)) {
      setSelectedId(filteredLeads[0]?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, leads]);

  async function save() {
    if (!selected) return;
    setSaving(true);
    setMsg(null);

    try {
      const res = await fetch(`/api/leads/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, assigned_to: assignedTo, notes }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error || "Save failed");

      setLeads((prev) =>
        prev.map((l) =>
          l.id === selected.id
            ? {
                ...l,
                status: json.lead.status,
                assigned_to: json.lead.assigned_to,
                notes: json.lead.notes,
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

  function copySummary() {
    if (!selected) return;
    const text = `
Name: ${selected.name}
Phone: ${selected.phone}
Address: ${selected.address}
Service: ${selected.service}
Vehicle: ${selected.vehicle}
Status: ${status}
Assigned To: ${assignedTo || "-"}
Notes: ${notes || "-"}
    `.trim();

    navigator.clipboard.writeText(text);
    setMsg("Copied to clipboard 📋");
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 18 }}>
      {/* LEFT */}
      <div style={{ border: "1px solid #2a2a2a", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: 12, borderBottom: "1px solid #2a2a2a" }}>
          <strong>Leads</strong>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            {STATUS_OPTIONS.map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid #2a2a2a",
                  background: filter === k ? "rgba(255,255,255,0.12)" : "transparent",
                  color: "inherit",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                {k} ({counts[k] || 0})
              </button>
            ))}
          </div>
        </div>

        <div style={{ maxHeight: 520, overflowY: "auto" }}>
          {filteredLeads.map((l) => (
            <button
              key={l.id}
              onClick={() => setSelectedId(l.id)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: 12,
                border: "none",
                borderBottom: "1px solid #2a2a2a",
                background: l.id === selectedId ? "rgba(255,255,255,0.08)" : "transparent",
                color: "inherit",
                cursor: "pointer",
              }}
            >
              <strong>{l.name}</strong>
              <div style={{ opacity: 0.8 }}>
                {l.service} • {l.vehicle}
              </div>
              <div style={{ opacity: 0.7 }}>
                Status: <strong>{l.status}</strong>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT */}
      <div style={{ border: "1px solid #2a2a2a", borderRadius: 14, padding: 14 }}>
        <h3 style={{ marginTop: 0 }}>Lead Details</h3>

        {!selected ? (
          <p>Select a lead.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            <div><strong>Name:</strong> {selected.name}</div>

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
            </div>

            <div><strong>Address:</strong> {selected.address}</div>
            <div><strong>Service:</strong> {selected.service}</div>
            <div><strong>Vehicle:</strong> {selected.vehicle}</div>

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
