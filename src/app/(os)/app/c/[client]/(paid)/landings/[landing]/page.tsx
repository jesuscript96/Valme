import Link from "next/link";
import { notFound } from "next/navigation";
import { forClient } from "@/os/repo";
import { PageHeader } from "@/os/ui/primitives";
import { LandingEditor } from "./LandingEditor";

export const metadata = { title: "Editor de landing · Valme OS" };

export default async function LandingEditorPage({
  params,
}: {
  params: Promise<{ client: string; landing: string }>;
}) {
  const { client: slug, landing: landingId } = await params;
  const scope = await forClient(slug);
  const landing = await scope.landings.get(landingId);
  if (!landing) notFound();

  const [offers, kit] = await Promise.all([scope.offers.list(), scope.brandKit()]);
  const offer = offers.find((o) => o.id === landing.offerId) ?? null;

  return (
    <>
      <nav className="mb-3 text-[12px] text-os-faint">
        <Link href={`/app/c/${slug}/landings`} className="hover:underline">Landings</Link>
        <span className="mx-1.5">/</span>
        <span className="text-os-muted">{offer?.name ?? landing.slug}</span>
      </nav>

      <PageHeader
        title={offer?.name ?? landing.slug}
        description={`${slug}.valme.site/${landing.slug}`}
      />

      <LandingEditor
        landing={{
          id: landing.id,
          slug: landing.slug,
          status: landing.status,
          formFields: landing.formFields,
          emailTemplate: landing.emailTemplate,
          doc: landing.blocks,
        }}
        slug={slug}
        offerName={offer?.name ?? ""}
        colors={kit.identity.colors}
      />
    </>
  );
}
