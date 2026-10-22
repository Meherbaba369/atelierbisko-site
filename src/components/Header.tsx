import Link from "next/link";
import Image from "next/image";

const NAV = [
  { href: "/collection", label: "Collection" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b hairline bg-[var(--cream)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
        <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="Atelier Bisko — home">
          <Image src="/logo.png" alt="Atelier Bisko" width={40} height={40} priority className="rounded-full" />
          <span className="font-display text-lg tracking-wide">Atelier Bisko</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm sm:gap-7">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors">
              {n.label}
            </Link>
          ))}
          <a
            href="https://www.etsy.com/shop/atelierbisko"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-block rounded-full border hairline px-4 py-1.5 text-xs uppercase tracking-wider text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--cream)] transition-colors"
          >
            Shop on Etsy
          </a>
        </nav>
      </div>
    </header>
  );
}
