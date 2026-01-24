import LeadForm from "@/components/LeadForm";

export default function HomePage() {
  return (
    <main className="container">
      <article>
        {/* INTRO */}
        <section id="intro">
          <h2>We Come to You</h2>
          <p>
            Skip the shop. Our mobile mechanics bring expert auto care to your driveway, office, or
            anywhere in Austin.
          </p>

          {/* Stage 1 – Local Trust: Local legitimacy signals (Upgrade 3) */}
          <p className="local-signal" style={{ marginTop: 8, marginBottom: 0 }}>
            <strong>Local Austin mobile service</strong> — real people, real work, no shop visit
            needed.
          </p>

          <div className="cta">
            <a className="quote-btn" href="#quote-form">
              Get a Free Quote
            </a>

            {/* Stage 1 – Local Trust: Micro-trust near CTA (Upgrade 5A) */}
            <p style={{ marginTop: 8, marginBottom: 0, fontSize: 13, opacity: 0.78 }}>
              No obligation quote • Local Austin service
            </p>
          </div>
        </section>

        {/* SERVICES */}
        <section id="services">
          <h2>Services & Pricing</h2>
          <ul className="services-list ul">
            <li>
              <strong>Synthetic Oil Change:</strong> from $100
            </li>
            <li>
              <strong>Brake Pads:</strong> from $100 + parts
            </li>
            <li>
              <strong>Diagnostics:</strong> from $50
            </li>
            <li>
              <strong>Full Detail:</strong> from $120
            </li>
            <li>
              <strong>Tune-Ups & Suspension:</strong> from $150
            </li>
            <li>
              <strong>Engine replacement:</strong> from $1850 and up
            </li>
          </ul>

          {/* Existing local area mention (kept) */}
          <p className="service-areas">
            Serving <strong>Austin</strong>, Round Rock, Pflugerville, Cedar Park &amp; Georgetown
          </p>
        </section>

        {/* QUOTE FORM */}
        <section id="quote-form">
          <h2>Get Your Quote</h2>

          {/* Stage 1 – Local Trust: Reduce competition near form (Upgrade 6) */}
          <div style={{ marginTop: 8, marginBottom: 14 }}>
            <p style={{ margin: 0, fontSize: 14, opacity: 0.85 }}>
              <strong>Mobile mechanic in Austin</strong> — we come to you. No random subcontractors.
            </p>

            {/* Stage 1 – Local Trust: Review Near CTA (Upgrade 1) */}
            <p style={{ marginTop: 10, marginBottom: 0, fontSize: 14, opacity: 0.9 }}>
              <strong>Customer said:</strong>{" "}
              <span style={{ opacity: 0.9 }}>
                &quot;Came to my driveway and knocked it out. Saved me time and stress. Highly
                recommend!&quot;
              </span>
            </p>

            {/* Stage 1 – Local Trust: What Happens Next (Upgrade 2) */}
            <p style={{ marginTop: 10, marginBottom: 0, fontSize: 14, opacity: 0.85 }}>
              <strong>What happens next:</strong> Submit → We text/call to confirm → You get a price
              + time window (then you decide).
            </p>
          </div>

          {/* NOTE:
              UTM tracking + permanent saving is handled inside LeadForm.tsx + /api/leads.
              Your homepage does not need special code for that.
              Keep this page simple and stable.
          */}
          <LeadForm />
        </section>
      </article>
    </main>
  );
}
