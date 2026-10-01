import type { Añadido } from "../base/runtime";
import { señal, type Señal } from "../../types";

/**
 * CONFIANZA Y PREVISUALIZACIÓN · pasos 3 y 2
 *
 * Señales verificables de quién hay detrás, y cómo se ve el enlace al compartirlo.
 *
 * Lo segundo no lo audita nadie y en B2B es una fuga real: si un comercial pega la URL en
 * LinkedIn y sale un cuadro gris sin texto, eso pasa en el canal donde más se mueve su
 * negocio.
 */

export const confianza: Añadido = {
  nombre: "Confianza",
  async ejecutar(page, url) {
    const r = (await page.evaluate(`(() => {
      const meta = (sel) => { const e = document.querySelector(sel); return e ? e.getAttribute("content") : null; };
      const texto = document.body.innerText;
      const enlaces = Array.from(document.querySelectorAll("a[href]")).map((a) => ({
        href: a.href, txt: (a.textContent || "").toLowerCase().trim(),
      }));
      const legal = (p) => enlaces.some((e) => p.test(e.href) || p.test(e.txt));

      return {
        ogTitulo: meta('meta[property="og:title"]'),
        ogDescripcion: meta('meta[property="og:description"]'),
        ogImagen: meta('meta[property="og:image"]'),
        twitterCard: meta('meta[name="twitter:card"]'),
        avisoLegal: legal(/aviso.?legal|legal.?notice/i),
        privacidad: legal(/privacidad|privacy|protecci[oó]n.?de.?datos/i),
        cookies: legal(/cookies/i),
        condiciones: legal(/condiciones|t[eé]rminos|terms/i),
        // Identificación fiscal: la LSSI obliga a publicarla.
        cif: /\\b([A-Z]-?\\d{8}|\\d{8}-?[A-Z])\\b/.test(texto),
        direccion: /\\b(calle|c\\/|avenida|avda|plaza|paseo|carrer)\\b/i.test(texto),
        telefono: Boolean(document.querySelector('a[href^="tel:"]')) || /\\+?34[\\s.-]?\\d{3}[\\s.-]?\\d{3}[\\s.-]?\\d{3}/.test(texto),
        email: Boolean(document.querySelector('a[href^="mailto:"]')),
        testimonios: /testimonio|opini[oó]n de|lo que dicen|rese[ñn]a/i.test(texto),
        // Cifras con contexto: reseñas, años, clientes. Prueba verificable frente a adjetivos.
        cifras: (texto.match(/\\b\\d{2,}\\s*(rese[ñn]as|clientes|a[ñn]os|proyectos|empresas)\\b/gi) || []).slice(0, 5),
        logosCliente: document.querySelectorAll('img[alt*="logo" i], [class*="logo" i] img').length,
        video: document.querySelectorAll("video, iframe[src*='youtube'], iframe[src*='vimeo']").length,
        youtubeIncrustado: document.querySelectorAll("iframe[src*='youtube']").length,
      };
    })()`)) as Record<string, unknown>;

    const g = <T>(k: string) => r[k] as T;
    const base = { fuente: "Navegador · contenido", url };
    const s = (id: string, que: string, valor: Señal["valor"], funcion: Señal["funcion"], limite?: string) =>
      señal({ ...base, funcion, id, que, valor, estado: "verificado", limite });

    const legales = [
      ["avisoLegal", "aviso legal"], ["privacidad", "privacidad"],
      ["cookies", "cookies"], ["condiciones", "condiciones"],
    ] as const;
    const faltan = legales.filter(([k]) => !g<boolean>(k)).map(([, n]) => n);

    return [
      // Previsualización al compartir.
      s("share.og_titulo", "Título para compartir", g<string | null>("ogTitulo"), 7),
      s("share.og_descripcion", "Descripción para compartir", g<string | null>("ogDescripcion"), 7),
      s("share.og_imagen", "Imagen para compartir", g<string | null>("ogImagen"), 7),
      s("share.completo", "La previsualización está completa",
        Boolean(g("ogTitulo") && g("ogDescripcion") && g("ogImagen")), 7),

      // Legal.
      s("confianza.legales_faltan", "Páginas legales que no se encuentran",
        faltan.length ? faltan : null, 7,
        faltan.length ? "La LSSI obliga a publicar la identificación del prestador" : undefined),
      s("confianza.cif", "Se publica identificación fiscal", g<boolean>("cif"), 7),
      s("confianza.direccion", "Hay dirección física", g<boolean>("direccion"), 7),
      s("confianza.telefono", "Hay teléfono", g<boolean>("telefono"), 7),
      s("confianza.email", "Hay email de contacto", g<boolean>("email"), 7),

      // Prueba.
      s("confianza.testimonios", "Hay testimonios", g<boolean>("testimonios"), 7),
      s("confianza.cifras", "Cifras verificables encontradas",
        (g<string[]>("cifras") ?? []).length ? g<string[]>("cifras") : null, 6),
      s("confianza.logos", "Posibles logos de cliente", g<number>("logosCliente"), 7),

      // Vídeo incrustado: pesa y pone cookies antes de que nadie le dé al play.
      s("web.youtube", "Vídeos de YouTube incrustados", g<number>("youtubeIncrustado"), 7,
        g<number>("youtubeIncrustado") > 0
          ? "Un iframe de YouTube carga cientos de KB y cookies aunque nadie reproduzca nada"
          : undefined),
    ];
  },
};
