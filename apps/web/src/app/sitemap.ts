import type { MetadataRoute } from "next";
import { sanityFetch } from "@/sanity/fetch";
import { SITEMAP_QUERY } from "@/sanity/queries";
import { useSanity } from "@/sanity/env";
import { areaDocs, caseDocs } from "@/content/seed";
import { absoluteUrl } from "@/lib/site";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!useSanity) {
    return [
      { url: absoluteUrl(), changeFrequency: "monthly", priority: 1 },
      ...areaDocs.map((a) => ({
        url: absoluteUrl(`/areas/${a.slug}`),
        changeFrequency: "monthly" as const,
        priority: 0.8,
      })),
      ...caseDocs.map((c) => ({
        url: absoluteUrl(`/casos/${c.slug}`),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
    ];
  }

  const data = (await sanityFetch<any>({
    query: SITEMAP_QUERY,
    tags: ["homePage", "area"],
  })) as any;

  const entries: MetadataRoute.Sitemap = [];

  if (!data?.home?.noIndex) {
    entries.push({
      url: absoluteUrl(),
      lastModified: data?.home?._updatedAt ? new Date(data.home._updatedAt) : new Date(),
      changeFrequency: "monthly",
      priority: 1,
    });
  }

  for (const a of data?.areas ?? []) {
    if (a?.noIndex) continue;
    entries.push({
      url: absoluteUrl(`/areas/${a.slug}`),
      lastModified: a?._updatedAt ? new Date(a._updatedAt) : new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  for (const c of caseDocs) {
    entries.push({
      url: absoluteUrl(`/casos/${c.slug}`),
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  return entries;
}
