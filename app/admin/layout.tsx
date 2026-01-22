"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await fetch("/api/admin/simple-logout", { method: "POST" });
    } finally {
      setLoggingOut(false);
      router.push("/admin-access");
      router.refresh();
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <Link className="quote-btn" href="/admin/leads" style={{ textDecoration: "none" }}>
            Leads
          </Link>
          <Link className="quote-btn" href="/admin/marketing" style={{ textDecoration: "none" }}>
            Marketing
          </Link>
        </div>

        <button className="quote-btn" onClick={handleLogout} disabled={loggingOut}>
          {loggingOut ? "Logging out..." : "Logout"}
        </button>
      </header>

      {children}
    </div>
  );
}
