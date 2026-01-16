import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Mobile Mechanic & Auto Detailing Austin TX | Pit Stop Automotive",
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
        {/* Font (same as your HTML site) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;800&display=swap"
          rel="stylesheet"
        />

        {/* Your original CSS file */}
        <link rel="stylesheet" href="/styles/style.css" />

        <meta name="theme-color" content="#000000" />
      </head>
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
