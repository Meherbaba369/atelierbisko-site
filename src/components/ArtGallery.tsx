"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { GalleryImage } from "@/lib/data";

export default function ArtGallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);

  const available = images.filter((image) => !unavailable.includes(image.src));
  if (available.length === 0) return null;
  const active = available.find((image) => image === images[index]) ?? available[0];
  const activeIndex = available.indexOf(active);

  const removeUnavailable = (image: GalleryImage) => {
    if (image.kind === "remote") {
      setUnavailable((previous) => previous.includes(image.src) ? previous : [...previous, image.src]);
    }
  };

  const go = (next: number) => {
    const n = ((next % available.length) + available.length) % available.length;
    setIndex(images.indexOf(available[n]));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };
  const onTouchEnd = () => {
    const SWIPE_THRESHOLD = 40;
    if (touchDeltaX.current > SWIPE_THRESHOLD) go(activeIndex - 1);
    else if (touchDeltaX.current < -SWIPE_THRESHOLD) go(activeIndex + 1);
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  return (
    <div>
      <div
        className="relative aspect-[2/3] overflow-hidden rounded-sm border hairline bg-[var(--cream)] select-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <Image
          key={active.src}
          src={active.src}
          alt={active.alt || title}
          unoptimized
          onError={() => removeUnavailable(active)}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-contain"
          priority
        />

        {available.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => go(activeIndex - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--cream)]/85 text-[var(--ink)] shadow-sm hover:bg-[var(--cream)] transition-colors"
            >
              <span aria-hidden>&#8249;</span>
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => go(activeIndex + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--cream)]/85 text-[var(--ink)] shadow-sm hover:bg-[var(--cream)] transition-colors"
            >
              <span aria-hidden>&#8250;</span>
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-[var(--ink)]/70 px-2 py-0.5 text-[10px] text-[var(--cream)] tracking-wide">
              {activeIndex + 1} / {available.length}
            </div>
          </>
        )}
      </div>

      {available.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6">
          {available.map((img, i) => (
            <button
              key={img.src}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === activeIndex}
              className={`relative aspect-square overflow-hidden rounded-sm border bg-[var(--cream-deep)] transition-opacity ${
                i === activeIndex ? "border-[var(--ink)] opacity-100" : "border-transparent hairline opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={img.thumbnail_src || img.src}
                alt={img.alt || title}
                unoptimized
                onError={() => removeUnavailable(img)}
                fill
                sizes="120px"
                className={img.kind === "card" ? "object-contain" : "object-cover"}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
