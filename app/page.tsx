import LeadForm from "@/components/LeadForm";

export default function HomePage() {
  return (
    <main className="container">
      <article>
        {/* INTRO / HERO */}
        <section id="intro">
          <h1 className="hero-title">
 	   WE COME TO YOU
	  </h1>
          <h1 className="hero-title">
	   WHEREVER YOU ARE
	  </h1>

          <p style={{ fontSize: 18, opacity: 0.9, maxWidth: 560 }}>
            Skip the shop, We'll come straight to your driveway!
          </p>

          <div className="cta" style={{ marginTop: 18 }}>
            <a className="quote-btn" href="#quote-form">
              Get a Free Quote
            </a>

            <p style={{ marginTop: 8, marginBottom: 0, fontSize: 13, opacity: 0.78 }}>
            Hard-working • Knowledgeable • Professional
            </p>
          </div>
        </section>

        {/* SERVICES */}
        <section id="services">
          <h2>Services & Pricing</h2>
          <ul className="services-list ul">
            <li>
              <strong>Synthetic Oil Change:</strong> starting at $100
            </li>
            <li>
              <strong>Brakes:</strong> starting at $100 + parts
            </li>
            <li>
              <strong>Diagnostics:</strong> starting at $50
            </li>
            <li>
              <strong>Tune-Ups:</strong> starting at $125
            </li>
	    <li>
              <strong>Suspension:</strong> starting at $150
            </li>
            <li>
              <strong>Engine Replacement:</strong> starting at $1850
            </li>
          </ul>

        </section>

        {/* QUOTE FORM */}
        <section id="quote-form">
          <h2>Schedule Your Repair</h2>

          {/* What to expect */}
          <div style={{ marginTop: 10, marginBottom: 16, maxWidth: 640 }}>
            <p style={{ margin: 0, fontSize: 18, opacity: 0.9 }}>
              <strong> After you submit the form we will reach out and schedule a time to fix your car! </strong>
	    </p>

            <p style={{ marginTop: 10, marginBottom: 0, fontSize: 13, opacity: 0.75 }}>
              No hassle • Honest pricing • Pit-stop Speed
            </p>
          </div>

          <LeadForm />
	  <p style={{ marginTop: 10, marginBottom: 0, fontSize: 14, opacity: 0.85 }}>
              <strong>Customer said:</strong>{" "}
              <span style={{ opacity: 0.9 }}>
                “He came to my driveway, fixed it on the spot, and saved me a trip to the shop.”
              </span>
            </p>
        </section>
      </article>
    </main>
  );
}
