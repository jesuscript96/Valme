import type { MetadataRoute } from "next";
import { sanityFetch } from "@/sanity/fetch";
import { SITEMAP_QUERY, SETTINGS_QUERY } from "@/sanity/queries";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
