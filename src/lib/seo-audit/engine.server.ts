/**
 * Motor determinista de auditoría SEO/AEO/GEO.
 *
 * Solo lectura: obtiene la página, robots.txt, sitemap y métricas públicas.
 * Nunca modifica la web del cliente, no publica y no envía comunicaciones.
 * Cada comprobación produce evidencia observable y hallazgos normalizados
 * que quedan como PROPUESTA hasta que el Project Manager decide.
 */

export interface EngineEvidence {
  id: string;
  source: string;
  resource: string;
  method: string;
  observed: string;
  trusted: boolean;
}

export interface EngineFinding {
  id: string;
  title: string;
  category: string;
  priority: "Alta" | "Media" | "Baja";
  confidence: "alta" | "media" | "baja";
  status: string;
  description: string;
  impact: string;
  recommendation: string;
  evidenceIds: string[];
}

export interface EngineCoverage {
  service: string;
  state: string;
  reason: string;
}

export interface EngineResult {
  url: string;
  startedAt: string;
  finishedAt: string;
  evidence: EngineEvidence[];
  findings: EngineFinding[];
  coverage: EngineCoverage[];
  limitations: string[];
}

const UA =
  "Mozilla/5.0 (compatible; VALME-Search-OS/1.0; +auditoria solo lectura, sin cambios en la web)";
const MAX_BYTES = 2_000_000;
const TIMEOUT_MS = 20_000;

function nowIso(): string {
  return new Date().toISOString();
}

export function normalizeUrl(input: string): string {
  const raw = input.trim();
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(withScheme);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Solo se admiten direcciones http o https.");
  }
  const host = url.hostname.toLowerCase();
  const blocked =
    host === "localhost" ||
    host === "0.0.0.0" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host);
  if (blocked) throw new Error("La dirección no es pública y no puede auditarse.");
  if (!host.includes(".")) throw new Error("El dominio indicado no es válido.");
  return url.toString();
}

interface FetchedResource {
  finalUrl: string;
  status: number;
  redirects: number;
  headers: Record<string, string>;
  body: string;
  ms: number;
  error?: string;
}

async function get(url: string, accept: string): Promise<FetchedResource> {
  const started = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": UA, accept },
    });
    clearTimeout(timer);
    const buffer = await response.arrayBuffer();
    const body = new TextDecoder("utf-8").decode(buffer.slice(0, MAX_BYTES));
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });
    return {
      finalUrl: response.url || url,
      status: response.status,
      redirects: response.redirected ? 1 : 0,
      headers,
      body,
      ms: Date.now() - started,
    };
  } catch (error) {
    return {
      finalUrl: url,
      status: 0,
      redirects: 0,
      headers: {},
      body: "",
      ms: Date.now() - started,
      error: error instanceof Error ? error.message : "Error de red",
    };
  }
}

function attr(tag: string, name: string): string {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return (match?.[2] ?? match?.[3] ?? match?.[4] ?? "").trim();
}

function tags(html: string, tagName: string): string[] {
  return html.match(new RegExp(`<${tagName}\\b[^>]*>`, "gi")) ?? [];
}

function textOf(html: string, tagName: string): string {
  const match = html.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, "i"));
  return (match?.[1] ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function metaContent(html: string, nameOrProperty: string): string {
  for (const tag of tags(html, "meta")) {
    const name = (attr(tag, "name") || attr(tag, "property")).toLowerCase();
    if (name === nameOrProperty.toLowerCase()) return attr(tag, "content");
  }
  return "";
}

function clip(value: string, max = 600): string {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

export async function runSeoAudit(
  rawUrl: string,
  services: string[] = ["SEO técnico"],
): Promise<EngineResult> {
  const url = normalizeUrl(rawUrl);
  const origin = new URL(url).origin;
  const startedAt = nowIso();
  const evidence: EngineEvidence[] = [];
  const findings: EngineFinding[] = [];
  const limitations: string[] = [];
  let ec = 0;
  let fc = 0;

  const addEvidence = (
    source: string,
    resource: string,
    method: string,
    observed: string,
    trusted = false,
  ): string => {
    ec += 1;
    const id = `EV-${String(ec).padStart(3, "0")}`;
    evidence.push({ id, source, resource, method, observed: clip(observed), trusted });
    return id;
  };

  const addFinding = (f: Omit<EngineFinding, "id" | "status">): void => {
    fc += 1;
    findings.push({ ...f, id: `HZ-${String(fc).padStart(3, "0")}`, status: "propuesto" });
  };

  // 1. Respuesta HTTP y transporte
  const page = await get(url, "text/html,application/xhtml+xml");
  if (page.error || page.status === 0) {
    const evId = addEvidence(
      "Petición HTTP",
      url,
      "fetch GET",
      `Sin respuesta: ${page.error ?? "desconocido"}`,
      true,
    );
    addFinding({
      title: "La web no responde a la petición de auditoría",
      category: "crawling",
      priority: "Alta",
      confidence: "alta",
      description: `No se obtuvo respuesta de ${url}. Detalle: ${page.error ?? "sin detalle"}.`,
      impact: "Sin respuesta no hay auditoría posible: tampoco los buscadores pueden rastrear.",
      recommendation:
        "Comprobar que el dominio resuelve, que el certificado es válido y que no bloquea agentes externos.",
      evidenceIds: [evId],
    });
    return {
      url,
      startedAt,
      finishedAt: nowIso(),
      evidence,
      findings,
      coverage: services.map((service) => ({
        service,
        state: "bloqueo_por_acceso",
        reason: "La web no respondió durante la ejecución",
      })),
      limitations: ["Ejecución interrumpida: el dominio no respondió."],
    };
  }

  const html = page.body;
  const httpEvidence = addEvidence(
    "Petición HTTP",
    page.finalUrl,
    "fetch GET",
    `HTTP ${page.status} en ${page.ms} ms · ${page.headers["content-type"] ?? "sin content-type"} · servidor ${page.headers["server"] ?? "no declarado"}`,
    true,
  );

  if (page.status >= 400) {
    addFinding({
      title: `La página principal devuelve un error HTTP ${page.status}`,
      category: "crawling",
      priority: "Alta",
      confidence: "alta",
      description: `La dirección auditada responde con código ${page.status}.`,
      impact: "Una página de entrada con error no se indexa y pierde todo el tráfico orgánico.",
      recommendation: "Restablecer la respuesta 200 en la página principal antes de cualquier otra acción.",
      evidenceIds: [httpEvidence],
    });
  }

  if (!page.finalUrl.startsWith("https://")) {
    addFinding({
      title: "La web no se sirve sobre conexión segura",
      category: "seo_tecnico",
      priority: "Alta",
      confidence: "alta",
      description: `La respuesta final se entregó en ${page.finalUrl}, sin HTTPS.`,
      impact: "HTTPS es requisito básico de confianza y afecta a la clasificación y a la conversión.",
      recommendation: "Instalar certificado y redirigir todo el tráfico de http a https con 301.",
      evidenceIds: [httpEvidence],
    });
  } else if (!page.headers["strict-transport-security"]) {
    addFinding({
      title: "Falta la cabecera de seguridad de transporte (HSTS)",
      category: "seo_tecnico",
      priority: "Baja",
      confidence: "alta",
      description: "La respuesta no incluye Strict-Transport-Security.",
      impact: "Sin HSTS la primera visita puede viajar sin cifrar.",
      recommendation: "Añadir Strict-Transport-Security con una duración mínima de seis meses.",
      evidenceIds: [httpEvidence],
    });
  }

  // 2. Metadatos e indexabilidad
  const title = textOf(html, "title");
  const description = metaContent(html, "description");
  const robotsMeta = metaContent(html, "robots").toLowerCase();
  const canonical = tags(html, "link")
    .filter((tag) => attr(tag, "rel").toLowerCase() === "canonical")
    .map((tag) => attr(tag, "href"));
  const viewport = metaContent(html, "viewport");
  const hreflang = tags(html, "link").filter((tag) =>
    attr(tag, "rel").toLowerCase().includes("alternate") && attr(tag, "hreflang"),
  );
  const lang = attr(html.match(/<html\b[^>]*>/i)?.[0] ?? "", "lang");

  const metaEvidence = addEvidence(
    "HTML de la página",
    page.finalUrl,
    "análisis del marcado",
    `title (${title.length} car.): «${title || "ausente"}» · description (${description.length} car.): «${description || "ausente"}» · robots: ${robotsMeta || "no declarado"} · canonical: ${canonical[0] ?? "ausente"} · lang: ${lang || "ausente"} · viewport: ${viewport || "ausente"} · hreflang: ${hreflang.length}`,
    true,
  );

  if (robotsMeta.includes("noindex")) {
    addFinding({
      title: "La página se declara como no indexable",
      category: "indexacion",
      priority: "Alta",
      confidence: "alta",
      description: `La etiqueta robots contiene «noindex»: ${robotsMeta}.`,
      impact: "Con noindex la página desaparece de los resultados de búsqueda.",
      recommendation: "Retirar noindex salvo que la exclusión sea intencionada y esté documentada.",
      evidenceIds: [metaEvidence],
    });
  }

  if (!title) {
    addFinding({
      title: "La página no tiene título",
      category: "seo_tecnico",
      priority: "Alta",
      confidence: "alta",
      description: "No se encontró la etiqueta <title> o está vacía.",
      impact: "El título es el principal elemento de relevancia y el texto del enlace en resultados.",
      recommendation: "Escribir un título único de 45 a 60 caracteres con la propuesta de valor.",
      evidenceIds: [metaEvidence],
    });
  } else if (title.length < 25 || title.length > 65) {
    addFinding({
      title: `La longitud del título no es adecuada (${title.length} caracteres)`,
      category: "seo_tecnico",
      priority: "Media",
      confidence: "alta",
      description: `Título actual: «${title}».`,
      impact: "Títulos cortos pierden relevancia; los largos se recortan en resultados.",
      recommendation: "Ajustar el título al rango de 45 a 60 caracteres sin repetir la marca.",
      evidenceIds: [metaEvidence],
    });
  }

  if (!description) {
    addFinding({
      title: "Falta la descripción para resultados de búsqueda",
      category: "seo_tecnico",
      priority: "Media",
      confidence: "alta",
      description: "No se encontró meta description.",
      impact: "Sin descripción propia el buscador improvisa el texto y baja la tasa de clic.",
      recommendation: "Redactar una descripción de 120 a 155 caracteres orientada a la acción.",
      evidenceIds: [metaEvidence],
    });
  } else if (description.length < 70 || description.length > 165) {
    addFinding({
      title: `La descripción tiene una longitud poco eficaz (${description.length} caracteres)`,
      category: "seo_tecnico",
      priority: "Baja",
      confidence: "alta",
      description: `Descripción actual: «${description}».`,
      impact: "Descripciones fuera de rango se recortan o aportan poco contexto.",
      recommendation: "Ajustar la descripción a 120–155 caracteres.",
      evidenceIds: [metaEvidence],
    });
  }

  if (canonical.length === 0) {
    addFinding({
      title: "No se declara dirección canónica",
      category: "canonical",
      priority: "Media",
      confidence: "alta",
      description: "No hay etiqueta link rel=canonical en la página.",
      impact: "Sin canónica el buscador puede elegir una variante duplicada como principal.",
      recommendation: "Declarar una canónica absoluta y autorreferente en cada página.",
      evidenceIds: [metaEvidence],
    });
  } else if (canonical.length > 1) {
    addFinding({
      title: "Hay más de una dirección canónica declarada",
      category: "canonical",
      priority: "Alta",
      confidence: "alta",
      description: `Canónicas encontradas: ${canonical.join(" · ")}.`,
      impact: "Señales contradictorias hacen que el buscador ignore ambas.",
      recommendation: "Dejar una única etiqueta canónica por página.",
      evidenceIds: [metaEvidence],
    });
  }

  if (!viewport) {
    addFinding({
      title: "Falta la configuración de visualización en móvil",
      category: "seo_tecnico",
      priority: "Alta",
      confidence: "alta",
      description: "No se encontró meta viewport.",
      impact: "Sin viewport la web no se adapta al móvil, que es el índice principal.",
      recommendation: 'Añadir <meta name="viewport" content="width=device-width, initial-scale=1">.',
      evidenceIds: [metaEvidence],
    });
  }

  if (!lang) {
    addFinding({
      title: "El idioma de la página no está declarado",
      category: "seo_tecnico",
      priority: "Baja",
      confidence: "alta",
      description: "El elemento html no tiene atributo lang.",
      impact: "Afecta a la accesibilidad y a la segmentación por idioma.",
      recommendation: "Declarar el idioma en el elemento html, por ejemplo lang=\"es\".",
      evidenceIds: [metaEvidence],
    });
  }

  // 3. Estructura semántica e imágenes
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi) ?? [];
  const headingLevels = (html.match(/<h([1-6])\b/gi) ?? []).map((tag) => Number(tag.slice(2, 3)));
  const images = tags(html, "img");
  const withoutAlt = images.filter((tag) => !attr(tag, "alt"));
  const structureEvidence = addEvidence(
    "Estructura del documento",
    page.finalUrl,
    "recuento del marcado",
    `H1: ${h1.length} · encabezados totales: ${headingLevels.length} · imágenes: ${images.length} · imágenes sin texto alternativo: ${withoutAlt.length} · primer H1: «${h1[0] ? h1[0].replace(/<[^>]+>/g, " ").trim() : "ninguno"}»`,
    true,
  );

  if (h1.length === 0) {
    addFinding({
      title: "La página no tiene encabezado principal (H1)",
      category: "contenido",
      priority: "Media",
      confidence: "alta",
      description: "No se encontró ningún elemento H1.",
      impact: "El encabezado principal define el tema de la página para buscadores y lectores.",
      recommendation: "Añadir un único H1 descriptivo al principio del contenido.",
      evidenceIds: [structureEvidence],
    });
  } else if (h1.length > 1) {
    addFinding({
      title: `Hay ${h1.length} encabezados principales en la misma página`,
      category: "contenido",
      priority: "Baja",
      confidence: "alta",
      description: "Se encontró más de un H1.",
      impact: "Diluye el tema principal y confunde la jerarquía del contenido.",
      recommendation: "Mantener un solo H1 y convertir el resto en H2 o H3.",
      evidenceIds: [structureEvidence],
    });
  }

  if (images.length > 0 && withoutAlt.length > 0) {
    addFinding({
      title: `${withoutAlt.length} de ${images.length} imágenes sin texto alternativo`,
      category: "contenido",
      priority: withoutAlt.length > images.length / 2 ? "Media" : "Baja",
      confidence: "alta",
      description: "Hay imágenes sin atributo alt.",
      impact: "Se pierde accesibilidad y visibilidad en búsqueda de imágenes.",
      recommendation: "Describir cada imagen con contenido informativo; dejar alt vacío solo en decorativas.",
      evidenceIds: [structureEvidence],
    });
  }

  const textLength = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim().length;
  const words = Math.round(textLength / 6);
  const contentEvidence = addEvidence(
    "Volumen de contenido",
    page.finalUrl,
    "estimación sobre texto visible",
    `Aproximadamente ${words} palabras de texto visible en la página principal.`,
    true,
  );
  if (words < 250) {
    addFinding({
      title: `Contenido escaso en la página principal (~${words} palabras)`,
      category: "contenido",
      priority: "Media",
      confidence: "media",
      description: "El texto visible es reducido para una página de entrada.",
      impact: "Con poco texto la página compite mal y aporta pocas señales temáticas.",
      recommendation: "Ampliar con propuesta de valor, servicios, pruebas y preguntas frecuentes.",
      evidenceIds: [contentEvidence],
    });
    limitations.push("El recuento de palabras es una estimación sobre el HTML inicial, sin ejecutar scripts.");
  }

  // 4. Datos estructurados
  const jsonLdBlocks = [
    ...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
  ].map((match) => match[1] ?? "");
  const schemaTypes: string[] = [];
  let invalidJsonLd = 0;
  for (const block of jsonLdBlocks) {
    try {
      const parsed: unknown = JSON.parse(block);
      const collect = (node: unknown): void => {
        if (Array.isArray(node)) return node.forEach(collect);
        if (node && typeof node === "object") {
          const record = node as Record<string, unknown>;
          const type = record["@type"];
          if (typeof type === "string") schemaTypes.push(type);
          if (Array.isArray(type)) type.forEach((t) => typeof t === "string" && schemaTypes.push(t));
          if (Array.isArray(record["@graph"])) collect(record["@graph"]);
        }
      };
      collect(parsed);
    } catch {
      invalidJsonLd += 1;
    }
  }
  const schemaEvidence = addEvidence(
    "Datos estructurados",
    page.finalUrl,
    "extracción de JSON-LD",
    `Bloques JSON-LD: ${jsonLdBlocks.length} · con error de sintaxis: ${invalidJsonLd} · tipos declarados: ${schemaTypes.join(", ") || "ninguno"}`,
    true,
  );

  if (jsonLdBlocks.length === 0) {
    addFinding({
      title: "La web no publica datos estructurados",
      category: "schema_org",
      priority: "Media",
      confidence: "alta",
      description: "No se encontró ningún bloque JSON-LD en la página.",
      impact: "Sin datos estructurados se pierden resultados enriquecidos y contexto para asistentes de IA.",
      recommendation: "Publicar al menos Organization y WebSite, y el tipo propio del negocio.",
      evidenceIds: [schemaEvidence],
    });
  } else {
    if (invalidJsonLd > 0) {
      addFinding({
        title: `${invalidJsonLd} bloque(s) de datos estructurados con error de sintaxis`,
        category: "schema_org",
        priority: "Alta",
        confidence: "alta",
        description: "Hay JSON-LD que no se puede interpretar.",
        impact: "Un bloque con error se descarta por completo y no genera resultados enriquecidos.",
        recommendation: "Corregir la sintaxis del JSON-LD y validar antes de publicar.",
        evidenceIds: [schemaEvidence],
      });
    }
    const missing = ["Organization", "WebSite"].filter(
      (type) => !schemaTypes.some((t) => t.toLowerCase().includes(type.toLowerCase())),
    );
    if (missing.length) {
      addFinding({
        title: `Faltan entidades básicas en los datos estructurados (${missing.join(", ")})`,
        category: "schema_org",
        priority: "Baja",
        confidence: "alta",
        description: `Tipos presentes: ${schemaTypes.join(", ") || "ninguno"}.`,
        impact: "Sin entidad de marca y de sitio se debilita el reconocimiento por parte de buscadores e IA.",
        recommendation: "Añadir Organization con logo y perfiles, y WebSite con el buscador interno.",
        evidenceIds: [schemaEvidence],
      });
    }
  }

  // 5. Rastreo: robots.txt y sitemap
  const robots = await get(`${origin}/robots.txt`, "text/plain");
  const robotsBody = robots.status === 200 ? robots.body : "";
  const robotsEvidence = addEvidence(
    "robots.txt",
    `${origin}/robots.txt`,
    "fetch GET",
    robots.status === 200
      ? clip(robotsBody, 800)
      : `Sin robots.txt accesible (HTTP ${robots.status || "sin respuesta"}).`,
    true,
  );

  if (robots.status !== 200) {
    addFinding({
      title: "No hay archivo robots.txt accesible",
      category: "robots_txt",
      priority: "Media",
      confidence: "alta",
      description: `La petición a ${origin}/robots.txt devolvió ${robots.status || "sin respuesta"}.`,
      impact: "Sin robots.txt no se orienta el rastreo ni se declara el sitemap.",
      recommendation: "Publicar robots.txt con las reglas mínimas y la línea Sitemap.",
      evidenceIds: [robotsEvidence],
    });
  } else {
    if (/^\s*user-agent:\s*\*\s*$[\s\S]*?^\s*disallow:\s*\/\s*$/im.test(robotsBody)) {
      addFinding({
        title: "robots.txt bloquea el rastreo de todo el sitio",
        category: "robots_txt",
        priority: "Alta",
        confidence: "alta",
        description: "Hay una regla Disallow: / para todos los agentes.",
        impact: "Bloquea la indexación completa del sitio.",
        recommendation: "Retirar el bloqueo global y restringir solo las rutas privadas.",
        evidenceIds: [robotsEvidence],
      });
    }
    if (!/sitemap:/i.test(robotsBody)) {
      addFinding({
        title: "robots.txt no declara el sitemap",
        category: "sitemap",
        priority: "Baja",
        confidence: "alta",
        description: "No hay línea Sitemap en robots.txt.",
        impact: "El descubrimiento de páginas depende solo del enlazado interno.",
        recommendation: "Añadir la línea Sitemap con la dirección absoluta del índice de sitemaps.",
        evidenceIds: [robotsEvidence],
      });
    }
    // AEO/GEO: acceso de agentes de IA
    const aiAgents = ["GPTBot", "ClaudeBot", "OAI-SearchBot", "PerplexityBot", "CCBot", "Google-Extended"];
    const blockedAgents = aiAgents.filter((agent) => {
      const block = robotsBody.match(new RegExp(`user-agent:\\s*${agent}[\\s\\S]*?(?=user-agent:|$)`, "i"));
      return block ? /disallow:\s*\/\s*(\n|$)/i.test(block[0]) : false;
    });
    const aiEvidence = addEvidence(
      "Acceso de agentes de IA",
      `${origin}/robots.txt`,
      "análisis de reglas por agente",
      `Agentes de IA bloqueados: ${blockedAgents.join(", ") || "ninguno"}.`,
      true,
    );
    if (blockedAgents.length) {
      addFinding({
        title: `Agentes de IA bloqueados en robots.txt (${blockedAgents.join(", ")})`,
        category: "aeo_geo_citabilidad",
        priority: "Media",
        confidence: "alta",
        description: "Las reglas impiden el acceso de rastreadores de buscadores y asistentes de IA.",
        impact: "La marca no puede ser citada en respuestas generativas ni en resúmenes de IA.",
        recommendation:
          "Decidir con el cliente qué agentes autorizar; si se busca citabilidad, permitir los de búsqueda.",
        evidenceIds: [aiEvidence],
      });
    }
  }

  const sitemapCandidates = [
    ...(robotsBody.match(/sitemap:\s*(\S+)/gi) ?? []).map((line) => line.split(/:\s*/).slice(1).join(":").trim()),
    `${origin}/sitemap.xml`,
  ];
  const sitemapUrl = sitemapCandidates[0] ?? `${origin}/sitemap.xml`;
  const sitemap = await get(sitemapUrl, "application/xml,text/xml");
  const urlCount = (sitemap.body.match(/<loc>/gi) ?? []).length;
  const sitemapEvidence = addEvidence(
    "Sitemap",
    sitemapUrl,
    "fetch GET",
    sitemap.status === 200
      ? `HTTP 200 · ${urlCount} direcciones declaradas · ${/sitemapindex/i.test(sitemap.body) ? "índice de sitemaps" : "sitemap simple"}`
      : `Sin sitemap accesible (HTTP ${sitemap.status || "sin respuesta"}).`,
    true,
  );
  if (sitemap.status !== 200 || urlCount === 0) {
    addFinding({
      title: "No hay sitemap XML utilizable",
      category: "sitemap",
      priority: "Media",
      confidence: "alta",
      description: `La petición a ${sitemapUrl} devolvió ${sitemap.status || "sin respuesta"} con ${urlCount} direcciones.`,
      impact: "Sin sitemap el descubrimiento de contenido nuevo es más lento e incompleto.",
      recommendation: "Generar un sitemap con las direcciones canónicas indexables y mantenerlo actualizado.",
      evidenceIds: [sitemapEvidence],
    });
  }

  // 6. Rendimiento (métricas públicas de PageSpeed)
  try {
    const psi = await get(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(page.finalUrl)}&strategy=mobile&category=performance`,
      "application/json",
    );
    if (psi.status === 200) {
      const data = JSON.parse(psi.body) as {
        lighthouseResult?: {
          categories?: { performance?: { score?: number } };
          audits?: Record<string, { displayValue?: string; numericValue?: number }>;
        };
      };
      const score = Math.round((data.lighthouseResult?.categories?.performance?.score ?? 0) * 100);
      const audits = data.lighthouseResult?.audits ?? {};
      const lcp = audits["largest-contentful-paint"];
      const cls = audits["cumulative-layout-shift"];
      const tbt = audits["total-blocking-time"];
      const perfEvidence = addEvidence(
        "Google PageSpeed Insights",
        page.finalUrl,
        "medición de laboratorio (móvil)",
        `Puntuación de rendimiento: ${score}/100 · LCP ${lcp?.displayValue ?? "n/d"} · CLS ${cls?.displayValue ?? "n/d"} · bloqueo total ${tbt?.displayValue ?? "n/d"}`,
        false,
      );
      if (score < 50) {
        addFinding({
          title: `Rendimiento móvil muy bajo (${score}/100)`,
          category: "pagespeed",
          priority: "Alta",
          confidence: "alta",
          description: "La medición de laboratorio en móvil está por debajo del umbral aceptable.",
          impact: "La lentitud aumenta el abandono y penaliza la experiencia de página.",
          recommendation: "Optimizar imágenes, diferir scripts no críticos y revisar el servidor.",
          evidenceIds: [perfEvidence],
        });
      } else if (score < 80) {
        addFinding({
          title: `Rendimiento móvil mejorable (${score}/100)`,
          category: "pagespeed",
          priority: "Media",
          confidence: "alta",
          description: "El rendimiento está en rango intermedio.",
          impact: "Hay margen de mejora en velocidad percibida y conversión.",
          recommendation: "Priorizar el recurso del LCP y reducir el trabajo del hilo principal.",
          evidenceIds: [perfEvidence],
        });
      }
      const lcpMs = lcp?.numericValue ?? 0;
      if (lcpMs > 2500) {
        addFinding({
          title: `La carga del contenido principal supera el umbral (${lcp?.displayValue ?? ""})`,
          category: "core_web_vitals",
          priority: lcpMs > 4000 ? "Alta" : "Media",
          confidence: "alta",
          description: "El LCP medido está por encima de 2,5 segundos.",
          impact: "El usuario percibe la página como lenta desde el primer instante.",
          recommendation: "Optimizar la imagen o el texto principal, precargarlo y servirlo comprimido.",
          evidenceIds: [perfEvidence],
        });
      }
      if ((cls?.numericValue ?? 0) > 0.1) {
        addFinding({
          title: `Inestabilidad visual durante la carga (CLS ${cls?.displayValue ?? ""})`,
          category: "core_web_vitals",
          priority: "Media",
          confidence: "alta",
          description: "El desplazamiento acumulado de diseño supera 0,1.",
          impact: "Los elementos se mueven al cargar y provocan clics erróneos.",
          recommendation: "Reservar espacio para imágenes, anuncios y fuentes web.",
          evidenceIds: [perfEvidence],
        });
      }
    } else {
      limitations.push("No se pudieron obtener métricas de rendimiento públicas en esta ejecución.");
    }
  } catch {
    limitations.push("No se pudieron obtener métricas de rendimiento públicas en esta ejecución.");
  }

  // 7. Cobertura por servicio
  const has = (categories: string[]): boolean =>
    findings.some((f) => categories.includes(f.category));
  const coverage: EngineCoverage[] = services.map((service) => {
    if (service === "SEO técnico") {
      return {
        service,
        state: "evidencia_suficiente",
        reason: `Medición directa de respuesta, indexabilidad, estructura, robots y sitemap (${evidence.length} evidencias).`,
      };
    }
    if (service === "AEO/GEO") {
      return {
        service,
        state: robots.status === 200 ? "evidencia_suficiente" : "cobertura_parcial",
        reason:
          robots.status === 200
            ? "Acceso de agentes de IA y datos estructurados comprobados sobre el dominio."
            : "Sin robots.txt no se puede confirmar el acceso de agentes de IA.",
      };
    }
    if (service === "Contenidos") {
      return {
        service,
        state: "cobertura_parcial",
        reason:
          "Analizada solo la página principal; falta muestra de páginas interiores y validación de autoría.",
      };
    }
    if (service === "Analítica") {
      return {
        service,
        state: "bloqueo_por_acceso",
        reason: "Requiere acceso autorizado a Search Console y Analytics del cliente.",
      };
    }
    return {
      service,
      state: "pendiente_justificado",
      reason: "Servicio sin comprobaciones automáticas en esta versión del motor.",
    };
  });

  limitations.push(
    "Solo lectura: no se han realizado cambios en la web del cliente ni comunicaciones externas.",
  );
  limitations.push("Muestra: página principal, robots.txt y sitemap; no es un rastreo completo del sitio.");
  if (!has(["search_console", "ga4"])) {
    limitations.push("Sin accesos de Search Console ni Analytics no hay datos de rendimiento real de búsqueda.");
  }

  return {
    url: page.finalUrl,
    startedAt,
    finishedAt: nowIso(),
    evidence,
    findings,
    coverage,
    limitations,
  };
}
