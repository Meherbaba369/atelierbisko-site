import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllItems, getItemBySlug, priceLabel, SITE_URL } from "@/lib/data";

export function generateStaticParams() {
  return getAllItems().map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = getItemBySlug(slug);
  if (!item) return {};
  const shortTitle = item.title.split(",")[0];
  const desc = item.description.split("\n\n")[0].slice(0, 200);
  const img = item.images[0]?.url_full;
  return {
    title: shortTitle,
    description: desc,
    alternates: { canonical: `${SITE_URL}/art/${item.slug}` },
    openGraph: {
      type: "website",
      title: `${shortTitle} | Atelier Bisko`,
      description: desc,
      url: `${SITE_URL}/art/${item.slug}`,
      images: img ? [{ url: img, width: item.images[0].width, height: item.images[0].height, alt: item.images[0].alt }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: shortTitle,
      description: desc,
      images: img ? [img] : undefined,
    },
  };
}

export default async function ArtworkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = getItemBySlug(slug);
  if (!item) notFound();

  const shortTitle = item.title.split(",")[0];
  const paragraphs = item.description.split("\n\n").filter(Boolean);
  const mainImage = item.images[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    name: shortTitle,
    description: paragraphs[0],
    image: item.images.map((i) => i.url_full),
    url: `${SITE_URL}/art/${item.slug}`,
    artMedium: "Giclée print on matte paper",
    artworkSurface: "Paper",
    artEdition: "Open edition",
    creator: { "@type": "Person", name: "Bisko" },
    offers: item.variants
      .filter((v) => v.price_usd)
      .map((v) => ({
        "@type": "Offer",
        url: item.url,
        priceCurrency: item.currency,
        price: v.price_usd,
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
        seller: { "@type": "Organization", name: "Atelier Bisko" },
      })),
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="mb-6 text-xs text-[var(--ink-soft)]">
        <Link href="/collection" className="hover:text-[var(--ink)]">Collection</Link>
        <span className="mx-1.5">/</span>
        <span>{item.section}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* GALLERY */}
        <div>
          <div className="relative aspect-[2/3] overflow-hidden rounded-sm border hairline bg-[var(--cream-deep)]">
            {mainImage && (
              <Image
                src={mainImage.url_full}
                alt={mainImage.alt || shortTitle}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            )}
          </div>
          {item.images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6">
              {item.images.slice(1).map((img) => (
                <div key={img.rank} className="relative aspect-square overflow-hidden rounded-sm border hairline bg-[var(--cream-deep)]">
                  <Image src={img.url_570} alt={img.alt || shortTitle} fill sizes="120px" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* INFO */}
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-soft)] mb-2">{item.section}</p>
          <h1 className="font-display text-3xl sm:text-4xl leading-tight mb-3">{shortTitle}</h1>
          <p className="text-xl text-[var(--ink)] mb-6">{priceLabel(item)}</p>

          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full sm:w-auto sm:inline-block rounded-full bg-[var(--ink)] px-8 py-3.5 text-center text-sm uppercase tracking-wider text-[var(--cream)] hover:bg-[var(--accent)] transition-colors"
          >
            Buy on Etsy
          </a>
          <p className="mt-2 text-xs text-[var(--ink-soft)]">Pick your size at checkout &middot; opens the Etsy listing</p>

          {item.variants.length > 0 && (
            <div className="mt-8 border-t hairline pt-6">
              <p className="text-xs uppercase tracking-wider text-[var(--ink-soft)] mb-3">Sizes &amp; prices</p>
              <table className="w-full text-sm">
                <tbody>
                  {item.variants.map((v) => (
                    <tr key={v.sku} className="border-b hairline last:border-0">
                      <td className="py-2 pr-4 text-[var(--ink-soft)]">{v.size}</td>
                      <td className="py-2 text-right">{v.price_usd ? `$${v.price_usd.toFixed(0)}` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-8 border-t hairline pt-6 space-y-4 text-[var(--ink-soft)] leading-relaxed">
            {paragraphs.map((p, i) => (
              <p key={i} className={i === 0 ? "text-[var(--ink)]" : ""}>{p}</p>
            ))}
          </div>

          {item.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {item.tags.slice(0, 8).map((t) => (
                <span key={t} className="rounded-full border hairline px-3 py-1 text-[11px] text-[var(--ink-soft)]">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
