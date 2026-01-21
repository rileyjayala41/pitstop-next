import { supabaseServer } from "@/lib/supabaseServer";
import MarketingDashboardClient, {
  type CampaignRow,
  type LeadLite,
} from "@/components/MarketingDashboardClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  // 1) Load campaigns (your permanent table)
  const { data: campaigns, error: campaignsError } = await supabaseServer
    .from("marketing_campaigns")
    .select(
      "id,name,utm_campaign,platform,spend,start_date,end_date,status,notes,created_at,updated_at"
    )
    .order("created_at", { ascending: false })
    .returns<CampaignRow[]>();

  if (campaignsError) {
    return (
      <main className="container">
        <h2>Marketing Dashboard</h2>
        <p style={{ color: "crimson" }}>
          Failed to load campaigns: {campaignsError.message}
        </p>
      </main>
    );
  }

  // 2) Load a lightweight set of lead fields for campaign attribution
  // Keep it small and stable. We’ll filter/sort client-side for UX.
  const { data: leads, error: leadsError } = await supabaseServer
    .from("leads")
    .select("id,created_at,utm_campaign,utm_source,utm_medium")
    .order("created_at", { ascending: false })
    .returns<LeadLite[]>();

  if (leadsError) {
    return (
      <main className="container">
        <h2>Marketing Dashboard</h2>
        <p style={{ color: "crimson" }}>
          Failed to load leads: {leadsError.message}
        </p>
      </main>
    );
  }

  return (
    <main className="container">
      <h2>Marketing Dashboard</h2>
      <MarketingDashboardClient campaigns={campaigns ?? []} leads={leads ?? []} />
    </main>
  );
}
