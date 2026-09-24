import { señal, type Señal } from "../../types";

/**
 * BIBLIOTECA DE ANUNCIOS DE META.
 *
 * Por la DSA, todos los anuncios que llegan a la UE están en la biblioteca, no solo los
 * políticos. La documentación lo dice al revés de como se suele leer:
 *
 *   «Ads that did not reach any location in the EU will only return if they are about
 *    social issues, elections or politics.»
 *
 * Para cualquier anunciante que llegue a España, esto devuelve su estrategia de paid
 * entera. Gratis y oficial. Necesita un token de una app de Meta: la misma que ya hace
 * falta para crear campañas.
 *
 * El paso que se olvida: de un DOMINIO no se llega directamente a los anuncios. Hace
 * falta el ID de la página de Facebook, y eso se resuelve en `resolverPagina`.
 */

const VERSION = process.env.META_API_VERSION ?? "v26.0";
const GRAPH = `https://graph.facebook.com/${VERSION}`;

export type Anuncio = {
  id: string;
  paginaId: string;
  paginaNombre: string;
  inicio: string;
  fin: string | null;
  plataformas: string[];
  cuerpos: string[];
  titulos: string[];
  cta: string | null;
  enlaces: string[];
};

type RespuestaAnuncio = {
  id: string;
  page_id: string;
  page_name: string;
  ad_delivery_start_time: string;
  ad_delivery_stop_time?: string;
  publisher_platforms?: string[];
  ad_creative_bodies?: string[];
  ad_creative_link_titles?: string[];
  ad_creative_link_captions?: string[];
};

/**
 * Del dominio a la página de Facebook. En orden de fiabilidad:
 *  1. El enlace a Facebook que la propia web pone en su pie.
 *  2. Búsqueda por nombre en la biblioteca.
 * Si no se resuelve, se dice: no se asume que no hay anuncios.
 */
export function resolverPagina(enlacesSociales: string[]): string | null {
  const fb = enlacesSociales.find((u) => /facebook\.com\//i.test(u));
  if (!fb) return null;
  const m = /facebook\.com\/(?:profile\.php\?id=)?([^/?#]+)/i.exec(fb);
  const slug = m?.[1];
  return slug && !["sharer", "share.php", "dialog"].includes(slug) ? slug : null;
}

export async function recogerAnuncios(opts: {
  token: string;
  paginaIds?: string[];
  terminos?: string;
  paises?: string[];
}): Promise<{ anuncios: Anuncio[]; señales: Señal[] }> {
  const url = new URL(`${GRAPH}/ads_archive`);
  url.searchParams.set("access_token", opts.token);
  url.searchParams.set("ad_reached_countries", JSON.stringify(opts.paises ?? ["ES"]));
  url.searchParams.set("ad_active_status", "ALL");
  url.searchParams.set("ad_type", "ALL");
  url.searchParams.set("limit", "200");
  url.searchParams.set("fields", [
    "id", "page_id", "page_name", "ad_delivery_start_time", "ad_delivery_stop_time",
    "publisher_platforms", "ad_creative_bodies", "ad_creative_link_titles",
    "ad_creative_link_captions", "ad_snapshot_url",
  ].join(","));

  if (opts.paginaIds?.length) url.searchParams.set("search_page_ids", JSON.stringify(opts.paginaIds));
  else if (opts.terminos) url.searchParams.set("search_terms", opts.terminos);
  else throw new Error("Hace falta el ID de página o unos términos de búsqueda");

  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`Ad Library devolvió ${r.status}: ${(await r.text()).slice(0, 200)}`);

  const json = (await r.json()) as { data?: RespuestaAnuncio[] };
  const anuncios: Anuncio[] = (json.data ?? []).map((a) => ({
    id: a.id,
    paginaId: a.page_id,
    paginaNombre: a.page_name,
    inicio: a.ad_delivery_start_time,
    fin: a.ad_delivery_stop_time ?? null,
    plataformas: a.publisher_platforms ?? [],
    cuerpos: a.ad_creative_bodies ?? [],
    titulos: a.ad_creative_link_titles ?? [],
    cta: null,
    enlaces: a.ad_creative_link_captions ?? [],
  }));

  return { anuncios, señales: derivar(anuncios) };
}

/** De la lista de anuncios a señales. Determinista: son cuentas y fechas. */
export function derivar(anuncios: Anuncio[]): Señal[] {
  const base = { funcion: 2 as const, fuente: "Meta Ad Library API" };
  const activos = anuncios.filter((a) => !a.fin);
  const out: Señal[] = [];

  out.push(señal({ ...base, id: "paid.meta_activos", que: "Anuncios activos en Meta",
    valor: activos.length, estado: "verificado" }));

  if (activos.length) {
    const inicios = activos.map((a) => new Date(a.inicio).getTime()).sort((x, y) => x - y);
    const dias = Math.round((Date.now() - inicios[0]) / 86_400_000);
    out.push(señal({ ...base, id: "paid.meta_antiguedad",
      que: "Días que lleva activo el anuncio más antiguo", valor: dias, estado: "verificado" }));

    const hace90 = Date.now() - 90 * 86_400_000;
    out.push(señal({ ...base, id: "paid.meta_nuevos_90d",
      que: "Anuncios lanzados en los últimos 90 días",
      valor: inicios.filter((t) => t >= hace90).length, estado: "verificado" }));

    out.push(señal({ ...base, id: "paid.meta_creatividades",
      que: "Textos principales distintos entre los anuncios activos",
      valor: new Set(activos.flatMap((a) => a.cuerpos)).size, estado: "verificado" }));

    out.push(señal({ ...base, id: "paid.meta_plataformas",
      que: "Plataformas donde se sirven", valor: [...new Set(activos.flatMap((a) => a.plataformas))],
      estado: "verificado" }));
  }

  return out;
}
