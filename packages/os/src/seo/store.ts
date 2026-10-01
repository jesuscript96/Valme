import "server-only";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as seed from "@valme/os/repo/seed.data";
import type { ClienteNuevo, Datos, Proyecto } from "./tipos";

/**
 * ALMACÉN DEL MÓDULO SEO.
 *
 * En memoria, como el resto del área mientras no haya base de datos. En local además se
 * guarda en `.valme-data/seo.json` para que lo que se prueba no se pierda al reiniciar
 * el servidor. En Vercel (sistema de ficheros de solo lectura) se queda solo en memoria.
 *
 * Cuando exista la base de datos, este fichero es el único que cambia: `leer()` y
 * `guardar()` pasan a consultas. Las herramientas trabajan sobre `Datos` y no saben de dónde vienen.
 */

const FICHERO = join(process.cwd(), ".valme-data", "seo.json");
const PERSISTE = !process.env.VERCEL && process.env.NODE_ENV !== "production";

function inicial(): Datos {
  const proyectos: Proyecto[] = seed.clients
    .filter((c) => c.websiteUrl)
    .map((c) => ({
      id: `pr_${c.slug}`,
      clientId: c.id,
      nombre: "Web principal",
      dominio: new URL(c.websiteUrl as string).hostname,
      creadoEn: c.createdAt,
    }));
  return {
    proyectos,
    auditorias: [],
    evidencias: [],
    hallazgos: [],
    tareas: [],
    eventos: [],
    declaraciones: [],
    mediciones: [],
    altas: [],
    encargos: [],
    informes: [],
    actividad: [],
    clientesNuevos: [],
  };
}

/**
 * Registra en los datos de Valme (en memoria) un cliente creado desde el onboarding, con
 * su Brand Kit en borrador, que el módulo de Cuentas necesita para abrir la ficha.
 */
export function inyectarCliente(c: ClienteNuevo): void {
  if (!seed.clients.some((x) => x.id === c.id)) {
    seed.clients.push({ id: c.id, slug: c.slug, name: c.name, websiteUrl: c.websiteUrl, status: "onboarding", createdAt: c.createdAt });
  }
  if (!seed.brandKits.some((k) => k.clientId === c.id)) {
    seed.brandKits.push({
      id: `bk_${c.slug}`, clientId: c.id, status: "draft", version: 1,
      identity: {
        logoLightPath: null, logoDarkPath: null,
        colors: { primary: "#14161A", secondary: "#F4F2EE", accent: "#FF3B21", background: "#FFFFFF", textPrimary: "#14161A" },
        fonts: { heading: "Inter", body: "Inter" }, colorScheme: "light", borderRadius: "4px", photoStyle: null, imageModel: null,
      },
      voice: { tone: [], address: "tu", wordsToUse: [], wordsToAvoid: [], sampleCopy: [] },
      business: { valueProposition: null, services: [], differentiators: [], proof: [], geo: null },
      personas: [],
      legal: { privacyUrl: null, controller: null, consentText: null, capiLegalBasis: "consent" },
      origins: {}, approvedAt: null, approvedBy: null,
    });
  }
}

// En globalThis para sobrevivir a la recarga en caliente de `next dev`.
const g = globalThis as unknown as { __valmeSeo?: Datos };

export function leer(): Datos {
  if (g.__valmeSeo) {
    // Datos de una versión anterior (en memoria o en el fichero): se completan las colecciones nuevas.
    for (const [k, v] of Object.entries(inicial())) {
      const clave = k as keyof Datos;
      if (!Array.isArray(g.__valmeSeo[clave])) (g.__valmeSeo as Record<string, unknown>)[clave] = v;
    }
    g.__valmeSeo.clientesNuevos.forEach(inyectarCliente);
    return g.__valmeSeo;
  }
  if (PERSISTE && existsSync(FICHERO)) {
    try {
      g.__valmeSeo = { ...inicial(), ...(JSON.parse(readFileSync(FICHERO, "utf8")) as Datos) };
      return g.__valmeSeo;
    } catch {
      // Un fichero corrupto no tumba el área: se empieza de cero y se sobrescribe.
    }
  }
  g.__valmeSeo = inicial();
  return g.__valmeSeo;
}

export function guardar(): void {
  if (!PERSISTE || !g.__valmeSeo) return;
  mkdirSync(join(process.cwd(), ".valme-data"), { recursive: true });
  writeFileSync(FICHERO, JSON.stringify(g.__valmeSeo, null, 2));
}
