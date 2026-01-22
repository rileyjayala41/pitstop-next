"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminAccessPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login() {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/simple-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        setError(json?.error || "Login failed");
        return;
      }

      router.push("/admin/leads");
      router.refresh();
    } catch {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ fontSize: 34, fontWeight: 900, margin: 0 }}>Admin Access</h1>
      <p style={{ marginTop: 10, opacity: 0.85 }}>
        Enter your admin password to access leads and marketing.
      </p>

      <div style={{ marginTop: 18 }}>
        <label style={{ display: "block", fontSize: 14, opacity: 0.85, marginBottom: 8 }}>
          Password
        </label>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter admin password"
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(255,255,255,0.06)",
            color: "inherit",
            outline: "none",
          }}
        />

        {error ? (
          <div style={{ marginTop: 10, color: "#ff7b7b", fontSize: 14 }}>{error}</div>
        ) : null}

        <button
          className="quote-btn"
          onClick={login}
          disabled={loading || password.trim().length === 0}
          style={{ marginTop: 14 }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </div>
    </main>
  );
}
