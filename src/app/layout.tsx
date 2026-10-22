import type { Metadata } from "next";
import { garamond } from "./fonts";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SITE_URL } from "@/lib/data";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Atelier Bisko — Bold Art Prints, Made to Order",
    template: "%s | Atelier Bisko",
  },
  description:
    "Vivid, strange, beautiful fine-art giclée prints for your wall — directed, curated and signed by the artist, printed to order and shipped worldwide by Gelato.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Atelier Bisko",
    url: SITE_URL,
    images: ["/logo.png"],
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={garamond.variable}>
      <body className="min-h-screen flex flex-col antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
