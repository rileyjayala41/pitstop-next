import { supabaseServer } from "@/lib/supabaseServer";

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

export default async function AdminLeadsPage() {
  const { data, error } = await supabaseServer
    .from("leads")
    .select(
      "id, created_at, name, phone, address, vehicle, service, message, status, assigned_to, notes, source"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return (
      <main className="container">
        <h2>Admin — Leads</h2>
        <p style={{ color: "crimson" }}>
          Error loading leads: {error.message}
        </p>
        <p>
          This usually means the server env vars are missing locally or on
          Vercel.
        </p>
      </main>
    );
  }

  const leads = (data ?? []) as Lead[];

  return (
    <main className="container">
      <section>
        <h2>Admin — Leads</h2>
        <p>Total: {leads.length}</p>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Date</th>
                <th style={th}>Status</th>
                <th style={th}>Name</th>
                <th style={th}>Phone</th>
                <th style={th}>Service</th>
                <th style={th}>Vehicle</th>
                <th style={th}>Address</th>
                <th style={th}>Source</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id}>
                  <td style={td}>
                    {new Date(l.created_at).toLocaleString()}
                  </td>
                  <td style={td}>{l.status}</td>
                  <td style={td}>{l.name}</td>
                  <td style={td}>
                    <a href={`tel:${l.phone}`}>{l.phone}</a>
                  </td>
                  <td style={td}>{l.service}</td>
                  <td style={td}>{l.vehicle}</td>
                  <td style={td}>{l.address}</td>
                  <td style={td}>{l.source ?? "-"}</td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td style={td} colSpan={8}>
                    No leads yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <hr style={{ margin: "24px 0" }} />

        <h3>Next</h3>
        <ul className="ul">
          <li>Add status updates + notes + assignment</li>
          <li>Add filters (New/Contacted/Scheduled/Completed)</li>
          <li>Lock this page down with real login</li>
        </ul>
      </section>
    </main>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid #ddd",
  padding: "10px 8px",
  whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  borderBottom: "1px solid #eee",
  padding: "10px 8px",
  verticalAlign: "top",
};
