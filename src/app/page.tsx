import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { sanityFetch } from "@/sanity/fetch";
import { HOME_QUERY, HOME_SEO_QUERY } from "@/sanity/queries";
import { imageUrl } from "@/sanity/image";
import { useSanity } from "@/sanity/env";
import { homeSeed, settingsSeed, areasSeed, caseCards } from "@/content/seed";
import { HomeView } from "./HomeView";
import { absoluteUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  if (!useSanity) {
    const seo = homeSeed.seo ?? {};
    return {
      title: seo.title,
      description: seo.description,
      alternates: { canonical: absoluteUrl() },
      openGraph: {
        type: "website",
        url: absoluteUrl(),
        title: seo.title,
        description: seo.description,
      },
    };
  }
  const data = (await sanityFetch<any>({
    query: HOME_SEO_QUERY,
    tags: ["homePage", "siteSettings"],
  })) as any;
  const seo = data?.seo ?? {};
  const fallback = data?.settings?.defaultSeo ?? {};
  const title = seo.title ?? fallback.title;
  const description = seo.description ?? fallback.description;
  const og = imageUrl(seo.ogImage ?? fallback.ogImage);

  const meta: Metadata = {
    title,
    description,
    alternates: { canonical: absoluteUrl() },
    openGraph: {
      type: "website",
      url: absoluteUrl(),
      title,
      description,
      ...(og ? { images: [og] } : {}),
    },
  };
  if (seo.noIndex) meta.robots = { index: false, follow: false };
  return meta;
}

export default async function Page() {
  if (!useSanity) {
    return (
      <HomeView
        home={homeSeed}
        settings={settingsSeed}
        areas={areasSeed}
        cases={caseCards}
      />
    );
  }

  const data = (await sanityFetch<any>({
    query: HOME_QUERY,
    tags: ["homePage", "siteSettings", "area"],
  })) as any;

  if (!data?.home) notFound();

  return (
    <HomeView
      home={data.home}
      settings={data.settings}
      areas={data.areas ?? []}
      cases={data.cases ?? []}
    />
  );
}
