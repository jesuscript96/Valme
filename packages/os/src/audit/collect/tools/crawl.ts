import { señal, type Señal } from "../../types";
import { analizar, extraerEnlaces, mismoSitio, normalizar, type Pagina } from "./enlaces";

/**
 * COLECTOR PROPIO DE SEO · rastreo de varias páginas.
 *
 * La recolección base solo mira la home. Los problemas de SEO que importan son de
 * conjunto: titles repetidos en veinte páginas, páginas sin H1, enlaces rotos, ramas
 * huérfanas, páginas a cinco clics. Eso necesita rastrear, y rastrear cuesta tiempo. Por
 * eso corre solo cuando se pide la herramienta de SEO.
 *
 * Cómo: se siguen los enlaces desde la home, en anchura, para saber a cuántos clics está
 * cada página; después, si queda presupuesto, se miran las del sitemap que no se han
 * alcanzado. Sin seguir redirecciones automáticamente, para poder contarlas.
 *
 * Se limita a propósito: tope de páginas, tres peticiones a la vez y pausa entre tandas.
 * Un auditor que tumba la web del prospecto no vuelve a entrar en esa reunión.
 */

const UA = "ValmeAudit/1.0 (+https://valmesolutions.com; auditoría técnica)";
const TOPE = 50;
const A_LA_VEZ = 3;
const PAUSA_MS = 200;

async function pedir(url: string, redirigir = true): Promise<{ estado: number; destino: string | null; html: string | null }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA }, signal: ctrl.signal, redirect: redirigir ? "follow" : "manual" });
    const destino = r.status >= 300 && r.status < 400 ? r.headers.get("location") : null;
    const html = r.ok && (r.headers.get("content-type") ?? "").includes("html") ? await r.text() : null;
    return { estado: r.status, destino: destino ? new URL(destino, url).toString() : null, html };
  } catch {
    return { estado: 0, destino: null, html: null };
  } finally {
    clearTimeout(t);
  }
}

const entre = (html: string, re: RegExp) => re.exec(html)?.[1]?.trim() ?? null;

async function texto(url: string): Promise<string | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA }, signal: ctrl.signal });
    return r.ok ? await r.text() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function urlsDelSitemap(base: string): Promise<string[]> {
  const xml = await texto(new URL("/sitemap.xml", base).toString());
  if (!xml) return [];
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  // Si es un índice de sitemaps, se baja un nivel. Solo uno: no perseguimos índices
  // de índices, que en sitios grandes no acaba nunca.
  if (/<sitemapindex/i.test(xml)) {
    const hijos: string[] = [];
    for (const s of locs.slice(0, 5)) {
      const sub = await texto(s);
      if (sub) hijos.push(...[...sub.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()));
    }
    return hijos;
  }
  return locs;
}

function leerPagina(url: string, r: Awaited<ReturnType<typeof pedir>>, profundidad: number | null): Pagina {
  const html = r.html ?? "";
  const robots = entre(html, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)/i) ?? "";
  return {
    url,
    estado: r.estado,
    destino: r.destino,
    title: r.html ? entre(html, /<title[^>]*>([^<]*)<\/title>/i) : null,
    h1: (html.match(/<h1[\s>]/gi) ?? []).length,
    desc: r.html ? entre(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i) : null,
    noindex: /noindex|none/i.test(robots),
    profundidad,
    enlaces: r.html ? extraerEnlaces(html, url) : [],
  };
}

/**
 * Páginas principales de un sitio, con su title y su descripción: las del sitemap, o si
 * no hay, las enlazadas desde la home. Para prellenar el llms.txt.
 */
export async function paginasClave(urlBase: string, max = 15): Promise<{ titulo: string; url: string; descripcion: string }[]> {
  const inicio = normalizar(urlBase, urlBase) ?? urlBase;
  const host = new URL(inicio).host;
  let urls = (await urlsDelSitemap(inicio)).map((u) => normalizar(u, inicio)).filter((u): u is string => Boolean(u) && mismoSitio(new URL(u as string).host, host));
  if (!urls.length) {
    const home = await pedir(inicio);
    urls = [inicio, ...(home.html ? extraerEnlaces(home.html, inicio) : [])];
  }
  const out: { titulo: string; url: string; descripcion: string }[] = [];
  for (let i = 0; i < Math.min(urls.length, max); i += A_LA_VEZ) {
    const tanda = await Promise.all(urls.slice(i, Math.min(i + A_LA_VEZ, max)).map(async (u) => leerPagina(u, await pedir(u), null)));
    for (const p of tanda) if (p.title) out.push({ titulo: p.title.split(/\s[|·–—-]\s/)[0]!.trim(), url: p.url, descripcion: p.desc ?? "" });
    await new Promise((r) => setTimeout(r, PAUSA_MS));
  }
  return out;
}

export async function rastrear(urlBase: string): Promise<Señal[]> {
  const base = { funcion: 3 as const, fuente: "Rastreo de varias páginas" };
  const inicio = normalizar(urlBase, urlBase) ?? urlBase;
  const host = new URL(inicio).host;
  const sitemap = (await urlsDelSitemap(inicio))
    .map((u) => normalizar(u, inicio))
    .filter((u): u is string => Boolean(u) && mismoSitio(new URL(u as string).host, host));

  // 1 · En anchura desde la home: la profundidad es el número de clics.
  const paginas = new Map<string, Pagina>();
  let frontera: string[] = [inicio];
  const vistas = new Set<string>([inicio]);
  for (let nivel = 0; frontera.length && paginas.size < TOPE; nivel++) {
    const siguiente: string[] = [];
    for (let i = 0; i < frontera.length && paginas.size < TOPE; i += A_LA_VEZ) {
      const tanda = frontera.slice(i, i + A_LA_VEZ).slice(0, TOPE - paginas.size);
      const hechas = await Promise.all(tanda.map(async (u) => leerPagina(u, await pedir(u, false), nivel)));
      for (const p of hechas) {
        paginas.set(p.url, p);
        // Una redirección interna se sigue como si fuera un enlace, al mismo nivel.
        const nuevos = [...p.enlaces, ...(p.destino ? [normalizar(p.destino, p.url)] : [])];
        for (const n of nuevos) {
          if (n && !vistas.has(n) && mismoSitio(new URL(n).host, host)) {
            vistas.add(n);
            (p.destino && n === normalizar(p.destino, p.url) ? frontera : siguiente).push(n);
          }
        }
      }
      await new Promise((r) => setTimeout(r, PAUSA_MS));
    }
    frontera = siguiente;
  }
  const alcanzoTope = paginas.size >= TOPE;

  // 2 · Lo del sitemap que no se ha alcanzado siguiendo enlaces, si queda presupuesto.
  for (const u of sitemap.filter((x) => !paginas.has(x)).slice(0, Math.max(0, TOPE - paginas.size))) {
    paginas.set(u, leerPagina(u, await pedir(u, false), null));
    await new Promise((r) => setTimeout(r, PAUSA_MS));
  }

  const lista = [...paginas.values()];
  const html = lista.filter((p) => p.estado >= 200 && p.estado < 300);
  const out: Señal[] = [señal({
    ...base, id: "seo.crawl", que: "Páginas rastreadas", valor: lista.length, url: inicio, estado: "verificado",
    limite: alcanzoTope ? `Tope de ${TOPE} páginas: el sitio puede tener más` : undefined,
  })];
  if (!html.length) return out;

  const repetidos = (vals: (string | null)[]) => {
    const c = new Map<string, number>();
    for (const v of vals) if (v) c.set(v, (c.get(v) ?? 0) + 1);
    return [...c.values()].filter((n) => n > 1).reduce((s, n) => s + n, 0);
  };
  const s = (id: string, que: string, valor: Señal["valor"], estado: Señal["estado"] = "verificado", limite?: string) =>
    out.push(señal({ ...base, id, que, valor, url: inicio, estado, limite }));

  s("seo.titles_duplicados", "Páginas que comparten title con otra", repetidos(html.map((p) => p.title)));
  s("seo.titles_vacios", "Páginas sin title", html.filter((p) => !p.title).length);
  s("seo.desc_vacias", "Páginas sin meta description", html.filter((p) => !p.desc).length);
  s("seo.sin_h1", "Páginas sin H1", html.filter((p) => p.h1 === 0).length);
  s("seo.varios_h1", "Páginas con más de un H1", html.filter((p) => p.h1 > 1).length);
  // Un blog es la señal más directa de si se produce contenido o no.
  s("seo.paginas_blog", "Páginas que parecen de blog", html.filter((p) => /\/(blog|noticias|articulos|recursos)\//i.test(p.url)).length);

  const a = analizar(lista, sitemap);
  s("seo.enlaces_rotos", "Enlaces internos que llevan a un error", a.enlacesRotos.slice(0, 20));
  s("seo.enlaces_a_redireccion", "Enlaces internos que pasan por una redirección", a.enlacesARedireccion);
  s("seo.profundidad_max", "Clics desde la home hasta la página más profunda", a.profundidadMax,
    alcanzoTope ? "parcial" : "verificado", alcanzoTope ? "El rastreo llegó al tope: puede haber páginas más profundas" : undefined);
  s("seo.paginas_profundas", "Páginas a más de 3 clics de la home", a.profundas.slice(0, 20));
  s("seo.noindex_en_sitemap", "Páginas del sitemap marcadas noindex", a.noindexEnSitemap.slice(0, 20),
    sitemap.length ? "verificado" : "no_aplica");
  // Una página huérfana solo se puede afirmar si hay sitemap y el rastreo no se quedó corto.
  s("seo.huerfanas", "Páginas del sitemap a las que no enlaza ninguna otra", a.huerfanas.slice(0, 20),
    !sitemap.length ? "no_aplica" : alcanzoTope ? "parcial" : "verificado",
    !sitemap.length ? "Sin sitemap no se puede saber qué páginas deberían estar enlazadas"
      : alcanzoTope ? "El rastreo llegó al tope: alguna podría estar enlazada desde una página no visitada" : undefined);
  return out;
}
