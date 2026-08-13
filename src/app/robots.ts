import type { MetadataRoute } from "next";
import { getSettings } from "@/sanity/data";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const s = (await getSettings()) as any;
  const base = (s?.siteUrl ?? "https://valmesolutions.com").replace(/\/$/, "");
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
