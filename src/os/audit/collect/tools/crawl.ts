import { señal, type Señal } from "../../types";

/**
 * COLECTOR PROPIO DE SEO · rastreo de varias páginas.
 *
 * La recolección base solo mira la home. Los problemas de SEO que importan son de
 * conjunto: titles repetidos en veinte páginas, páginas sin H1, ramas huérfanas. Eso
 * necesita rastrear, y rastrear cuesta tiempo. Por eso corre solo cuando se pide la
 * herramienta de SEO.
 *
 * Se limita a propósito: sitemap primero, tope de páginas y peticiones en serie con
 * pausa. Un auditor que tumba la web del prospecto no vuelve a entrar en esa reunión.
 */

const UA = "ValmeAudit/1.0 (+https://valmesolutions.com; auditoría técnica)";
const TOPE = 40;
const PAUSA_MS = 250;

async function traer(url: string): Promise<string | null> {
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

const entre = (html: string, re: RegExp) => re.exec(html)?.[1]?.trim() ?? null;

async function urlsDelSitemap(base: string): Promise<string[]> {
  const xml = await traer(new URL("/sitemap.xml", base).toString());
  if (!xml) return [];

  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());

  // Si es un índice de sitemaps, se baja un nivel. Solo uno: no perseguimos índices
  // de índices, que en sitios grandes no acaba nunca.
  if (/<sitemapindex/i.test(xml)) {
    const hijos: string[] = [];
    for (const s of locs.slice(0, 5)) {
      const sub = await traer(s);
      if (sub) hijos.push(...[...sub.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()));
    }
    return hijos;
  }
  return locs;
}

export async function rastrear(urlBase: string): Promise<Señal[]> {
  const base = { funcion: 3 as const, fuente: "Rastreo de varias páginas" };
  const urls = (await urlsDelSitemap(urlBase)).slice(0, TOPE);

  if (urls.length === 0) {
    return [señal({
      ...base, id: "seo.crawl", que: "Páginas rastreadas", valor: null, estado: "pendiente",
      url: urlBase,
      limite: "Sin sitemap no hay lista de páginas. Habría que rastrear siguiendo enlaces, que es más lento y menos fiable.",
    })];
  }

  const paginas: { url: string; title: string | null; h1: number; desc: string | null }[] = [];
  for (const u of urls) {
    const html = await traer(u);
    if (!html) continue;
    paginas.push({
      url: u,
      title: entre(html, /<title[^>]*>([^<]*)<\/title>/i),
      h1: (html.match(/<h1[\s>]/gi) ?? []).length,
      desc: entre(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i),
    });
    await new Promise((r) => setTimeout(r, PAUSA_MS));
  }

  const out: Señal[] = [señal({
    ...base, id: "seo.crawl", que: "Páginas rastreadas", valor: paginas.length,
    url: urlBase, estado: "verificado",
    limite: urls.length >= TOPE ? `Tope de ${TOPE} páginas: el sitio puede tener más` : undefined,
  })];

  if (paginas.length === 0) return out;

  const repetidos = (vals: (string | null)[]) => {
    const c = new Map<string, number>();
    for (const v of vals) if (v) c.set(v, (c.get(v) ?? 0) + 1);
    return [...c.values()].filter((n) => n > 1).reduce((s, n) => s + n, 0);
  };

  out.push(señal({ ...base, id: "seo.titles_duplicados",
    que: "Páginas que comparten title con otra",
    valor: repetidos(paginas.map((p) => p.title)), url: urlBase, estado: "verificado" }));

  out.push(señal({ ...base, id: "seo.titles_vacios", que: "Páginas sin title",
    valor: paginas.filter((p) => !p.title).length, url: urlBase, estado: "verificado" }));

  out.push(señal({ ...base, id: "seo.desc_vacias", que: "Páginas sin meta description",
    valor: paginas.filter((p) => !p.desc).length, url: urlBase, estado: "verificado" }));

  out.push(señal({ ...base, id: "seo.sin_h1", que: "Páginas sin H1",
    valor: paginas.filter((p) => p.h1 === 0).length, url: urlBase, estado: "verificado" }));

  out.push(señal({ ...base, id: "seo.varios_h1", que: "Páginas con más de un H1",
    valor: paginas.filter((p) => p.h1 > 1).length, url: urlBase, estado: "verificado" }));

  // Un blog es la señal más directa de si se produce contenido o no.
  const blog = paginas.filter((p) => /\/(blog|noticias|articulos|recursos)\//i.test(p.url));
  out.push(señal({ ...base, id: "seo.paginas_blog", que: "Páginas que parecen de blog",
    valor: blog.length, url: urlBase, estado: "verificado" }));

  return out;
}
