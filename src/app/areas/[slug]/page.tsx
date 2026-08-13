import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { sanityFetch } from "@/sanity/fetch";
import { AREA_QUERY, AREA_SLUGS_QUERY, AREA_SEO_QUERY } from "@/sanity/queries";
import { imageUrl } from "@/sanity/image";
import { AreaView } from "./AreaView";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function generateStaticParams() {
  const slugs = (await sanityFetch<{ slug: string }[]>({
    query: AREA_SLUGS_QUERY,
    tags: ["area"],
  })) as { slug: string }[];
  return (slugs ?? []).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = (await sanityFetch<any>({
    query: AREA_SEO_QUERY,
    params: { slug },
    tags: ["area", "siteSettings"],
  })) as any;
  const area = data?.area;
  if (!area) return {};
  const fallback = data?.settings?.defaultSeo ?? {};
  const seo = area.seo ?? {};
  const siteUrl = data?.settings?.siteUrl ?? "https://valmesolutions.com";
  const title = seo.title ?? `${area.name} | Valme Solutions`;
  const description = seo.description ?? area.tagline ?? fallback.description;
  const og = imageUrl(seo.ogImage ?? fallback.ogImage);

  const meta: Metadata = {
    title,
    description,
    alternates: { canonical: `${siteUrl}/areas/${slug}` },
  };
  if (og) meta.openGraph = { images: [og], title, description };
  if (seo.noIndex) meta.robots = { index: false, follow: false };
  return meta;
}

export default async function AreaRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = (await sanityFetch<any>({
    query: AREA_QUERY,
    params: { slug },
    tags: ["area", "siteSettings"],
  })) as any;

  if (!data?.area) notFound();

  return <AreaView area={data.area} settings={data.settings} others={data.others ?? []} />;
}
