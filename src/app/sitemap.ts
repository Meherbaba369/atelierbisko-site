import type { MetadataRoute } from "next";
import { getAllItems, SITE_URL } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const items = getAllItems();
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/collection`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];
  const artPages: MetadataRoute.Sitemap = items.map((item) => ({
    url: `${SITE_URL}/art/${item.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));
  return [...staticPages, ...artPages];
}
