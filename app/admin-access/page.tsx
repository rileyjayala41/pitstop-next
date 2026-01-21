"use client";

import { useState } from "react";

export default function AdminAccessPage() {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function login() {
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch("/api/admin/simple-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json?.error || "Login failed");

      window.location.href = "/admin/leads";
    } catch (e: any) {
      setMsg(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container" style={{ paddingTop: 40 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900 }}>Admin Access</h1>
      <p style={{ opacity: 0.75 }}>Enter your admin password.</p>

      <div style={{ maxWidth: 520, marginTop: 16, display: "grid", gap: 10 }}>
        <input
          className="input"
          type="password"
          placeholder="Admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="quote-btn" onClick={login} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        {msg && <div style={{ color: "#ff6b6b" }}>{msg}</div>}
      </div>
    </main>
  );
}
