import type { Metadata } from "next";
import { getAllItems, sectionsInOrder } from "@/lib/data";
import CollectionGrid from "./CollectionGrid";

export const metadata: Metadata = {
  title: "The Collection",
  description:
    "All 87 fine-art giclée prints from Atelier Bisko — Singles, Sets, Framed and Flowers. Made to order, shipped worldwide by Gelato.",
};

export default function CollectionPage() {
  const items = getAllItems();
  const sections = sectionsInOrder();

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <div className="mb-10 max-w-2xl">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-soft)] mb-2">{items.length} prints</p>
        <h1 className="font-display text-3xl sm:text-4xl mb-3">The Collection</h1>
        <p className="text-[var(--ink-soft)] leading-relaxed">
          Every piece is made to order and printed close to you by Gelato. Pick a size at checkout on Etsy —
          each artwork page has the full size and price list.
        </p>
      </div>
      <CollectionGrid items={items} sections={sections} />
    </div>
  );
}
