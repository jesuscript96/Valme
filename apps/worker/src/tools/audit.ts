import { z } from "zod";
import { auditar } from "@valme/os/audit/run";
import { CLAVES } from "@valme/os/audit/tools";
import type { Hallazgo } from "@valme/os/audit/types";
import { crearGuarda } from "../urlGuard";
import { defineTool, recortar } from "./types";

/**
 * AUDITORÍA SIN ACCESOS como herramienta del agente.
 *
 * Es el mismo motor que `npm run audit` y que la pantalla de Diagnóstico: determinista,
 * sin IA. El agente recibe los hallazgos ya redactados y el informe entero se guarda en
 * `audits` para poder enseñarlo después.
 */

const DOMINIO = /^([a-z0-9-]+\.)+[a-z]{2,}$/i;

export function resumir(hallazgos: Hallazgo[]) {
  const r = { p0: 0, p1: 0, p2: 0, p3: 0, positivos: 0 };
  for (const h of hallazgos) {
    if (h.positivo) r.positivos++;
    else r[h.gravedad]++;
  }
  return r;
}

export const auditarDominio = defineTool({
  name: "auditar_dominio",
  description:
    "Audita un dominio con el motor de Valme (DNS, cabeceras, la web cargada en un navegador " +
    "real, y según las herramientas pedidas: Paid, SEO y Web). Tarda entre 20 y 60 s. " +
    "Devuelve los hallazgos con su gravedad (p0 roto hoy … p3 menor) y las fuentes que no " +
    "se han podido consultar. Lo que no se ha podido comprobar no es un hallazgo.",
  input: z.object({
    dominio: z.string().describe("Dominio sin protocolo, por ejemplo ejemplo.es"),
    herramientas: z
      .array(z.enum(CLAVES as [string, ...string[]]))
      .optional()
      .describe(`Cuáles correr. Por defecto todas: ${CLAVES.join(", ")}.`),
  }),
  async run({ dominio, herramientas }, ctx) {
    const limpio = dominio.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!DOMINIO.test(limpio)) throw new Error(`«${dominio}» no es un dominio válido.`);
    // Parte de la auditoría (DNS, HTTP) sale del propio worker, no del sandbox.
    await crearGuarda().comprobar(`https://${limpio}`);

    const pedidas = (herramientas?.length ? herramientas : CLAVES) as typeof CLAVES;
    const a = await auditar(limpio, pedidas);
    const resumen = resumir(a.hallazgos);

    const auditId = await ctx.saveAudit({
      dominio: limpio,
      herramientas: pedidas,
      duracionMs: a.duracionMs,
      senales: a.señales.length,
      resumen,
      hallazgos: a.hallazgos,
      fuentesNoDisponibles: a.fuentesNoDisponibles,
    });

    const orden = { p0: 0, p1: 1, p2: 2, p3: 3 } as const;
    const lineas = [...a.hallazgos]
      .sort((x, y) => Number(Boolean(x.positivo)) - Number(Boolean(y.positivo)) || orden[x.gravedad] - orden[y.gravedad])
      .map((h) =>
        h.positivo
          ? `[+] ${h.titulo}`
          : `[${h.gravedad}] ${h.titulo}\n    Situación: ${h.situacion}\n    Consecuencia: ${h.consecuencia}\n    Solución: ${h.solucion}`,
      );

    const fuentes = a.fuentesNoDisponibles.map((f) => `- ${f.fuente}: ${f.motivo}`).join("\n");
    return recortar(
      `Auditoría de ${limpio} (${pedidas.join(", ")}) guardada con id ${auditId}. ` +
        `${a.señales.length} señales en ${Math.round(a.duracionMs / 1000)} s. ` +
        `Resumen: p0=${resumen.p0} p1=${resumen.p1} p2=${resumen.p2} p3=${resumen.p3} positivos=${resumen.positivos}.\n\n` +
        lineas.join("\n") +
        (fuentes ? `\n\nNo se ha podido comprobar:\n${fuentes}` : ""),
    );
  },
});
