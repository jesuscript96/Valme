import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { getSettings } from "@/sanity/data";
import { imageUrl } from "@/sanity/image";

export async function generateMetadata(): Promise<Metadata> {
  const s = (await getSettings()) as Record<string, any> | null;
  const seo = s?.defaultSeo ?? {};
  const url: string = s?.siteUrl ?? "https://valmesolutions.com";
  const brand: string = s?.brandName ?? "Valme";
  const title: string = seo.title ?? `${brand} Solutions | Private Operations Firm`;
  const og = imageUrl(seo.ogImage) ?? "/assets/airplane_pov_realistic_sunset.png";
  const icon = imageUrl(s?.logo) ?? "/assets/tomato_slice_logo.png";

  return {
    metadataBase: new URL(url),
    title: { default: title, template: `%s` },
    description: seo.description,
    authors: [{ name: `${brand} Solutions` }],
    robots: { index: !seo.noIndex, follow: !seo.noIndex },
    icons: { icon },
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title,
      description: seo.description,
      images: [og],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: seo.description,
      images: [og],
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = (await getSettings()) as Record<string, any> | null;
  return (
    <html lang="es">
      <body>
        <Providers
          whatsappNumber={s?.whatsappNumber}
          whatsappMessage={s?.whatsappMessage}
        >
          {children}
        </Providers>
      </body>
    </html>
  );
}
