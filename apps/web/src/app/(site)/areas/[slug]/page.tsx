import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { sanityFetch } from "@/sanity/fetch";
import { AREA_QUERY, AREA_SLUGS_QUERY, AREA_SEO_QUERY } from "@/sanity/queries";
import { imageUrl } from "@/sanity/image";
import { useSanity } from "@/sanity/env";
import { getAreaDoc, otherAreas, areaDocs, settingsSeed } from "@/content/seed";
import { AreaView } from "./AreaView";
import { absoluteUrl } from "@/lib/site";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function generateStaticParams() {
  if (!useSanity) return areaDocs.map((a) => ({ slug: a.slug }));
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
  if (!useSanity) {
    const area = getAreaDoc(slug);
    if (!area) return {};
    const url = absoluteUrl(`/areas/${slug}`);
    return {
      title: `${area.name} | Valme Solutions`,
      description: area.tagline,
      alternates: { canonical: url },
      openGraph: {
        type: "website",
        url,
        title: `${area.name} | Valme Solutions`,
        description: area.tagline,
      },
    };
  }
  const data = (await sanityFetch<any>({
    query: AREA_SEO_QUERY,
    params: { slug },
    tags: ["area", "siteSettings"],
  })) as any;
  const area = data?.area;
  if (!area) return {};
  const fallback = data?.settings?.defaultSeo ?? {};
  const seo = area.seo ?? {};
  const title = seo.title ?? `${area.name} | Valme Solutions`;
  const description = seo.description ?? area.tagline ?? fallback.description;
  const og = imageUrl(seo.ogImage ?? fallback.ogImage);
  const url = absoluteUrl(`/areas/${slug}`);

  const meta: Metadata = {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      ...(og ? { images: [og] } : {}),
    },
  };
  if (seo.noIndex) meta.robots = { index: false, follow: false };
  return meta;
}

export default async function AreaRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!useSanity) {
    const area = getAreaDoc(slug);
    if (!area) notFound();
    return <AreaView area={area} settings={settingsSeed} others={otherAreas(slug)} />;
  }

  const data = (await sanityFetch<any>({
    query: AREA_QUERY,
    params: { slug },
    tags: ["area", "siteSettings"],
  })) as any;

  if (!data?.area) notFound();

  return <AreaView area={data.area} settings={data.settings} others={data.others ?? []} />;
}
