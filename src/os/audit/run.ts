import { recogerDns } from "./collect/base/dns";
import { recogerHttp } from "./collect/base/http";
import { recogerAnuncios, resolverPagina } from "./collect/tools/adlib";
import { rastrear } from "./collect/tools/crawl";
import { imagenes } from "./collect/web/imagenes";
import { estilos } from "./collect/web/estilos";
import { formulario } from "./collect/web/formulario";
import { accesibilidad } from "./collect/web/accesibilidad";
import { movil } from "./collect/web/movil";
import { confianza } from "./collect/web/confianza";
import { recogerPsi } from "./collect/web/psi";
import type { Añadido } from "./collect/base/runtime";
import { aplicar, cobertura } from "./rules";
import { CLAVES, colectoresDe, funcionesDe, HERRAMIENTAS, type Herramienta } from "./tools";
import type { Auditoria, Señal } from "./types";

/**
 * ORQUESTADOR.
 *
 * La recolección base corre SIEMPRE y una sola vez: DNS, HTTP y la carga de la página
 * con navegador. De ahí salen señales para las tres herramientas a la vez.
 *
 * Después corren los colectores propios de las herramientas que se hayan pedido. Son los
 * caros: la biblioteca de anuncios y el rastreo de varias páginas.
 *
 * Una fuente que falla no desaparece: se apunta en `fuentesNoDisponibles` y sale en la
 * portada del informe. Sin acceso a algo, se dice; no se concluye que no existe.
 */
export async function auditar(
  dominio: string,
  herramientas: Herramienta["clave"][] = CLAVES,
): Promise<Auditoria> {
  const t0 = Date.now();
  const iniciadaEn = new Date().toISOString();
  const limpio = dominio.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const señales: Señal[] = [];
  const fuentesNoDisponibles: { fuente: string; motivo: string }[] = [];
  const pedidos = colectoresDe(herramientas);

  // --- Base: siempre, y una sola vez ---------------------------------------
  const [dns, http] = await Promise.all([
    recogerDns(limpio).catch(() => {
      fuentesNoDisponibles.push({ fuente: "DNS", motivo: "Las consultas han fallado" });
      return [] as Señal[];
    }),
    recogerHttp(limpio),
  ]);
  señales.push(...dns, ...http.señales);

  // Los añadidos de la herramienta de Web corren dentro de la MISMA carga de página.
  // Seis comprobaciones en seis cargas serían dos minutos y seis ocasiones de fallar.
  const añadidos: Añadido[] = pedidos.includes("web")
    ? [imagenes, estilos, formulario, accesibilidad, movil, confianza]
    : [];

  let social: string[] = [];
  {
    try {
      // Importación DINÁMICA a propósito. `playwright-core` falla al cargarse en una
      // función serverless (le falta browsers.json en el paquete trazado), y un fallo de
      // carga de módulo ocurre antes de cualquier try/catch normal. Importándolo solo
      // cuando se va a usar, el fallo se puede capturar.
      const { recogerRuntime } = await import("./collect/base/runtime");
      const rt = await recogerRuntime(http.urlFinal, { añadidos });
      señales.push(...rt.señales);
      fuentesNoDisponibles.push(...rt.fallos);
      social = (rt.señales.find((s) => s.id === "social.perfiles")?.valor as string[] | null) ?? [];
    } catch (e) {
      fuentesNoDisponibles.push({
        fuente: "Navegador",
        motivo: `No se ha podido cargar la página: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
  }

  // --- Propios de cada herramienta -----------------------------------------
  if (pedidos.includes("adlib")) {
    const token = process.env.META_ADLIB_TOKEN;
    if (!token) {
      fuentesNoDisponibles.push({
        fuente: "Meta Ad Library",
        motivo: "Falta META_ADLIB_TOKEN. Sin él no se puede afirmar nada sobre sus anuncios.",
      });
    } else {
      const pagina = resolverPagina(social);
      try {
        const r = await recogerAnuncios(
          pagina ? { token, paginaIds: [pagina] } : { token, terminos: limpio.split(".")[0] },
        );
        señales.push(...r.señales);
        if (!pagina) {
          fuentesNoDisponibles.push({
            fuente: "Meta Ad Library",
            motivo: "La web no enlaza su página de Facebook. Se ha buscado por nombre: puede faltar o sobrar algún anunciante.",
          });
        }
      } catch (e) {
        fuentesNoDisponibles.push({
          fuente: "Meta Ad Library",
          motivo: e instanceof Error ? e.message : String(e),
        });
      }
    }
  }

  if (pedidos.includes("crawl")) {
    try {
      señales.push(...(await rastrear(http.urlFinal)));
    } catch (e) {
      fuentesNoDisponibles.push({
        fuente: "Rastreo de varias páginas",
        motivo: e instanceof Error ? e.message : String(e),
      });
    }
  }

  if (pedidos.includes("web")) {
    if (!process.env.PAGESPEED_API_KEY) {
      fuentesNoDisponibles.push({
        fuente: "PageSpeed y CrUX",
        motivo: "Falta PAGESPEED_API_KEY. Sin ella no hay datos de velocidad de usuarios reales, que es el dato más sólido del informe. La clave es gratis y se saca en cinco minutos en Google Cloud.",
      });
    } else {
      try {
        señales.push(...(await recogerPsi(http.urlFinal)));
      } catch (e) {
        fuentesNoDisponibles.push({
          fuente: "PageSpeed y CrUX",
          motivo: e instanceof Error ? e.message : String(e),
        });
      }
    }
  }

  // --- Solo lo que cubren las herramientas pedidas --------------------------
  const funciones = funcionesDe(herramientas);
  const todas = herramientas.length === CLAVES.length;
  // Con las tres se devuelve todo. Con una sola, solo su ámbito: un informe de SEO no
  // debe mezclar hallazgos de paid, aunque la base los haya recogido de paso.
  const propias = todas ? señales : señales.filter((s) => funciones.includes(s.funcion));

  return {
    dominio: limpio,
    urlFinal: http.urlFinal,
    iniciadaEn,
    duracionMs: Date.now() - t0,
    señales: propias,
    hallazgos: aplicar(señales).filter((h) => todas || funciones.includes(h.funcion)),
    cobertura: cobertura(propias),
    fuentesNoDisponibles,
  };
}

export { HERRAMIENTAS, CLAVES };
