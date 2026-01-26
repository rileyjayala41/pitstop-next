// app/reviews/page.tsx

export const metadata = {
  title: "Reviews | Pit Stop Automotive",
  description:
    "Real feedback from customers who chose honest work, clear communication, and the convenience of mobile service.",
};

type Review = {
  name: string;
  date?: string;
  rating?: number; // 1-5
  text: string;
};

const REVIEWS: Review[] = [
  {
    name: "Nathan",
    date: "Dec 14, 2025",
    rating: 5,
    text:
      "Riley was absolutely awesome — showed up on a Sunday with less than 24 hours notice. I had mistakenly gotten the incorrect pads for my truck. He told me, then took it upon himself to source and pick up the correct brake pads. I had to run an errand for work and Riley kept working in my driveway — he was almost finished by the time I got back. 11/10 would recommend. He knows what he’s doing and he’s fair and honest.",
  },
  {
    name: "Julissa",
    date: "Nov 21, 2025",
    rating: 5,
    text:
      "I had a great experience with Riley. He worked really fast and kept great communication the whole time. He showed me what was actually wrong with my car, went to get the parts for me, and even went to different stores to find the best price. Super helpful, honest, and easy to work with. I definitely recommend him.",
  },
  {
    name: "Markus",
    date: "Nov 10, 2025",
    rating: 5,
    text:
      "Riley is awesome — great customer service, very reliable and honest. He genuinely loves what he does and loves helping people. I wish you nothing but success, Riley.",
  },
  {
    name: "Paul",
    date: "Oct 2, 2025",
    rating: 5,
    text:
      "Riley was very professional and gave fair prices. He works quick and knows his stuff. Great job — thank you!",
  },
  {
    name: "John",
    date: "Sep 26, 2025",
    rating: 5,
    text: "Great guy — honest and genuine. Highly recommend!",
  },
  {
    name: "Freddie",
    date: "Sep 10, 2025",
    rating: 5,
    text: "Shows up on time. Very affordable. Will be using him again.",
  },
  {
    name: "Scott",
    date: "Sep 7, 2025",
    rating: 5,
    text:
      "Riley arrived and started on the job quickly, replacing front brakes, rotors, and pads. I’ve done this on most of my cars for years, but I’ve been tight on time. It was great because I learned something new watching him — his awareness of all the systems on newer cars and the steps needed to replace parts. Putting the car into maintenance mode to ensure there are no problems… I would definitely use and recommend him again.",
  },
  {
    name: "Junior",
    date: "Aug 5, 2025",
    rating: 5,
    text:
      "I was passing through ATX when my car died. I reached out pretty late in the day and he was very responsive and set up a time right then and there. He drove to my location, arrived on time, and performed 3 different repairs in under an hour. He definitely saved me from a bad road trip. Pricing was unbeatable and overall he’s a cool guy. 100% recommend if you need a mobile mechanic or repairs in general.",
  },
];

function Stars({ rating = 5 }: { rating?: number }) {
  const full = Math.max(0, Math.min(5, Math.floor(rating)));
  return (
    <div aria-label={`${full} out of 5 stars`} style={{ letterSpacing: 1 }}>
      {"★★★★★".slice(0, full)}
      <span style={{ opacity: 0.25 }}>{"★★★★★".slice(full)}</span>
    </div>
  );
}

export default function ReviewsPage() {
  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px" }}>
      <section style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 38, fontWeight: 900, margin: 0 }}>
          Reviews
        </h1>
        <p style={{ marginTop: 10, fontSize: 18, opacity: 0.85 }}>
          Real feedback from customers who chose honest work, clear communication,
          and the convenience of mobile service.
        </p>
      </section>

      <section style={{ marginTop: 10 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 18,
          }}
        >
          {REVIEWS.map((r, i) => (
            <article
              key={`${r.name}-${i}`}
              style={{
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 16,
                padding: 18,
                background: "rgba(255,255,255,0.04)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <div style={{ fontWeight: 900, fontSize: 16 }}>{r.name}</div>
                <div style={{ opacity: 0.7, fontSize: 12 }}>{r.date ?? ""}</div>
              </div>

              <div style={{ marginBottom: 10, fontSize: 14 }}>
                <Stars rating={r.rating} />
              </div>

              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, opacity: 0.92 }}>
                “{r.text}”
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        style={{
          marginTop: 48,
          paddingTop: 32,
          borderTop: "1px solid rgba(255,255,255,0.14)",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 10 }}>
          Need help with your car?
        </h2>
        <a
          href="/#quote-form"
          className="quote-btn"
          style={{ display: "inline-block" }}
        >
          Get a Free Quote
        </a>
      </section>
    </main>
  );
}
