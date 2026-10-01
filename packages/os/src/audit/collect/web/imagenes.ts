import type { Añadido } from "../base/runtime";
import { señal, type Señal } from "../../types";

/**
 * IMÁGENES · paso 1 (¿llega?)
 *
 * El colector que más rinde de toda la herramienta. Todo sale de la página que ya está
 * cargada, sin credenciales, y casi siempre encuentra algo: la imagen del hero suele ser
 * el elemento del LCP, así que esto explica el porqué del número de velocidad en vez de
 * limitarse a darlo.
 */

const KB = 1024;

type Img = {
  src: string;
  bytes: number;
  tipo: string;
  anchoReal: number;
  anchoMostrado: number;
  altoReal: number;
  altoMostrado: number;
  lazy: boolean;
  dimensionesDeclaradas: boolean;
  alt: string | null;
  sobreElPliegue: boolean;
};

export const imagenes: Añadido = {
  nombre: "Imágenes",
  async ejecutar(page, url) {
    // El peso real sale de las peticiones de red; el tamaño mostrado, del DOM. Hay que
    // cruzarlos: una imagen enorme servida en un hueco pequeño no se ve en ninguno de los
    // dos por separado.
    const recursos = (await page.evaluate(`(() => {
      return performance.getEntriesByType("resource")
        .filter((r) => r.initiatorType === "img" || /\\.(png|jpe?g|webp|avif|gif|svg)(\\?|$)/i.test(r.name))
        .map((r) => ({ url: r.name, bytes: r.encodedBodySize || r.transferSize || 0 }));
    })()`)) as { url: string; bytes: number }[];

    const pesos = new Map(recursos.map((r) => [r.url, r.bytes]));

    const enDom = (await page.evaluate(`(() => {
      const alto = window.innerHeight;
      return Array.from(document.images).map((im) => {
        const r = im.getBoundingClientRect();
        return {
          src: im.currentSrc || im.src,
          anchoReal: im.naturalWidth, altoReal: im.naturalHeight,
          anchoMostrado: Math.round(r.width), altoMostrado: Math.round(r.height),
          lazy: im.loading === "lazy",
          dimensionesDeclaradas: im.hasAttribute("width") && im.hasAttribute("height"),
          alt: im.hasAttribute("alt") ? im.getAttribute("alt") : null,
          sobreElPliegue: r.top < alto && r.bottom > 0,
        };
      }).filter((im) => im.src && !im.src.startsWith("data:"));
    })()`)) as Omit<Img, "bytes" | "tipo">[];

    const imgs: Img[] = enDom.map((im) => ({
      ...im,
      bytes: pesos.get(im.src) ?? 0,
      tipo: (/\.(\w+)(\?|$)/.exec(im.src)?.[1] ?? "").toLowerCase(),
    }));

    const base = { funcion: 7 as const, fuente: "Navegador · imágenes", url };
    const s = (id: string, que: string, valor: Señal["valor"], limite?: string) =>
      señal({ ...base, id, que, valor, estado: "verificado", limite });

    const out: Señal[] = [s("web.img_total", "Imágenes en la página", imgs.length)];
    if (imgs.length === 0) return out;

    const pesoTotal = imgs.reduce((t, i) => t + i.bytes, 0);
    out.push(s("web.img_peso", "Peso total de las imágenes en KB", Math.round(pesoTotal / KB)));

    // Formatos antiguos. Convertir a WebP o AVIF suele quitar más de la mitad del peso
    // sin tocar nada más, así que es la recomendación más barata que existe.
    const antiguas = imgs.filter((i) => ["jpg", "jpeg", "png"].includes(i.tipo));
    out.push(s("web.img_formato_antiguo", "Imágenes en JPEG o PNG en vez de WebP o AVIF",
      antiguas.length));
    out.push(s("web.img_peso_antiguo", "KB que ocupan esas imágenes",
      Math.round(antiguas.reduce((t, i) => t + i.bytes, 0) / KB)));

    // Servida mucho más grande de lo que se ve. El desperdicio más común y más invisible.
    const sobredimensionadas = imgs.filter(
      (i) => i.anchoMostrado > 0 && i.anchoReal > i.anchoMostrado * 2,
    );
    out.push(s("web.img_sobredimensionadas", "Imágenes servidas al doble o más del tamaño en que se ven",
      sobredimensionadas.length));
    if (sobredimensionadas.length) {
      const peor = sobredimensionadas.sort((a, b) => b.anchoReal / b.anchoMostrado - a.anchoReal / a.anchoMostrado)[0];
      out.push(s("web.img_peor_caso",
        "La más desproporcionada, ancho real frente al mostrado",
        `${peor.anchoReal} px servidos para ${peor.anchoMostrado} px visibles`,
      ));
    }

    // La del hero: casi siempre es el elemento del LCP.
    const hero = imgs.filter((i) => i.sobreElPliegue).sort((a, b) => b.bytes - a.bytes)[0];
    if (hero) {
      out.push(s("web.img_hero_peso", "KB de la imagen más pesada de la primera pantalla",
        Math.round(hero.bytes / KB)));
    }

    // Lazy loading, solo tiene sentido pedirlo por debajo del pliegue.
    const bajoPliegue = imgs.filter((i) => !i.sobreElPliegue);
    out.push(s("web.img_sin_lazy", "Imágenes por debajo del pliegue sin carga diferida",
      bajoPliegue.filter((i) => !i.lazy).length));

    // Sin width/height: es la causa habitual de que el contenido baile al cargar.
    out.push(s("web.img_sin_dimensiones", "Imágenes sin width y height declarados",
      imgs.filter((i) => !i.dimensionesDeclaradas).length));

    out.push(s("web.img_sin_alt", "Imágenes sin texto alternativo",
      imgs.filter((i) => i.alt === null).length));

    // Estimación del ahorro. Se calcula, no se inventa: peso actual de los formatos
    // antiguos por un factor conservador de conversión a WebP.
    const ahorro = Math.round((antiguas.reduce((t, i) => t + i.bytes, 0) * 0.55) / KB);
    if (ahorro > 50) {
      out.push(s("web.img_ahorro", "KB que se ahorrarían solo convirtiendo a WebP", ahorro,
        "Estimación con un factor conservador del 55 %, no una medición"));
    }

    return out;
  },
};
