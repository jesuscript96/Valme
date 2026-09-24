import type { Añadido } from "../base/runtime";
import { señal, type Señal } from "../../types";

/**
 * MÓVIL Y PRIMERA PANTALLA · pasos 1 y 2
 *
 * Se mide con el móvil emulado de verdad, no con la ventana estrechada: hay sitios que
 * cambian de comportamiento según el agente de usuario y los puntos táctiles.
 */

const ANCHO_MOVIL = 390;
const ALTO_MOVIL = 844;

export const movil: Añadido = {
  nombre: "Móvil",
  async ejecutar(page, url) {
    const original = page.viewportSize();
    await page.setViewportSize({ width: ANCHO_MOVIL, height: ALTO_MOVIL });
    // Margen para que se recoloque lo que dependa de media queries.
    await page.waitForTimeout(1200);

    const r = (await page.evaluate(`(() => {
      const vw = window.innerWidth, vh = window.innerHeight;

      // Objetivos táctiles. WCAG 2.2 exige 24 px como mínimo legal; 44 px es lo que
      // funciona de verdad con un dedo.
      const tocables = Array.from(document.querySelectorAll('a[href],button,input,select,textarea,[role="button"]'))
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width > 0 && r.height > 0 && r.top < vh * 3);
      const pequeños = tocables.filter((r) => r.width < 44 || r.height < 44);
      const ilegales = tocables.filter((r) => r.width < 24 || r.height < 24);

      // Lo que se ve sin hacer scroll.
      const enPrimeraPantalla = Array.from(document.querySelectorAll("h1,h2,p,a,button"))
        .filter((el) => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.top < vh && r.height > 0; });
      const textoPrimeraPantalla = enPrimeraPantalla
        .filter((el) => ["H1","H2","P"].includes(el.tagName))
        .map((el) => (el.textContent || "").trim()).filter(Boolean).join(" ").slice(0, 400);
      const ctaPrimeraPantalla = enPrimeraPantalla
        .filter((el) => ["A","BUTTON"].includes(el.tagName))
        .map((el) => (el.textContent || "").trim())
        .filter((t) => t.length > 1 && t.length < 40);

      return {
        scrollHorizontal: document.documentElement.scrollWidth > vw + 2,
        anchoDocumento: document.documentElement.scrollWidth,
        anchoVentana: vw,
        tocables: tocables.length,
        tocablesPequeños: pequeños.length,
        tocablesIlegales: ilegales.length,
        palabrasPrimeraPantalla: textoPrimeraPantalla.split(/\\s+/).filter(Boolean).length,
        textoPrimeraPantalla,
        ctas: Array.from(new Set(ctaPrimeraPantalla)),
        telefonoPulsable: Boolean(document.querySelector('a[href^="tel:"]')),
        whatsapp: Boolean(document.querySelector('a[href*="wa.me"],a[href*="whatsapp"]')),
        viewportDeclarado: Boolean(document.querySelector('meta[name="viewport"]')),
      };
    })()`)) as {
      scrollHorizontal: boolean; anchoDocumento: number; anchoVentana: number;
      tocables: number; tocablesPequeños: number; tocablesIlegales: number;
      palabrasPrimeraPantalla: number; textoPrimeraPantalla: string; ctas: string[];
      telefonoPulsable: boolean; whatsapp: boolean; viewportDeclarado: boolean;
    };

    if (original) await page.setViewportSize(original);

    const base = { fuente: `Navegador · móvil ${ANCHO_MOVIL} px`, url };
    const s = (id: string, que: string, valor: Señal["valor"], funcion: Señal["funcion"] = 7, limite?: string) =>
      señal({ ...base, funcion, id, que, valor, estado: "verificado", limite });

    return [
      s("movil.viewport", "Declara etiqueta viewport", r.viewportDeclarado),
      s("movil.scroll_horizontal", "Hay scroll horizontal en móvil", r.scrollHorizontal,
        7, r.scrollHorizontal ? `El documento mide ${r.anchoDocumento} px en una ventana de ${r.anchoVentana}` : undefined),
      s("movil.tocables_pequeños", "Elementos pulsables por debajo de 44 px", r.tocablesPequeños),
      s("movil.tocables_ilegales", "Elementos pulsables por debajo del mínimo de WCAG (24 px)", r.tocablesIlegales),
      s("movil.telefono", "El teléfono se puede pulsar para llamar", r.telefonoPulsable),
      s("movil.whatsapp", "Hay enlace de WhatsApp", r.whatsapp),
      s("movil.palabras_primera_pantalla", "Palabras visibles sin hacer scroll", r.palabrasPrimeraPantalla, 6),
      s("movil.cta_primera_pantalla", "Acciones visibles sin hacer scroll", r.ctas.slice(0, 6), 7),
      s("movil.mensaje_primera_pantalla", "Lo que se lee sin hacer scroll",
        r.textoPrimeraPantalla || null, 6),
    ];
  },
};
