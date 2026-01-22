import Link from "next/link";

export default function SiteHeader() {
  return (
    <>
      <header>
        <div className="header-text">
          <img
            src="/logo.png"
            alt="Pit Stop Automotive - Mobile Mechanic Austin TX"
            className="logo"
          />
          <h1>Pit Stop Automotive</h1>
          <p>Mobile Mechanic & Auto Detailing — Austin, TX</p>
        </div>
      </header>

      <nav aria-label="Main navigation">
        <Link href="/">Home</Link>
	<Link href="/reviews">Media</Link>
        <Link href="/services">Services</Link>
        <Link href="/about">About</Link>
      </nav>
    </>
  );
}
