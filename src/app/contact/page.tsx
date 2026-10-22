import type { Metadata } from "next";
import { SHOP_URL, SITE_URL } from "@/lib/data";

export const metadata: Metadata = {
  title: "Contact",
  description: "Message Atelier Bisko directly through Etsy — orders, sizing questions, or anything else.",
  alternates: { canonical: `${SITE_URL}/contact` },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-xl px-5 py-20 sm:px-8 text-center">
      <h1 className="font-display text-3xl sm:text-4xl mb-5">Get in touch</h1>
      <p className="text-[var(--ink-soft)] leading-relaxed mb-8">
        All orders, sizing questions and custom requests go through Etsy Messages — that keeps your order
        details, tracking and our conversation in one place, and keeps you covered by Etsy&apos;s purchase
        protection.
      </p>
      <a
        href={SHOP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block rounded-full bg-[var(--ink)] px-8 py-3.5 text-sm uppercase tracking-wider text-[var(--cream)] hover:bg-[var(--accent)] transition-colors"
      >
        Message the shop on Etsy
      </a>
    </div>
  );
}
