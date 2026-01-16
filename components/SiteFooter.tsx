import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer>
      <p>
        © {new Date().getFullYear()} Pit Stop Automotive — Mobile Mechanic & Auto Detailing
        Austin, TX — All rights reserved.
      </p>
      <nav aria-label="Footer navigation">
        <Link href="/">Home</Link> | <Link href="/services">Services</Link> |{" "}
        <Link href="/about">About Us</Link>
      </nav>
    </footer>
  );
}
