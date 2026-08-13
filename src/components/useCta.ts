"use client";
import { useWhatsApp } from "./WhatsApp";
import { useSmoothScroll } from "./SmoothScroll";

export type CtaData = { label?: string; kind?: string; href?: string };

/** Turns a Sanity `cta` object into an onClick handler matching its `kind`. */
export function useCta() {
  const { open } = useWhatsApp();
  const { scrollTo } = useSmoothScroll();

  return (cta?: CtaData): (() => void) | undefined => {
    if (!cta) return undefined;
    if (cta.kind === "whatsapp") return open;
    if (cta.kind === "section") {
      return () => {
        const node = document.getElementById((cta.href ?? "").replace(/^#/, ""));
        if (node) scrollTo(node, -20);
      };
    }
    if (cta.kind === "url" && cta.href) {
      return () => {
        window.location.href = cta.href as string;
      };
    }
    return undefined;
  };
}
