"use client";
import Link from "next/link";
import { Reveal } from "./Reveal";
import { useWhatsApp } from "./WhatsApp";
import { imageUrl } from "@/sanity/image";

type FooterLink = { _key?: string; label?: string; href?: string };
type FooterColumn = { _key?: string; title?: string; links?: FooterLink[] };
export type FooterSettings = {
  brandName?: string;
  logo?: unknown;
  footerLegal?: string;
  footerColumns?: FooterColumn[];
  linkedinUrl?: string;
};

export function Footer({ settings }: { settings: FooterSettings }) {
  const { open: openWhatsApp } = useWhatsApp();
  const brand = settings?.brandName ?? "Valme";
  const logoSrc = imageUrl(settings?.logo as never) ?? "/assets/tomato_slice_logo.png";
  const columns = settings?.footerColumns ?? [];

  return (
    <footer className="relative bg-brand-black text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 pt-20 md:pt-28">
        <div className="flex flex-col md:flex-row justify-between gap-12 pb-16">
          <div className="flex flex-col max-w-sm">
            <div className="flex items-center gap-2.5 mb-6">
              <span className="grid place-items-center w-7 h-7 rounded-md bg-white shrink-0">
                <img src={logoSrc} alt={brand} className="w-5 h-5 object-contain mix-blend-multiply" />
              </span>
              <span className="text-xl font-semibold tracking-tight font-display">{brand}</span>
            </div>
            <p className="text-sm text-white/45 mb-8 leading-relaxed whitespace-pre-line">
              {settings?.footerLegal}
            </p>
            <div className="flex gap-3">
              <a
                href={settings?.linkedinUrl || "#"}
                data-cursor="hover"
                className="px-6 py-2 text-xs font-medium border border-white/15 rounded-full hover:bg-white hover:text-black transition-colors uppercase tracking-wider"
              >
                LinkedIn
              </a>
              <button
                type="button"
                onClick={openWhatsApp}
                data-cursor="hover"
                className="px-6 py-2 text-xs font-medium border border-white/15 rounded-full hover:bg-white hover:text-black transition-colors uppercase tracking-wider"
              >
                Contactar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-16 text-sm">
            {columns.map((col) => (
              <div key={col._key ?? col.title} className="flex flex-col gap-4">
                <h4 className="text-xs font-mono text-white/35 mb-2 uppercase tracking-wide">
                  {col.title}
                </h4>
                {(col.links ?? []).map((link) => (
                  <Link
                    key={link._key ?? link.label}
                    href={link.href ?? "#"}
                    className="text-white/55 hover:text-white transition-colors w-fit"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Giant wordmark */}
      <Reveal as="div" y={60} className="border-t border-white/10 overflow-hidden">
        <div className="max-w-[1600px] mx-auto px-6 pt-10 pb-2 flex items-end justify-center">
          <span className="select-none font-display font-medium tracking-tighter leading-[0.8] text-white text-[24vw] md:text-[22vw]">
            {brand}
          </span>
        </div>
      </Reveal>
    </footer>
  );
}
