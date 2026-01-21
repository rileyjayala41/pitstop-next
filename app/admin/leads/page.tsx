import { supabaseServer } from "@/lib/supabaseServer";
import AdminLeadsTable from "@/components/AdminLeadsTable";

export default async function Page() {
  const { data, error } = await supabaseServer
    .from("leads")
    .select(
      [
        "id",
        "created_at",
        "name",
        "phone",
        "address",
        "vehicle",
        "service",
        "message",
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_content",
        "utm_term",
        "gclid",
        "fbclid",
      ].join(",")
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

  return (
    <main className="container">
      <h2>Admin Leads</h2>
      <AdminLeadsTable initialLeads={data ?? []} />
    </main>
  );
}
