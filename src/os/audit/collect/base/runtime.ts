import { chromium, type Browser, type Page } from "playwright-core";
import { FIRMAS, type Deteccion } from "../../signatures";
import { señal, type Señal } from "../../types";

/**
 * CAPA DE RUNTIME. Es la autoridad sobre qué hay instalado.
 *
 * Buscar `fbq(` en el HTML da falsos positivos y falsos negativos a la vez: aparece en
 * comentarios y en bundles que nunca se ejecutan, y no aparece cuando el tag lo inyecta
 * un gestor de etiquetas después de cargar. Cargar la página de verdad y mirar qué
 * globales existen y qué peticiones salen resuelve las dos cosas.
 *
 * Comprobado sobre valmesolutions.com: el scan estático decía que había GA4 y el runtime
 * demostró que `gtag` es `undefined`. El estático se usa solo para extraer identificadores
 * de lo que el runtime ya ha confirmado.
 */

const CHROME_MAC = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

/**
 * Error con nombre propio para el caso «no hay navegador».
 *
 * Importa distinguirlo de un fallo de red: si no hay navegador, la auditoría no es
 * incompleta por culpa del sitio auditado, sino por culpa de dónde está corriendo. El
 * informe tiene que decir eso y no insinuar que el dominio tiene un problema.
 */
export class SinNavegadorError extends Error {
  constructor() {
    super(
      "No hay navegador disponible en este entorno. El recolector de runtime necesita " +
      "Chrome instalado. En local basta con tenerlo; en servidor hace falta un Chromium " +
      "empaquetado para funciones (por ejemplo @sparticuz/chromium) o un navegador remoto.",
    );
    this.name = "SinNavegadorError";
  }
}

/** ¿Estamos en una función sin sistema operativo completo? */
const enServerless = () =>
  Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

async function abrir(): Promise<Browser> {
  // En una función serverless no hay navegador instalado. `@sparticuz/chromium` empaqueta
  // un Chromium recortado que sí arranca ahí, y se carga con importación dinámica para
  // que en local no pese nada: en local usamos el Chrome de verdad, que es más fiel.
  if (enServerless()) {
    const { default: chromiumServerless } = await import("@sparticuz/chromium");
    return chromium.launch({
      args: chromiumServerless.args,
      executablePath: await chromiumServerless.executablePath(),
      headless: true,
    });
  }

  // playwright-core no descarga navegadores: usa el Chrome que ya esté instalado.
  const rutas = [process.env.CHROME_PATH, CHROME_MAC, "/usr/bin/google-chrome", "/usr/bin/chromium"];
  for (const executablePath of rutas.filter(Boolean) as string[]) {
    try {
      return await chromium.launch({ executablePath, headless: true });
    } catch { /* siguiente candidato */ }
  }
  try {
    return await chromium.launch({ headless: true, channel: "chrome" });
  } catch {
    throw new SinNavegadorError();
  }
}

/**
 * AÑADIDO · trabajo extra de una herramienta sobre la MISMA carga de página.
 *
 * Sin esto, la auditoría Web necesitaría volver a cargar la página para cada cosa que
 * mira: accesibilidad, imágenes, estilos, formulario, capturas. Seis cargas por página y
 * cuatro páginas son dos minutos de espera y seis ocasiones de que algo falle.
 *
 * Un añadido recibe la página ya cargada y devuelve señales. Si uno falla, los demás
 * siguen: se registra el fallo y no se pierde la auditoría entera.
 */
export type Añadido = {
  nombre: string;
  ejecutar: (page: Page, url: string) => Promise<Señal[]>;
};

export type Runtime = {
  señales: Señal[];
  detecciones: Deteccion[];
  /** HTML ya renderizado, para las comprobaciones de contenido. */
  html: string;
  titulo: string;
  /** Añadidos que han fallado, con su motivo. Van a la portada del informe. */
  fallos: { fuente: string; motivo: string }[];
};

export async function recogerRuntime(
  url: string,
  opciones: { añadidos?: Añadido[] } = {},
): Promise<Runtime> {
  const out: Señal[] = [];
  const fallos: { fuente: string; motivo: string }[] = [];
  const navegador = await abrir();

  try {
    const ctx = await navegador.newContext({
      viewport: { width: 1280, height: 900 },
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    });
    const page = await ctx.newPage();

    const peticiones: string[] = [];
    page.on("request", (r) => peticiones.push(r.url()));

    const errores: string[] = [];
    page.on("pageerror", (e) => errores.push(String(e).slice(0, 200)));

    await page.goto(url, { waitUntil: "networkidle", timeout: 45_000 }).catch(() => {
      // networkidle no llega en sitios con sondeo constante; con load basta.
      return page.goto(url, { waitUntil: "load", timeout: 30_000 });
    });
    // Margen para tags que inyecta un gestor de etiquetas después de cargar.
    await page.waitForTimeout(3000);

    const html = await page.content();
    const titulo = await page.title();

    // 1 · Globales realmente presentes. Esta es la prueba.
    // Las funciones de `evaluate` se pasan como CADENA a propósito. Los transpiladores
    // (tsx, esbuild) inyectan un helper `__name` en las funciones con nombre, y ese
    // helper no existe dentro del navegador: la evaluación revienta con ReferenceError.
    const nombresGlobales = JSON.stringify(FIRMAS.flatMap((f) => f.objetos));
    const globales = (await page.evaluate(
      `(() => { const w = window; const r = {};
        for (const n of ${nombresGlobales}) r[n] = typeof w[n] !== "undefined";
        return r; })()`,
    )) as Record<string, boolean>;

    // 2 · Se cruza con las peticiones de red y con los identificadores del HTML.
    const detecciones: Deteccion[] = FIRMAS.map((f) => {
      const enRuntime = f.objetos.some((o) => globales[o]);
      const enRed = f.peticiones.some((p) => peticiones.some((u) => u.includes(p)));
      const cuenta = f.id ? (f.id.exec(html)?.[1] ?? undefined) : undefined;

      return {
        clave: f.clave, nombre: f.nombre, categoria: f.categoria,
        certeza: enRuntime || enRed ? "confirmado" : cuenta ? "probable" : "ausente",
        cuenta: enRuntime || enRed ? cuenta : undefined,
        activo: enRed,
      };
    });

    const confirmadas = detecciones.filter((d) => d.certeza === "confirmado");

    // LIMITACIÓN IMPORTANTE, declarada en la propia señal.
    // Si la web tiene un banner de cookies que bloquea de verdad, los píxeles NO se cargan
    // hasta aceptar. Una lectura sin aceptar dice «no hay píxel» cuando lo que hay es un
    // banner que funciona. Comprobado sobre hawkers.co: detecta GA4 y GTM, y no detecta el
    // píxel de Meta, que probablemente esté detrás del consentimiento.
    //
    // La solución es pasar dos veces, antes y después de aceptar. Esa segunda pasada es
    // además la comprobación de si el banner bloquea algo o es decorativo.
    const hayBanner = /cookie|consentimiento/i.test(
      await page.evaluate(`document.body.innerText.slice(0, 4000)`) as string,
    );
    const avisoBanner = hayBanner
      ? "La página muestra un aviso de cookies. Los tags que estén detrás del consentimiento no se cargan en esta lectura: la ausencia no prueba que no estén."
      : undefined;

    out.push(señal({
      funcion: 8, fuente: "Navegador · runtime", id: "datos.herramientas",
      que: "Herramientas confirmadas cargando en la página",
      valor: confirmadas.map((d) => d.cuenta ? `${d.nombre} (${d.cuenta})` : d.nombre),
      url, estado: hayBanner ? "parcial" : "verificado", limite: avisoBanner,
    }));

    const pixel = detecciones.find((d) => d.clave === "meta_pixel")!;
    out.push(señal({
      funcion: 2, fuente: "Navegador · runtime", id: "paid.pixel_meta",
      que: "Píxel de Meta instalado", valor: pixel.certeza === "confirmado",
      url,
      // Sin banner la lectura es concluyente. Con banner y sin píxel, no lo es.
      estado: pixel.certeza === "confirmado" || !hayBanner ? "verificado" : "parcial",
      limite: pixel.certeza === "probable"
        ? "Hay rastro del píxel en el código pero no se ejecuta al cargar"
        : pixel.certeza === "ausente" ? avisoBanner : undefined,
    }));
    if (pixel.cuenta) {
      out.push(señal({
        funcion: 2, fuente: "Navegador · runtime", id: "paid.pixel_id",
        que: "Identificador del píxel", valor: pixel.cuenta, url, estado: "verificado",
      }));
    }

    // 3 · Eventos que dispara el píxel. Un píxel sin eventos de conversión
    //     significa que Meta optimiza a ciegas: es un hallazgo distinto de no tenerlo.
    const eventos = [...new Set(
      peticiones.filter((u) => u.includes("facebook.com/tr"))
        .map((u) => new URL(u).searchParams.get("ev"))
        .filter((v): v is string => Boolean(v)),
    )];
    out.push(señal({
      funcion: 2, fuente: "Navegador · red", id: "paid.pixel_eventos",
      que: "Eventos que dispara el píxel al cargar la home", valor: eventos.length ? eventos : null,
      url, estado: pixel.certeza === "confirmado" ? "verificado" : "no_aplica",
      limite: pixel.certeza === "confirmado" && !eventos.length
        ? "El píxel carga pero no se ha observado ningún evento" : undefined,
    }));

    out.push(señal({
      funcion: 8, fuente: "Navegador · red", id: "datos.terceros",
      que: "Dominios de terceros contactados al cargar",
      valor: [...new Set(peticiones.map((u) => { try { return new URL(u).host; } catch { return ""; } })
        .filter((h) => h && !h.includes(new URL(url).hostname.replace(/^www\./, ""))))],
      url, estado: "verificado",
    }));

    // 4 · Estructura de la página y conversión.
    const pagina = (await page.evaluate(`(() => {
      const txt = (el) => (el && el.textContent ? el.textContent : "").trim().replace(/\\s+/g, " ");
      const forms = Array.from(document.querySelectorAll("form"));
      const link = document.querySelector('link[rel="canonical"]');
      const desc = document.querySelector('meta[name="description"]');
      return {
        h1: Array.from(document.querySelectorAll("h1")).map((h) => txt(h).slice(0, 120)),
        canonical: link ? link.href : null,
        descripcion: desc ? desc.content : null,
        hreflang: Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]'))
          .map((l) => l.getAttribute("hreflang")).filter(Boolean),
        jsonLdTipos: Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
          .flatMap((sc) => { try {
            const d = JSON.parse(sc.textContent || "{}");
            const arr = Array.isArray(d) ? d : [d];
            return arr.flatMap((o) => [o["@type"]].concat((o["@graph"] || []).map((g) => g["@type"])));
          } catch (e) { return []; } }).filter(Boolean),
        formularios: forms.length,
        campos: forms.map((f) => ({
          campos: f.querySelectorAll("input:not([type=hidden]),select,textarea").length,
          obligatorios: f.querySelectorAll("[required]").length,
          consentimiento: /privacidad|protecci[oó]n de datos|rgpd|acepto/i.test(f.textContent || ""),
          destino: f.getAttribute("action"),
        })),
        social: Array.from(new Set(Array.from(document.querySelectorAll("a[href]"))
          .map((a) => a.href)
          .filter((h) => /(facebook|instagram|linkedin|tiktok|youtube)\\.com/.test(h))
          .map((h) => h.replace(/[\\\\"\x27]+$/, "")))),
        telefono: Boolean(document.querySelector('a[href^="tel:"]')),
        cookies: /cookie|consentimiento/i.test(document.body.innerText.slice(0, 4000)),
        palabras: document.body.innerText.trim().split(/\\s+/).length,
      };
    })()`)) as {
      h1: string[]; canonical: string | null; descripcion: string | null;
      hreflang: string[]; jsonLdTipos: string[]; formularios: number;
      campos: { campos: number; obligatorios: number; consentimiento: boolean; destino: string | null }[];
      social: string[]; telefono: boolean; cookies: boolean; palabras: number;
    };

    const s = (id: string, que: string, valor: Señal["valor"], funcion: Señal["funcion"], limite?: string) =>
      out.push(señal({ id, que, valor, funcion, fuente: "Navegador · DOM", url, estado: "verificado", limite }));

    s("seo.h1", "Número de H1 en la home", pagina.h1.length, 3,
      pagina.h1.length !== 1 ? "Debería haber exactamente uno" : undefined);
    s("seo.canonical", "Canonical declarada", pagina.canonical, 3);
    s("seo.descripcion", "Meta description", pagina.descripcion, 3);
    s("seo.hreflang", "Idiomas declarados con hreflang", pagina.hreflang.length ? pagina.hreflang : null, 3);
    s("seo.jsonld", "Tipos de datos estructurados", [...new Set(pagina.jsonLdTipos)], 3);
    s("web.formularios", "Formularios en la home", pagina.formularios, 7);
    s("web.telefono", "Teléfono visible como enlace", pagina.telefono, 7);
    s("web.cookies", "Aviso de cookies detectado", pagina.cookies, 7);
    s("copy.extension", "Palabras de texto en la home", pagina.palabras, 6);
    s("social.perfiles", "Perfiles sociales enlazados", pagina.social.length ? pagina.social : null, 4);

    if (pagina.campos.length) {
      const f = pagina.campos[0];
      s("web.campos_formulario", "Campos del primer formulario", f.campos, 7,
        f.campos > 6 ? "Cada campo de más cuesta envíos" : undefined);
      s("web.consentimiento", "El formulario pide consentimiento RGPD", f.consentimiento, 7);
      s("web.destino_formulario", "A dónde envía el formulario", f.destino, 8);
    }

    if (errores.length) {
      out.push(señal({
        funcion: 7, fuente: "Navegador · consola", id: "web.errores_js",
        que: "Errores de JavaScript al cargar", valor: errores.length, url, estado: "verificado",
        limite: errores[0],
      }));
    }

    // Los añadidos de la herramienta, sobre esta misma página ya cargada.
    for (const a of opciones.añadidos ?? []) {
      try {
        out.push(...(await a.ejecutar(page, url)));
      } catch (e) {
        fallos.push({
          fuente: a.nombre,
          motivo: e instanceof Error ? e.message : String(e),
        });
      }
    }

    await ctx.close();
    return { señales: out, detecciones, html, titulo, fallos };
  } finally {
    await navegador.close();
  }
}
