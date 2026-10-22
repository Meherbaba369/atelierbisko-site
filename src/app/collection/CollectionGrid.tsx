"use client";
import { useMemo, useState, useEffect } from "react";
import ArtCard from "@/components/ArtCard";
import { Item } from "@/lib/data";

export default function CollectionGrid({ items, sections }: { items: Item[]; sections: string[] }) {
  const [active, setActive] = useState<string>("All");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("section");
    if (s && sections.includes(s)) setActive(s);
  }, [sections]);

  const filtered = useMemo(
    () => (active === "All" ? items : items.filter((i) => i.section === active)),
    [active, items]
  );

  const tabs = ["All", ...sections];

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={`rounded-full border hairline px-4 py-1.5 text-xs uppercase tracking-wider transition-colors ${
              active === t ? "bg-[var(--ink)] text-[var(--cream)] border-[var(--ink)]" : "hover:bg-[var(--cream-deep)]"
            }`}
          >
            {t}
            {t !== "All" && (
              <span className="ml-1 opacity-60">({items.filter((i) => i.section === t).length})</span>
            )}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((item, i) => (
          <ArtCard key={item.listing_id} item={item} priority={i < 4} />
        ))}
      </div>
    </div>
  );
}
