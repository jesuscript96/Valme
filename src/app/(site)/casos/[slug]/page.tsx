import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSettings } from "@/sanity/data";
import { caseDocs, getCaseDoc, otherCases } from "@/content/seed";
import { CaseView } from "./CaseView";
import { absoluteUrl } from "@/lib/site";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Casos de éxito currently live in the local seed (no Sanity schema yet). The
// site chrome (navbar/footer) still comes from getSettings, which resolves to
// Sanity or the seed depending on `hasSanityConfig`.
export function generateStaticParams() {
  return caseDocs.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = getCaseDoc(slug);
  if (!item) return {};
  const url = absoluteUrl(`/casos/${slug}`);
  return {
    title: `${item.title} | Casos de éxito · Valme Solutions`,
    description: item.summary,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: `${item.title} | Casos de éxito · Valme Solutions`,
      description: item.summary,
    },
  };
}

export default async function CaseRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getCaseDoc(slug);
  if (!item) notFound();

  const settings = (await getSettings()) as any;
  return <CaseView item={item} settings={settings} others={otherCases(slug)} />;
}
