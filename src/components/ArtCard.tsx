import Link from "next/link";
import Image from "next/image";
import { Item, priceLabel } from "@/lib/data";

export default function ArtCard({ item, priority = false }: { item: Item; priority?: boolean }) {
  return (
    <Link
      href={`/art/${item.slug}`}
      className="group block"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-sm bg-[var(--cream)]">
        <Image
          src={item.card.src800}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          priority={priority}
        />
      </div>
      <div className="mt-2.5 flex items-start justify-between gap-2">
        <h3 className="font-display text-sm leading-snug text-[var(--ink)] line-clamp-2">
          {item.title.split(",")[0]}
        </h3>
      </div>
      <p className="text-xs text-[var(--ink-soft)]">
        {priceLabel(item) || (item.url ? "" : "Coming soon")}
      </p>
    </Link>
  );
}
