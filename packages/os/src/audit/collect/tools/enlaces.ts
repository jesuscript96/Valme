/**
 * ANÁLISIS DEL RASTREO · puro, sin red, para poder probarlo.
 *
 * Recibe las páginas descargadas (con su profundidad en clics desde la home y sus
 * enlaces internos) y las URL del sitemap, y calcula lo que un rastreo de enlaces permite
 * afirmar: enlaces rotos, páginas huérfanas, páginas demasiado profundas, enlaces que
 * pasan por redirecciones y páginas con noindex que el sitemap pide indexar.
 */

export type Pagina = {
  url: string;
  /** Código HTTP sin seguir redirecciones. 0 si la petición falló. */
  estado: number;
  /** Destino de la redirección, si la hubo. */
  destino: string | null;
  title: string | null;
  h1: number;
  desc: string | null;
  noindex: boolean;
  /** Clics desde la home; null si solo se conoce por el sitemap. */
  profundidad: number | null;
  /** Enlaces internos ya normalizados. */
  enlaces: string[];
};

const ESTATICOS = /\.(pdf|jpe?g|png|gif|svg|webp|avif|ico|zip|rar|mp4|mp3|webm|css|js|json|xml|txt|woff2?|ttf|eot)$/i;

export const mismoSitio = (a: string, b: string) =>
  a.replace(/^www\./, "").toLowerCase() === b.replace(/^www\./, "").toLowerCase();

/** URL canónica para comparar: sin fragmento, sin parámetros y sin barra final. */
export function normalizar(href: string, base: string): string | null {
  try {
    const u = new URL(href, base);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    u.hash = "";
    u.search = "";
    const ruta = u.pathname.length > 1 ? u.pathname.replace(/\/+$/, "") : "/";
    return `${u.protocol}//${u.host.toLowerCase()}${ruta}`;
  } catch {
    return null;
  }
}

/** Enlaces internos de una página HTML (mismo sitio, sin ficheros estáticos). */
export function extraerEnlaces(html: string, base: string): string[] {
  const host = new URL(base).host;
  const out = new Set<string>();
  for (const m of html.matchAll(/<a\b[^>]*?\bhref\s*=\s*["']([^"'#][^"']*)["']/gi)) {
    const href = m[1] ?? "";
    if (/^(mailto:|tel:|javascript:|data:)/i.test(href)) continue;
    const n = normalizar(href, base);
    if (!n || ESTATICOS.test(new URL(n).pathname)) continue;
    if (!mismoSitio(new URL(n).host, host)) continue;
    out.add(n);
  }
  return [...out];
}

export type Analisis = {
  rastreadas: number;
  enlacesRotos: string[];
  huerfanas: string[];
  profundidadMax: number;
  profundas: string[];
  enlacesARedireccion: number;
  noindexEnSitemap: string[];
};

export const PROFUNDIDAD_MAXIMA = 3;

export function analizar(paginas: Pagina[], sitemap: string[]): Analisis {
  const porUrl = new Map(paginas.map((p) => [p.url, p]));
  const enlazadas = new Set(paginas.flatMap((p) => p.enlaces));
  const rotos: string[] = [];
  let aRedireccion = 0;
  for (const p of paginas) {
    for (const destino of p.enlaces) {
      const d = porUrl.get(destino);
      if (!d) continue;
      if (d.estado >= 400 || d.estado === 0) rotos.push(`${p.url} → ${destino} (${d.estado || "sin respuesta"})`);
      if (d.estado >= 300 && d.estado < 400) aRedireccion++;
    }
  }
  const conProfundidad = paginas.filter((p) => p.profundidad !== null && p.estado >= 200 && p.estado < 300);
  const enSitemap = new Set(sitemap);
  return {
    rastreadas: paginas.length,
    enlacesRotos: rotos,
    // La home no es huérfana aunque nadie enlace a ella: es el punto de entrada.
    huerfanas: sitemap.filter((u) => !enlazadas.has(u) && porUrl.get(u)?.profundidad !== 0 && porUrl.get(u)?.estado !== 0),
    profundidadMax: Math.max(0, ...conProfundidad.map((p) => p.profundidad as number)),
    profundas: conProfundidad.filter((p) => (p.profundidad as number) > PROFUNDIDAD_MAXIMA).map((p) => p.url),
    enlacesARedireccion: aRedireccion,
    noindexEnSitemap: paginas.filter((p) => p.noindex && enSitemap.has(p.url)).map((p) => p.url),
  };
}
