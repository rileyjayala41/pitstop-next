import { supabaseServer } from "@/lib/supabaseServer";
import AdminLeadsTable, { type Lead } from "@/components/AdminLeadsTable";

export default async function Page() {
  const { data, error } = await supabaseServer
    .from("leads")
    .select(
      `
      id,
      created_at,
      name,
      phone,
      address,
      vehicle,
      service,
      message,
      status,
      assigned_to,
      notes,
      source,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      gclid,
      fbclid
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="container">
        <h2>Admin Leads</h2>
        <p style={{ color: "crimson" }}>
          Failed to load leads: {error.message}
        </p>
      </main>
    );
  }

  // 🔑 Explicitly narrow the type for TS (runtime unchanged)
  const leads = (data ?? []) as Lead[];

  return (
    <main className="container">
      <h2>Admin Leads</h2>
      <AdminLeadsTable initialLeads={leads} />
    </main>
  );
}
