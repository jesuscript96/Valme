import type { Metadata } from "next";
import "../globals.css";

/**
 * ROOT LAYOUT DEL ÁREA (Valme OS).
 *
 * Deliberadamente separado del root layout de la web comercial (`(site)/layout.tsx`).
 * Aquel envuelve todo en `Providers`: Lenis (scroll suave), un cursor personalizado que
 * oculta el nativo con `cursor: none !important`, y un canvas de grano. Eso es la
 * experiencia de marketing y es incompatible con una herramienta de trabajo — en una tabla
 * de leads o un editor de landings, el scroll interceptado y el cursor oculto son un fallo.
 *
 * Al ser dos root layouts, navegar entre la web y el área provoca una recarga completa.
 * Es lo que queremos en esa frontera.
 */
export const metadata: Metadata = {
  title: "Valme OS",
  robots: { index: false, follow: false },
};

export default function OsRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-os>
      <body className="os-root">{children}</body>
    </html>
  );
}
