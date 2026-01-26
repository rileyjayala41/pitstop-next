import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Pit Stop Automotive | Mobile Mechanic Austin TX",
  description:
    "Learn about Pit Stop Automotive, Austin's trusted mobile mechanic and auto detailing service. We bring professional car care to your doorstep in Austin, Round Rock, Pflugerville, Cedar Park & Georgetown.",
};

export default function AboutPage() {
  return (
    <main className="container">
      {/* Schema.org - AboutPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "AboutPage",
            name: "About Pit Stop Automotive",
            description:
              "Learn about Pit Stop Automotive, Austin's trusted mobile mechanic and auto detailing service.",
            mainEntity: {
              "@type": "AutoRepair",
              name: "Pit Stop Automotive",
              description:
                "Mobile-first auto service brand in Austin, TX providing convenient mechanic and detailing services at your location.",
              foundingLocation: {
                "@type": "Place",
                name: "Austin, Texas",
              },
              areaServed: [
                "Austin, TX",
                "Round Rock, TX",
                "Pflugerville, TX",
                "Cedar Park, TX",
                "Georgetown, TX",
              ],
              slogan: "Mobile Auto Care — We Come to You",
            },
          }),
        }}
      />

      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "/",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "About Us",
                item: "/about",
              },
            ],
          }),
        }}
      />

      <article>
        <section id="about">
          <h2>Pit Stop Automotive Is Austin&apos;s Mobile Mechanic</h2>
          <p>
            <strong>Pit Stop Automotive</strong> is a{" "}
            <strong>mobile auto service</strong> company proudly born and
            based in <strong>Austin, Texas</strong>. We started with a simple
            goal: to make vehicle care simple, fast, and transparent for busy
            people.
          </p>

          <p>
            We understand that your time is valuable. That&apos;s why we bring
            our <strong>professional mechanic services</strong>{" "}
            directly to your driveway. No more scheduling around shop hours, no more sitting in
            waiting rooms, and no more surprise charges.
          </p>
        </section>

        <section id="our-mission">
          <h2>Our Mission</h2>
          <p>
            To provide{" "}
            <strong>convenient, honest, and affordable mobile auto care</strong>{" "}
            to the Austin community. Whether you need a quick oil change, brake
            service, diagnostics, or a full engine replacement — we&apos;ve got
            your back, wherever you are.
          </p>
        </section>

        <section id="what-sets-us-apart">
          <h2>What Sets Us Apart</h2>
          <ul className="ul">
            <li>
              <strong>Mobile Convenience:</strong> We come to you, wherever you are (in Austin, TX)
            </li>
            <li>
              <strong>Transparent Pricing:</strong> No hidden fees. You know
              exactly what you&apos;re paying for before we start
            </li>
            <li>
              <strong>Quality Workmanship:</strong> Our experienced technicians
              take pride in every job, big or small
            </li>
            <li>
              <strong>Customer-First Approach:</strong> Your satisfaction and
              vehicle safety are our top priorities
            </li>
            <li>
              <strong>Local Business:</strong> We&apos;re part of the Austin
              community and treat every customer like a neighbor
            </li>
          </ul>
        </section>

        <section id="service-coverage">
          <h2>Areas We Serve</h2>
          <ul className="ul">
            <li>Austin (all neighborhoods)</li>
            <li>Round Rock</li>
            <li>Pflugerville</li>
            <li>Cedar Park</li>
            <li>Georgetown</li>
            <li>Surrounding areas within 20 miles</li>
          </ul>
        </section>

        <section id="cta">
          <h2>Ready to Experience Mobile Auto Care?</h2>
          <p>
            Skip the hassle of traditional shops. Let us
            bring expert service to your doorstep.
          </p>
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
