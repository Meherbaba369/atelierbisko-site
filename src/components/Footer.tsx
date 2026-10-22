import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-24 border-t hairline">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 text-sm text-[var(--ink-soft)]">
        <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
          <div className="max-w-sm">
            <p className="font-display text-base text-[var(--ink)] mb-2">Atelier Bisko</p>
            <p>
              Fine-art giclée prints, made to order and shipped worldwide by Gelato.
              Every piece is directed, curated and signed by the artist.
            </p>
          </div>
          <div className="flex gap-10">
            <div>
              <p className="mb-2 uppercase tracking-wider text-xs text-[var(--ink)]">Shop</p>
              <ul className="space-y-1.5">
                <li><Link href="/collection" className="hover:text-[var(--ink)]">Full Collection</Link></li>
                <li><Link href="/about" className="hover:text-[var(--ink)]">About</Link></li>
                <li><Link href="/contact" className="hover:text-[var(--ink)]">Contact</Link></li>
              </ul>
            </div>
            <div>
              <p className="mb-2 uppercase tracking-wider text-xs text-[var(--ink)]">Elsewhere</p>
              <ul className="space-y-1.5">
                <li>
                  <a href="https://www.etsy.com/shop/atelierbisko" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--ink)]">
                    Etsy Shop
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <p className="mt-10 text-xs text-[var(--ink-soft)]/80">
          © {new Date().getFullYear()} Atelier Bisko. All artwork AI-assisted, directed and curated by the artist.
        </p>
      </div>
    </footer>
  );
}
