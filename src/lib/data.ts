import raw from "../../data/listings.json";

export type Variant = {
  sku: string;
  size: string | null;
  price_usd: number | null;
  enabled: boolean;
};

export type EtsyImage = {
  rank: number;
  alt: string;
  url_570: string;
  url_full: string;
  width: number;
  height: number;
};

export type Item = {
  listing_id: number;
  slug: string;
  title: string;
  description: string;
  url: string;
  tags: string[];
  section: string;
  price_min: number | null;
  price_max: number | null;
  currency: string;
  variants: Variant[];
  images: EtsyImage[];
  num_favorers: number;
  is_set: boolean;
};

export type Snapshot = {
  generated_at: string;
  shop: {
    shop_id: number;
    name: string;
    title: string;
    url: string;
    announcement: string;
    icon_url: string | null;
    policy_shipping: string;
    policy_refunds: string;
  };
  sections: string[];
  items: Item[];
};

const data = raw as Snapshot;

export const SITE_URL = "https://atelierbisko.com";
export const SHOP_URL = "https://www.etsy.com/shop/atelierbisko";

export function getSnapshot(): Snapshot {
  return data;
}

export function getAllItems(): Item[] {
  return data.items;
}

export function getItemBySlug(slug: string): Item | undefined {
  return data.items.find((i) => i.slug === slug);
}

export function getItemsBySection(section: string): Item[] {
  return data.items.filter((i) => i.section === section);
}

export function sectionsInOrder(): string[] {
  const order = ["Singles", "Sets", "Framed", "Flowers"];
  return order.filter((s) => data.sections.includes(s));
}

export function firstImage(item: Item): EtsyImage | undefined {
  return item.images[0];
}

export function priceLabel(item: Item): string {
  if (item.price_min == null) return "";
  if (item.price_min === item.price_max) return `$${item.price_min.toFixed(0)}`;
  return `$${item.price_min!.toFixed(0)} – $${item.price_max!.toFixed(0)}`;
}

// Curated featured slugs for the homepage — a visual spread across sections,
// stable across rebuilds (not favorites-ranked, since the shop is brand new).
export function getFeatured(count = 8): Item[] {
  const singles = getItemsBySection("Singles");
  const flowers = getItemsBySection("Flowers");
  const framed = getItemsBySection("Framed");
  const pool = [...singles, ...flowers, ...framed];
  // simple deterministic spread: every Nth item
  const step = Math.max(1, Math.floor(pool.length / count));
  const picked: Item[] = [];
  for (let i = 0; i < pool.length && picked.length < count; i += step) {
    picked.push(pool[i]);
  }
  return picked;
}

export function getSets(): Item[] {
  return getItemsBySection("Sets");
}
