import { supabaseServer } from "@/lib/supabaseServer";
import AdminLeadsTable from "@/components/AdminLeadsTable";

export default async function Page() {
  const { data } = await supabaseServer
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="container">
      <h2>Admin Leads</h2>
      <AdminLeadsTable initialLeads={data ?? []} />
    </main>
  );
}
