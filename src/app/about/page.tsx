import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About",
  description:
    "Atelier Bisko makes vivid, surreal fine-art prints with AI-assisted tools, honestly disclosed — directed, curated and signed by the artist. Printed to order by Gelato.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-14 sm:px-8">
      <Image src="/logo.png" alt="Atelier Bisko" width={72} height={72} className="rounded-full mb-8" />
      <h1 className="font-display text-3xl sm:text-4xl mb-6">About Atelier Bisko</h1>
      <div className="space-y-5 text-[var(--ink-soft)] leading-relaxed">
        <p className="text-[var(--ink)] text-lg">
          I&apos;m Bisko. I make the kind of pictures I&apos;d want to live with — skies that are a little too blue,
          clouds built like architecture, flowers that refuse to behave.
        </p>
        <p>
          Every piece starts as an idea and a stubborn mood. I write and direct each image, make it with
          AI tools — often many tries — and keep only the few I&apos;d hang in my own hallway, then finish
          them for print. The images are AI-assisted; I&apos;m honest about that. What you&apos;re getting is my
          taste and my eye, start to finish — I pick, refine and sign only the ones that are actually good.
        </p>
        <p>
          Each one is made to order by <strong className="text-[var(--ink)]">Gelato</strong>, our production
          partner, and printed close to wherever you are — a fine art giclée print using a special 12-colour
          process that gives deeper, more accurate colour than ordinary printing — on luxurious matte,
          eco-friendly paper, with a clean white gallery margin, plus my actual signature, not a font. Sizes
          run from 30×45 cm (12×18 in) up to a wall-filling 60×90 cm (24×36 in), all in the same 2:3 shape so
          the artwork is never cropped.
        </p>
        <p>
          No warehouse, no leftover stock — just the print you ordered, made for you.
        </p>
        <p>
          <strong className="text-[var(--ink)]">If something arrives damaged or misprinted</strong>, send a
          photo within 14 days and I&apos;ll send a free replacement or a full refund — no need to ship
          anything back. Backed by Gelato&apos;s print-quality guarantee.
        </p>
        <p className="text-[var(--ink)] font-display text-lg">— Bisko</p>
      </div>
    </div>
  );
}
