/**
 * GENERADORES GEO · llms.txt y datos estructurados.
 *
 * Son las dos correcciones que más piden los hallazgos de visibilidad en asistentes:
 * decirles qué hace la empresa y qué páginas citar (llms.txt), y declarar quién es con
 * datos estructurados (JSON-LD). Puros: corren en el navegador para ver el resultado al
 * escribir. Solo usan lo que se les da; no inventan datos que la empresa no ha declarado.
 */

export type PaginaClave = { titulo: string; url: string; descripcion: string };

export type DatosEmpresa = {
  nombre: string;
  url: string;
  descripcion: string;
  servicios: string[];
  zona: string;
  telefono: string;
  email: string;
  logo: string;
  perfiles: string[];
  paginas: PaginaClave[];
};

const limpio = (s: string) => s.trim().replace(/\s+/g, " ");
const lista = (xs: string[]) => xs.map(limpio).filter(Boolean);

/** Página clave por línea: «Título | URL | descripción». */
export function leerPaginas(texto: string): PaginaClave[] {
  return texto
    .split(/\r?\n/)
    .map((l) => l.split("|").map((x) => x.trim()))
    .filter(([t, u]) => t && u)
    .map(([titulo = "", url = "", descripcion = ""]) => ({ titulo, url, descripcion }));
}

export const escribirPaginas = (ps: PaginaClave[]) =>
  ps.map((p) => [p.titulo, p.url, p.descripcion].filter(Boolean).join(" | ")).join("\n");

/** llms.txt según la propuesta de llmstxt.org: título, resumen, detalles y listas de enlaces. */
export function generarLlmsTxt(d: DatosEmpresa): string {
  const partes: string[] = [`# ${limpio(d.nombre) || "Nombre de la empresa"}`, ""];
  if (limpio(d.descripcion)) partes.push(`> ${limpio(d.descripcion)}`, "");
  const detalles = [
    lista(d.servicios).length ? `Servicios: ${lista(d.servicios).join(", ")}.` : "",
    limpio(d.zona) ? `Zona de trabajo: ${limpio(d.zona)}.` : "",
    limpio(d.url) ? `Web: ${limpio(d.url)}` : "",
  ].filter(Boolean);
  if (detalles.length) partes.push(...detalles, "");
  const paginas = d.paginas.filter((p) => p.titulo && p.url);
  if (paginas.length) {
    partes.push("## Páginas principales", "");
    for (const p of paginas) partes.push(`- [${limpio(p.titulo)}](${p.url})${p.descripcion ? `: ${limpio(p.descripcion)}` : ""}`);
    partes.push("");
  }
  const contacto = [limpio(d.telefono) ? `Teléfono: ${limpio(d.telefono)}` : "", limpio(d.email) ? `Email: ${limpio(d.email)}` : ""].filter(Boolean);
  if (contacto.length || lista(d.perfiles).length) {
    partes.push("## Contacto", "");
    for (const c of contacto) partes.push(`- ${c}`);
    for (const p of lista(d.perfiles)) partes.push(`- ${p}`);
    partes.push("");
  }
  return partes.join("\n").trimEnd() + "\n";
}

export type TipoEntidad = "Organization" | "LocalBusiness" | "ProfessionalService";

/**
 * JSON-LD con @graph: la entidad de la empresa, el sitio web y un Service por servicio.
 * Solo incluye los campos que tienen valor.
 */
export function generarJsonLd(d: DatosEmpresa, tipo: TipoEntidad): string {
  const base = limpio(d.url).replace(/\/+$/, "");
  const idEmpresa = `${base}/#organizacion`;
  const empresa: Record<string, unknown> = {
    "@type": tipo,
    "@id": idEmpresa,
    name: limpio(d.nombre),
    url: base ? `${base}/` : undefined,
    description: limpio(d.descripcion) || undefined,
    logo: limpio(d.logo) || undefined,
    telephone: limpio(d.telefono) || undefined,
    email: limpio(d.email) || undefined,
    areaServed: limpio(d.zona) || undefined,
    sameAs: lista(d.perfiles).length ? lista(d.perfiles) : undefined,
  };
  const grafo: Record<string, unknown>[] = [
    empresa,
    { "@type": "WebSite", "@id": `${base}/#web`, url: base ? `${base}/` : undefined, name: limpio(d.nombre), publisher: { "@id": idEmpresa }, inLanguage: "es" },
    ...lista(d.servicios).map((s) => ({ "@type": "Service", name: s, provider: { "@id": idEmpresa }, areaServed: limpio(d.zona) || undefined })),
  ];
  const sinVacios = (o: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== ""));
  return `<script type="application/ld+json">\n${JSON.stringify({ "@context": "https://schema.org", "@graph": grafo.map(sinVacios) }, null, 2)}\n</script>\n`;
}

/** Qué falta para que el resultado sea útil. Se enseña al lado del generador. */
export function avisos(d: DatosEmpresa): string[] {
  const out: string[] = [];
  if (!limpio(d.nombre)) out.push("Falta el nombre de la empresa.");
  if (!/^https?:\/\//.test(limpio(d.url))) out.push("La web debe empezar por https://.");
  if (!limpio(d.descripcion)) out.push("Sin descripción: es lo primero que lee un asistente.");
  if (!d.paginas.some((p) => p.titulo && p.url)) out.push("Sin páginas clave: el llms.txt no dirá qué citar.");
  if (!lista(d.servicios).length) out.push("Sin servicios declarados.");
  return out;
}
