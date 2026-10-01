import "server-only";
import { requireEnv } from "./config";

/**
 * Cliente de Firecrawl v2.
 *
 * El formato `branding` devuelve identidad visual estructurada sin pasar por un LLM:
 * logo, paleta, tipografías, espaciado, estilo de componentes y `personality`
 * (tono, energía, público). Eso último no estaba en el plan original y da semilla a los
 * bloques Voz y Público del Brand Kit sin gastar una llamada al modelo.
 */

const BASE = "https://api.firecrawl.dev/v2";

export type FirecrawlBranding = {
  colorScheme?: "light" | "dark";
  logo?: string;
  colors?: Partial<
    Record<
      "primary" | "secondary" | "accent" | "background" | "textPrimary" | "textSecondary"
      | "link" | "success" | "warning" | "error",
      string
    >
  >;
  fonts?: { family: string }[];
  typography?: {
    fontFamilies?: { primary?: string; heading?: string; code?: string };
    fontSizes?: Record<string, string>;
    fontWeights?: Record<string, number>;
  };
  spacing?: { baseUnit?: number; borderRadius?: string };
  components?: Record<string, Record<string, string>>;
  images?: { logo?: string; favicon?: string; ogImage?: string };
  personality?: { tone?: string; energy?: string; targetAudience?: string };
};

type ScrapeResponse = {
  success: boolean;
  data?: { branding?: FirecrawlBranding; markdown?: string; metadata?: Record<string, unknown> };
  warning?: string;
  error?: string;
};

async function call<T>(path: string, body: unknown): Promise<T> {
  requireEnv("firecrawl");
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    // Nunca cacheado: una extracción es siempre una lectura fresca de la web del cliente.
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Firecrawl ${path} devolvió ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

/** Identidad visual + markdown de una página, en una sola llamada. */
export async function scrapeBranding(url: string): Promise<{
  branding: FirecrawlBranding | null;
  markdown: string;
}> {
  const r = await call<ScrapeResponse>("/scrape", {
    url,
    formats: ["branding", "markdown"],
  });
  return { branding: r.data?.branding ?? null, markdown: r.data?.markdown ?? "" };
}

export async function scrapeMarkdown(url: string): Promise<string> {
  const r = await call<ScrapeResponse>("/scrape", { url, formats: ["markdown"] });
  return r.data?.markdown ?? "";
}

/** Páginas que interesan para el mensaje, en orden de prioridad. */
const PAGE_PATTERNS: [RegExp, string][] = [
  [/\/(servicios|productos|tratamientos|soluciones)/i, "servicios"],
  [/\/(sobre|nosotros|quienes|equipo|empresa)/i, "sobre-nosotros"],
  [/\/(casos|clientes|testimonios|opiniones|resultados)/i, "pruebas"],
  [/\/(precios|tarifas|planes)/i, "precios"],
  [/\/(privacidad|proteccion-de-datos|legal|aviso)/i, "legal"],
];

export async function mapSite(url: string, limit = 60): Promise<string[]> {
  const r = await call<{ links?: (string | { url: string })[] }>("/map", { url, limit });
  return (r.links ?? []).map((l) => (typeof l === "string" ? l : l.url));
}

/** Elige hasta `max` URLs relevantes: una por categoría, más la home. */
export function pickRelevantPages(home: string, links: string[], max = 6): string[] {
  const picked: string[] = [home];
  const seen = new Set<string>();
  for (const [pattern] of PAGE_PATTERNS) {
    const hit = links.find((l) => pattern.test(l) && !picked.includes(l) && !seen.has(l));
    if (hit) {
      picked.push(hit);
      seen.add(hit);
    }
    if (picked.length >= max) break;
  }
  return picked.slice(0, max);
}
