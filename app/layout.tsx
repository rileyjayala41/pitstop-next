import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";


export const metadata: Metadata = {
  title: "Mobile Mechanic - Austin TX | Pit Stop Automotive",
  description:
    "Austin's trusted mobile mechanic & auto detailing service. We come to you! Serving Austin, Round Rock, Pflugerville, Cedar Park & Georgetown.",
  icons: {
    icon: [{ url: "/favicon.png" }, { url: "/favicon-32x32.png", sizes: "32x32" }],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
		  <!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-18036747428"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'AW-18036747428');
</script>
        {/* Font (same as your HTML site) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;800&display=swap"
          rel="stylesheet"
        />

        {/* Your original CSS file */}
        <link rel="stylesheet" href="/styles/style.css?v=1" />



        <meta name="theme-color" content="#000000" />
      </head>
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
	<Analytics />
      </body>
    </html>
  );
}
