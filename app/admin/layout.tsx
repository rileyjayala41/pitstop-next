"use client";

import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  async function handleLogout() {
    await fetch("/api/admin/simple-logout", {
      method: "POST",
    });

    // Send back to login page
    window.location.href = "/admin-access";
  }

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: 18,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>
            Pit Stop Admin
          </div>
          <div style={{ fontSize: 13, opacity: 0.7 }}>
            Leads & marketing dashboard
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            background: "#dc2626",
            color: "white",
            border: "1px solid #dc2626",
            borderRadius: 8,
            padding: "8px 12px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 18,
        }}
      >
        <Tab href="/admin/leads" label="Leads" />
        <Tab href="/admin/marketing" label="Marketing" />
      </div>

      {/* Page Content */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 16,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Tab({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        padding: "10px 14px",
        borderRadius: 10,
        border: "1px solid #e5e7eb",
        textDecoration: "none",
        color: "inherit",
        fontWeight: 600,
      }}
    >
      {label}
    </Link>
  );
}
