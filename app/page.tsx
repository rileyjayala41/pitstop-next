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
          <div className="cta">
            <a className="quote-btn" href="#quote-form">
              Get a Free Quote
            </a>
          </div>
        </section>

        {/* SERVICES */}
        <section id="services">
          <h2>Services & Pricing</h2>
          <ul className="services-list ul">
            <li>
              <strong>Oil Change:</strong> from $100
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
              <strong>Tune-Ups & Suspension:</strong> quote
            </li>
          </ul>
          <p className="service-areas">
            Serving <strong>Austin</strong>, Round Rock, Pflugerville, Cedar Park &amp; Georgetown
          </p>
        </section>

        {/* QUOTE FORM */}
        <section id="quote-form">
          <h2>Get Your Quote</h2>
          <LeadForm />
        </section>

        {/* TESTIMONIAL */}
        <section id="testimonials">
          <blockquote className="testimonial">
            <p>
              &quot;Came to my driveway and knocked it out. Saved me time and stress. Highly
              recommend!&quot;
            </p>
          </blockquote>
        </section>
      </article>
    </main>
  );
}
