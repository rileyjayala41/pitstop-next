"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data?.error || "Login failed");
      return;
    }

    window.location.href = "/admin/leads";
  }

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", padding: 18 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Admin Login</h1>
      <p style={{ marginTop: 8, opacity: 0.7 }}>
        Enter your admin password.
      </p>

      <form onSubmit={onLogin} style={{ marginTop: 18, display: "grid", gap: 10 }}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            padding: "10px 12px",
          }}
        />

        {err ? <div style={{ color: "#dc2626" }}>{err}</div> : null}

        <button
          disabled={loading}
          style={{
            border: "1px solid #111827",
            borderRadius: 10,
            padding: "10px 12px",
            background: "#111827",
            color: "white",
            cursor: "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
