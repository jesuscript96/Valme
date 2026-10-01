import { señal, type Señal } from "../../types";

/**
 * PAGESPEED Y CrUX · paso 1 (¿llega?)
 *
 * Dos cosas distintas y las dos hacen falta:
 *
 *  · **CrUX** da el percentil 75 de USUARIOS REALES de los últimos 28 días. Es el dato
 *    que no se discute en una reunión: son sus visitantes de este mes, no un laboratorio.
 *  · **Lighthouse** dice POR QUÉ. CrUX da el número; PageSpeed da la causa.
 *
 * Detalle que separa un informe defendible de uno automático: CrUX responde por URL y por
 * origen, y en sitios pequeños la URL casi nunca tiene muestra suficiente. Se pide la URL,
 * se cae al origen, y **se dice cuál de los dos se está enseñando**.
 */

const CLAVE = () => process.env.PAGESPEED_API_KEY;

export const UMBRALES = {
  lcp: { bueno: 2500, malo: 4000, unidad: "ms" },
  inp: { bueno: 200, malo: 500, unidad: "ms" },
  cls: { bueno: 0.1, malo: 0.25, unidad: "" },
  ttfb: { bueno: 800, malo: 1800, unidad: "ms" },
  fcp: { bueno: 1800, malo: 3000, unidad: "ms" },
} as const;

type Metrica = keyof typeof UMBRALES;

const CRUX_CLAVES: Record<Metrica, string> = {
  lcp: "largest_contentful_paint",
  inp: "interaction_to_next_paint",
  cls: "cumulative_layout_shift",
  ttfb: "experimental_time_to_first_byte",
  fcp: "first_contentful_paint",
};

export function calificar(m: Metrica, v: number): "bueno" | "mejorable" | "malo" {
  const u = UMBRALES[m];
  return v <= u.bueno ? "bueno" : v <= u.malo ? "mejorable" : "malo";
}

type RespuestaCrux = {
  record?: {
    key?: { url?: string; origin?: string };
    metrics?: Record<string, { percentiles?: { p75?: number | string } }>;
  };
};

async function crux(
  destino: { url: string } | { origin: string },
  formFactor: "PHONE" | "DESKTOP",
): Promise<{ metrics: Partial<Record<Metrica, number>>; ambito: "url" | "origen" } | null> {
  const r = await fetch(
    `https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=${CLAVE()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...destino, formFactor }),
      cache: "no-store",
    },
  );
  // 404 significa «no hay muestra suficiente», que no es un error: es una respuesta.
  if (!r.ok) return null;

  const j = (await r.json()) as RespuestaCrux;
  const m = j.record?.metrics ?? {};
  const out: Partial<Record<Metrica, number>> = {};
  for (const [clave, campo] of Object.entries(CRUX_CLAVES) as [Metrica, string][]) {
    const p75 = m[campo]?.percentiles?.p75;
    if (p75 !== undefined) out[clave] = Number(p75);
  }
  return Object.keys(out).length
    ? { metrics: out, ambito: "url" in destino ? "url" : "origen" }
    : null;
}

type Lighthouse = {
  lighthouseResult?: {
    categories?: Record<string, { score?: number }>;
    audits?: Record<string, { score?: number | null; numericValue?: number; displayValue?: string; title?: string }>;
  };
};

async function lighthouse(url: string, strategy: "mobile" | "desktop"): Promise<Lighthouse | null> {
  const u = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  u.searchParams.set("url", url);
  u.searchParams.set("strategy", strategy);
  u.searchParams.set("key", CLAVE()!);
  for (const c of ["performance", "accessibility", "best-practices", "seo"]) {
    u.searchParams.append("category", c);
  }
  const r = await fetch(u, { cache: "no-store", signal: AbortSignal.timeout(90_000) });
  return r.ok ? ((await r.json()) as Lighthouse) : null;
}

export async function recogerPsi(url: string): Promise<Señal[]> {
  if (!CLAVE()) throw new Error("Falta PAGESPEED_API_KEY");

  const origin = new URL(url).origin;
  const out: Señal[] = [];
  const base = { funcion: 7 as const, url };

  // --- Campo: usuarios reales -------------------------------------------
  for (const [ff, etiqueta] of [["PHONE", "móvil"], ["DESKTOP", "escritorio"]] as const) {
    const r = (await crux({ url }, ff)) ?? (await crux({ origin }, ff));

    if (!r) {
      out.push(señal({
        ...base, fuente: "CrUX", id: `campo.${ff.toLowerCase()}`,
        que: `Datos de usuarios reales en ${etiqueta}`, valor: null, estado: "pendiente",
        limite: "El sitio no tiene tráfico suficiente para que Google publique datos de campo. No es un fallo suyo ni nuestro.",
      }));
      continue;
    }

    for (const [m, v] of Object.entries(r.metrics) as [Metrica, number][]) {
      out.push(señal({
        ...base, fuente: `CrUX · ${r.ambito === "url" ? "esta página" : "todo el dominio"}`,
        id: `campo.${m}_${ff === "PHONE" ? "movil" : "escritorio"}`,
        que: `${m.toUpperCase()} real en ${etiqueta} (p75)`,
        valor: v, estado: "verificado",
        limite: r.ambito === "origen"
          ? "Son datos agregados de todo el dominio: esta página concreta no tiene muestra suficiente."
          : undefined,
      }));
    }
  }

  // --- Laboratorio: el porqué --------------------------------------------
  const lh = await lighthouse(url, "mobile");
  if (lh?.lighthouseResult) {
    const cat = lh.lighthouseResult.categories ?? {};
    const aud = lh.lighthouseResult.audits ?? {};
    const pct = (k: string) => (cat[k]?.score != null ? Math.round(cat[k]!.score! * 100) : null);

    for (const [k, nombre] of [
      ["performance", "Rendimiento"], ["accessibility", "Accesibilidad"],
      ["best-practices", "Buenas prácticas"], ["seo", "SEO técnico"],
    ] as const) {
      out.push(señal({
        ...base, fuente: "Lighthouse · móvil", id: `lab.${k}`,
        que: `${nombre} en laboratorio (0-100)`, valor: pct(k), estado: "verificado",
      }));
    }

    // Las oportunidades concretas: esto es lo que se arregla, no la puntuación.
    const oportunidades = Object.entries(aud)
      .filter(([, a]) => a.score !== null && a.score !== undefined && a.score < 0.9 && a.displayValue)
      .map(([id, a]) => `${a.title ?? id}: ${a.displayValue}`)
      .slice(0, 10);
    out.push(señal({
      ...base, fuente: "Lighthouse · móvil", id: "lab.oportunidades",
      que: "Lo concreto que Lighthouse señala", valor: oportunidades, estado: "verificado",
    }));

    const terceros = aud["third-party-summary"]?.displayValue;
    if (terceros) {
      out.push(señal({
        ...base, fuente: "Lighthouse · móvil", id: "lab.terceros",
        que: "Coste de los scripts de terceros", valor: terceros, estado: "verificado",
        limite: "En una web de marketing suele ser el gestor de etiquetas, el chat y los píxeles",
      }));
    }
  }

  return out;
}
