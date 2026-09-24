import type { Añadido } from "../base/runtime";
import { señal, type Señal } from "../../types";

/**
 * ESTILOS · paso 2 (¿entiende?)
 *
 * La clave está en QUÉ se cuenta. «Usan azul y una sans» no es un hallazgo. Lo que sí lo
 * es: cuántos valores distintos hay de cada cosa.
 *
 * Una web con catorce tamaños de letra y cuarenta grises no tiene sistema de diseño:
 * tiene decisiones acumuladas de gente distinta a lo largo de los años. Y eso significa
 * que cualquier cosa nueva que se añada va a desentonar, que es exactamente el problema
 * que resuelve lo que vendemos.
 */

export const estilos: Añadido = {
  nombre: "Estilos",
  async ejecutar(page, url) {
    const r = (await page.evaluate(`(() => {
      const colores = new Set(), fondos = new Set(), familias = new Set();
      const tamaños = new Set(), radios = new Set(), sombras = new Set(), pesos = new Set();

      // Solo lo que se ve: un nodo oculto puede tener cualquier estilo heredado y
      // contarlo infla el recuento sin que nadie lo perciba.
      const nodos = Array.from(document.querySelectorAll("body *")).filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      }).slice(0, 3000);

      for (const el of nodos) {
        const c = getComputedStyle(el);
        if (el.textContent && el.textContent.trim()) {
          colores.add(c.color);
          tamaños.add(c.fontSize);
          familias.add(c.fontFamily.split(",")[0].replace(/["']/g, "").trim());
          pesos.add(c.fontWeight);
        }
        if (c.backgroundColor && c.backgroundColor !== "rgba(0, 0, 0, 0)") fondos.add(c.backgroundColor);
        if (c.borderRadius && c.borderRadius !== "0px") radios.add(c.borderRadius);
        if (c.boxShadow && c.boxShadow !== "none") sombras.add(c.boxShadow);
      }

      // Tipografías realmente descargadas y de dónde vienen.
      const fuentes = Array.from(new Set(
        performance.getEntriesByType("resource")
          .filter((e) => /\\.(woff2?|ttf|otf)(\\?|$)/i.test(e.name))
          .map((e) => e.name)
      ));

      return {
        colores: colores.size, fondos: fondos.size, familias: Array.from(familias).slice(0, 8),
        tamaños: tamaños.size, radios: radios.size, sombras: sombras.size, pesos: pesos.size,
        nodos: nodos.length,
        ficherosFuente: fuentes.length,
        fuentesDeGoogle: fuentes.filter((f) => f.includes("gstatic.com") || f.includes("googleapis.com")).length,
      };
    })()`)) as {
      colores: number; fondos: number; familias: string[]; tamaños: number;
      radios: number; sombras: number; pesos: number; nodos: number;
      ficherosFuente: number; fuentesDeGoogle: number;
    };

    // Función 7 y no 5: esto es el sistema visual DE LA WEB, que es lo que audita esta
    // herramienta. La función 5 cubre el trabajo creativo (anuncios, vídeo, producción de
    // imagen), que lo audita otra. Si se marcara como 5, el informe Web las recogería y
    // luego las filtraría, que es lo peor de los dos mundos.
    const base = { funcion: 7 as const, fuente: "Navegador · estilos", url };
    const s = (id: string, que: string, valor: Señal["valor"], limite?: string) =>
      señal({ ...base, id, que, valor, estado: "verificado", limite });

    return [
      s("estilo.colores_texto", "Colores de texto distintos en uso", r.colores),
      s("estilo.colores_fondo", "Colores de fondo distintos en uso", r.fondos),
      s("estilo.tamaños", "Tamaños de letra distintos", r.tamaños),
      s("estilo.pesos", "Pesos tipográficos distintos", r.pesos),
      s("estilo.familias", "Familias tipográficas en pantalla", r.familias),
      s("estilo.radios", "Radios de borde distintos", r.radios),
      s("estilo.sombras", "Sombras distintas", r.sombras),
      s("estilo.ficheros_fuente", "Ficheros de tipografía descargados", r.ficherosFuente),
      s("estilo.fuentes_google", "Tipografías servidas desde el CDN de Google",
        r.fuentesDeGoogle,
        r.fuentesDeGoogle > 0
          ? "Una sentencia alemana de 2022 consideró que esto vulnera el RGPD por la transferencia de IP. No es jurisprudencia española, pero es un riesgo conocido y alojarlas es trivial."
          : undefined),
      s("estilo.nodos", "Elementos visibles analizados", r.nodos,
        r.nodos >= 3000 ? "Tope de 3.000 elementos: el recuento puede quedarse corto" : undefined),
    ];
  },
};
