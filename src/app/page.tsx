import Link from "next/link";
import Image from "next/image";
import ArtCard from "@/components/ArtCard";
import { getFeatured, getSets, getSnapshot, SHOP_URL } from "@/lib/data";

export default function Home() {
  const featured = getFeatured(8);
  const sets = getSets();
  const hero = featured[0];
  const snapshot = getSnapshot();

  return (
    <div>
      {/* HERO */}
      <section className="mx-auto max-w-6xl px-5 pt-10 pb-16 sm:px-8 sm:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.2em] text-[var(--ink-soft)]">
              Fine-art giclée prints &middot; made to order
            </p>
            <h1 className="font-display text-4xl leading-[1.1] sm:text-5xl lg:text-[3.4rem]">
              Vivid, strange,
              <br /> beautiful rooms
              <br /> for your wall.
            </h1>
            <p className="mt-6 max-w-md text-[var(--ink-soft)] leading-relaxed">
              {snapshot.shop.announcement}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/collection"
                className="rounded-full bg-[var(--ink)] px-6 py-3 text-sm uppercase tracking-wider text-[var(--cream)] hover:bg-[var(--accent)] transition-colors"
              >
                View the Collection
              </Link>
              <a
                href={SHOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border hairline px-6 py-3 text-sm uppercase tracking-wider hover:bg-[var(--cream-deep)] transition-colors"
              >
                Shop on Etsy
              </a>
            </div>
          </div>
          {hero && (
            <Link href={`/art/${hero.slug}`} className="group relative block aspect-[2/3] max-w-sm justify-self-center overflow-hidden rounded-sm border hairline shadow-[0_30px_60px_-20px_rgba(27,25,21,0.25)]">
              <Image
                src={hero.images[0].url_full}
                alt={hero.images[0].alt || hero.title}
                fill
                sizes="(max-width: 1024px) 80vw, 420px"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                priority
              />
            </Link>
          )}
        </div>
      </section>

      {/* THE SETS */}
      {sets.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 border-t hairline">
          <div className="mb-7 flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-soft)] mb-2">Save 15%</p>
              <h2 className="font-display text-2xl sm:text-3xl">The Sets</h2>
            </div>
            <Link href="/collection?section=Sets" className="text-sm text-[var(--ink-soft)] hover:text-[var(--ink)] whitespace-nowrap">
              See all sets &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
            {sets.map((item, i) => (
              <ArtCard key={item.listing_id} item={item} priority={i === 0} />
            ))}
          </div>
        </section>
      )}

      {/* FEATURED */}
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 border-t hairline">
        <div className="mb-7 flex items-end justify-between">
          <h2 className="font-display text-2xl sm:text-3xl">A Few Favourites</h2>
          <Link href="/collection" className="text-sm text-[var(--ink-soft)] hover:text-[var(--ink)] whitespace-nowrap">
            View all 87 &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((item) => (
            <ArtCard key={item.listing_id} item={item} />
          ))}
        </div>
      </section>

      {/* STRIP */}
      <section className="border-t hairline bg-[var(--cream-deep)]">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 grid gap-8 sm:grid-cols-3 text-center text-sm">
          <div>
            <p className="font-display text-lg mb-1">Fine art giclée</p>
            <p className="text-[var(--ink-soft)]">12-colour printing on luxurious matte, eco-friendly paper.</p>
          </div>
          <div>
            <p className="font-display text-lg mb-1">Made to order</p>
            <p className="text-[var(--ink-soft)]">Printed near you and shipped worldwide by Gelato. No warehouse, no leftover stock.</p>
          </div>
          <div>
            <p className="font-display text-lg mb-1">Arrives perfect</p>
            <p className="text-[var(--ink-soft)]">Damaged or misprinted? Free replacement or full refund — no return shipping needed.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
