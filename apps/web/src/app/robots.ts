import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // El área interna y su login nunca se indexan.
    rules: { userAgent: "*", allow: "/", disallow: ["/app", "/login"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
