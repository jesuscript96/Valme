import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { sanityFetch } from "@/sanity/fetch";
import { HOME_QUERY, HOME_SEO_QUERY } from "@/sanity/queries";
import { imageUrl } from "@/sanity/image";
import { HomeView } from "./HomeView";

export async function generateMetadata(): Promise<Metadata> {
  const data = (await sanityFetch<any>({
    query: HOME_SEO_QUERY,
    tags: ["homePage", "siteSettings"],
  })) as any;
  const seo = data?.seo ?? {};
  const fallback = data?.settings?.defaultSeo ?? {};
  const title = seo.title ?? fallback.title;
  const description = seo.description ?? fallback.description;
  const og = imageUrl(seo.ogImage ?? fallback.ogImage);

  const meta: Metadata = { title, description };
  if (og) meta.openGraph = { images: [og] };
  if (seo.noIndex) meta.robots = { index: false, follow: false };
  return meta;
}

export default async function Page() {
  const data = (await sanityFetch<any>({
    query: HOME_QUERY,
    tags: ["homePage", "siteSettings", "area"],
  })) as any;

  if (!data?.home) notFound();

  return <HomeView home={data.home} settings={data.settings} areas={data.areas ?? []} />;
}
