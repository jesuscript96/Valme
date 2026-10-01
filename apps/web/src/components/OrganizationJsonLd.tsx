import { getSettings } from "@/sanity/data";
import { imageUrl } from "@/sanity/image";
import { SITE_URL, absoluteUrl } from "@/lib/site";

type ImageSource = Parameters<typeof imageUrl>[0];

/** Trim + drop empty strings, so we never emit blank JSON-LD fields. */
const str = (v: unknown): string | undefined => {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t ? t : undefined;
};

/**
 * Organization JSON-LD for the whole site.
 *
 * URLs come from `@/lib/site`, never from `siteSettings.siteUrl`: the canonical
 * domain is the www one and settings still carry the apex, so reading the URL
 * from there would make this block disagree with every canonical on the site.
 * Brand and contact data do come from `getSettings()`, so there is a single
 * source of truth for them.
 */
export async function OrganizationJsonLd() {
  const s = (await getSettings()) ?? {};
  const seo = (s.defaultSeo ?? {}) as Record<string, unknown>;

  const name = `${str(s.brandName) ?? "Valme"} Solutions`;
  const logo = imageUrl(s.logo as ImageSource) ?? absoluteUrl("/favicon.svg");
  const description = str(seo.description);
  const linkedin = str(s.linkedinUrl);
  const email = str(s.email);
  const whatsapp = str(s.whatsappNumber);
  const telephone = whatsapp
    ? whatsapp.startsWith("+")
      ? whatsapp
      : `+${whatsapp}`
    : undefined;

  const contactPoint =
    email || telephone
      ? {
          "@type": "ContactPoint",
          contactType: "sales",
          ...(email ? { email } : {}),
          ...(telephone ? { telephone } : {}),
        }
      : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url: SITE_URL,
    logo,
    ...(description ? { description } : {}),
    ...(linkedin ? { sameAs: [linkedin] } : {}),
    ...(contactPoint ? { contactPoint } : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
}
