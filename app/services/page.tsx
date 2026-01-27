import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "Mobile Mechanic Services Austin TX | Oil Change, Brakes, Engine Replacement | Pit Stop Automotive",
  description:
    "Full list of mobile auto services in Austin TX: oil changes ($100), brake service ($100), vehicle diagnostics ($50), tune-ups ($125), engine replacements & more. We come to you! Get a free quote.",
};

export default function ServicesPage() {
  return (
    <main className="container">
      {/* Schema.org Service List */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Pit Stop Automotive Mobile Services",
            description:
              "Complete list of mobile mechanic and auto detailing services in Austin, TX",
            numberOfItems: 6,
            itemListElement: [
              {
                "@type": "Service",
                position: 1,
                name: "Mobile Oil Change",
                description:
                  "Conventional and synthetic oil changes performed at your location in Austin, TX.",
              },
              {
                "@type": "Service",
                position: 2,
                name: "Mobile Brake Service",
                description:
                  "Brake pad replacement and brake system service at your home or office.",
              },
              {
                "@type": "Service",
                position: 3,
                name: "Diagnostics",
                description:
                  "Check engine light diagnosis and computer scanning.",
              },
              {
                "@type": "Service",
                position: 4,
                name: "Tune-Ups",
		description:
                  "Spark plug and air filter replacement.",
              },
              {
                "@type": "Service",
                position: 5,
                name: "Suspension Repair",
		description:
                  "Suspension type repair and replacement.",
              },
              {
                "@type": "Service",
                position: 6,
                name: "Engine Replacement",
		description:
                  "Full engine removal and replacement.",
              },
            ],
          }),
        }}
      />

      <article>
        <section id="services-intro">
          <h2>Mobile Auto Services in Austin, TX</h2>
          <p>
            At <strong>Pit Stop Automotive</strong>, we bring professional{" "}
            <strong>mechanic services</strong> directly to your
            location. No need to drive to a shop or wait in line — our{" "}
            <strong>mobile mechanics</strong> come to you anywhere in the Austin
            area.
          </p>
        </section>
	<section>
	<span style={{ fontSize: 14, opacity: 0.8 }}>
                (Starting prices reflect common labor—final price depends on parts and vehicle)
        </span>
	</section>
        <section id="oil-change" className="service-detail">
          <h2>Synthetic Oil Change — Starting at $100</h2>
          <ul className="ul">
            <li>Drain and replace engine oil</li>
            <li>New oil filter installation</li>
            <li>Fluid level check</li>
            <li>Visual inspection</li>
          </ul>
        </section>

        <section id="brake-service" className="service-detail">
          <h2>Brake Service — Starting at $100</h2>
          <ul className="ul">
            <li>Brake pad replacement</li>
            <li>Brake rotor inspection</li>
            <li>Brake fluid check</li>
            <li>Complete brake system inspection</li>
          </ul>
        </section>

        <section id="diagnostics" className="service-detail">
          <h2>Vehicle Diagnostics — Starting at $50</h2>
          <span style={{ opacity: 0.8 }}>
                (Fee waived on <strong>certian</strong> repairs <strong>when booked</strong>)
            </span>
	  <ul className="ul">
            <li>OBD-II computer scanning</li>
            <li>Fault code reading</li>
            <li>Full vehicle analysis</li>
            <li>Digital diagnostic report</li>
          </ul>
        </section>

        <section id="tune-up" className="service-detail">
          <h2>Tune-Up — Starting at $125</h2>
          <ul className="ul">
            <li>Spark plug replacement</li>
            <li>Air filter replacement</li>
            <li>Fuel efficiency improvement</li>
            <li>Performance optimization</li>
          </ul>
        </section>

        <section id="suspension" className="service-detail">
          <h2>Suspension Repair — Starting at $150</h2>
          <ul className="ul">
            <li>Shock absorber replacement</li>
            <li>Strut replacement</li>
            <li>Suspension system inspection</li>
            <li>Ride quality improvement</li>
          </ul>
        </section>

        <section id="engine-replacement" className="service-detail">
 	  <h2>Engine Replacement — Quote Required</h2>
  	  <ul className="ul">
   	    <li>Engine removal</li>
    	    <li>Installation of replacement engine</li>
    	    <li>System connections and fluid refill</li>
    	    <li>Startup and testing</li>
  	  </ul>
	</section>

        <section id="service-areas">
          <h2>We Service Austin And Surrounding Areas</h2>
          <span style={{ opacity: 0.8 }}>
                ($20 Travel fee applied)
	  </span>
	  <div>
	  </div>
	  <span style={{ opacity: 0.8 }}>
                (Fee waived on <strong>certian</strong> repairs <strong>when booked</strong>)
          </span>
	</section>

        <section id="cta">
          <h2>Ready to Book Your Service?</h2>
          <div className="cta">
            <Link className="quote-btn" href="/#quote-form">
              Get Your Free Quote
            </Link>
          </div>
        </section>
      </article>
    </main>
  );
}
