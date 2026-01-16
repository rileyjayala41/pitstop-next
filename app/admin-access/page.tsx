export default function AdminAccessPage() {
  return (
    <main className="container">
      <section>
        <h2>Admin Access</h2>
        <p>
          This page is protected. Use your private admin link to access the dashboard.
        </p>

        <div style={{ marginTop: 16, padding: 12, border: "1px solid #2a2a2a", borderRadius: 12 }}>
          <p style={{ marginTop: 0 }}>
            Your private link format:
          </p>
          <code style={{ display: "block", padding: 10, background: "rgba(255,255,255,0.06)", borderRadius: 10 }}>
            /admin/leads?key=YOUR_PASSWORD
          </code>
          <p style={{ opacity: 0.85 }}>
            (Don’t share it publicly.)
          </p>
        </div>
      </section>
    </main>
  );
}
