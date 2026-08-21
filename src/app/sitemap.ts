import type { MetadataRoute } from "next";
import { sanityFetch } from "@/sanity/fetch";
import { SITEMAP_QUERY, SETTINGS_QUERY } from "@/sanity/queries";
import { useSanity } from "@/sanity/env";
import { settingsSeed, areaDocs, caseDocs } from "@/content/seed";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!useSanity) {
    const base = (settingsSeed.siteUrl as string).replace(/\/$/, "");
    return [
      { url: `${base}/`, changeFrequency: "monthly", priority: 1 },
      ...areaDocs.map((a) => ({
        url: `${base}/areas/${a.slug}`,
        changeFrequency: "monthly" as const,
        priority: 0.8,
      })),
      ...caseDocs.map((c) => ({
        url: `${base}/casos/${c.slug}`,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
    ];
  }

  const settings = (await sanityFetch<any>({
    query: SETTINGS_QUERY,
    tags: ["siteSettings"],
  })) as any;
  const base = (settings?.siteUrl ?? "https://valmesolutions.com").replace(/\/$/, "");

  const data = (await sanityFetch<any>({
    query: SITEMAP_QUERY,
    tags: ["homePage", "area"],
  })) as any;

  const entries: MetadataRoute.Sitemap = [];

  if (!data?.home?.noIndex) {
    entries.push({
      url: `${base}/`,
      lastModified: data?.home?._updatedAt ? new Date(data.home._updatedAt) : new Date(),
      changeFrequency: "monthly",
      priority: 1,
    });
  }

  for (const a of data?.areas ?? []) {
    if (a?.noIndex) continue;
    entries.push({
      url: `${base}/areas/${a.slug}`,
      lastModified: a?._updatedAt ? new Date(a._updatedAt) : new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  return entries;
}
