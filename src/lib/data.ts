import raw from "../../data/listings.json";

export type Variant = {
  sku: string;
  size: string | null;
  price_usd: number | null;
  enabled: boolean;
};

export type GalleryImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  kind: "card" | "remote";
};

export type CardImage = {
  src800: string;
  src1600: string;
  w800: number;
  h800: number;
  w1600: number;
  h1600: number;
};

export type Item = {
  id: string;
  kind: "artwork" | "set";
  slug: string;
  title: string;
  description: string;
  url: string | null;
  buy_label: string;
  tags: string[];
  section: string;
  price_min: number | null;
  price_max: number | null;
  currency: string;
  variants: Variant[];
  card: CardImage;
  gallery: GalleryImage[];
  num_favorers: number;
  members?: string[];
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
  const order = ["Prints", "Sets"];
  return order.filter((s) => data.sections.includes(s));
}

export function priceLabel(item: Item): string {
  if (item.price_min == null) return "";
  if (item.price_min === item.price_max) return `$${item.price_min.toFixed(0)}`;
  return `$${item.price_min!.toFixed(0)} – $${item.price_max!.toFixed(0)}`;
}

// Curated featured slugs for the homepage — a visual spread across the catalogue, stable across
// rebuilds (not favorites-ranked, since the shop is brand new).
export function getFeatured(count = 8): Item[] {
  const pool = getItemsBySection("Prints");
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
