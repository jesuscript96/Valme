import { recogerDns } from "./collect/dns";
import { recogerHttp } from "./collect/http";
import { recogerRuntime } from "./collect/runtime";
import { recogerAnuncios, resolverPagina } from "./collect/adlib";
import { aplicar, cobertura } from "./rules";
import type { Auditoria, Señal } from "./types";

/**
 * ORQUESTADOR.
 *
 * Todo lo que no necesita credenciales corre siempre y en paralelo donde se puede.
 * Lo que sí las necesita se salta y se APUNTA por qué: una fuente caída aparece en la
 * portada del informe, no desaparece en silencio.
 */
export async function auditar(dominio: string): Promise<Auditoria> {
  const t0 = Date.now();
  const iniciadaEn = new Date().toISOString();
  const limpio = dominio.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const señales: Señal[] = [];
  const fuentesNoDisponibles: { fuente: string; motivo: string }[] = [];

  // DNS y HTTP no dependen el uno del otro.
  const [dns, http] = await Promise.all([
    recogerDns(limpio).catch(() => {
      fuentesNoDisponibles.push({ fuente: "DNS", motivo: "Las consultas han fallado" });
      return [] as Señal[];
    }),
    recogerHttp(limpio),
  ]);
  señales.push(...dns, ...http.señales);

  // El runtime necesita la URL final, así que va después.
  let social: string[] = [];
  try {
    const rt = await recogerRuntime(http.urlFinal);
    señales.push(...rt.señales);
    social = (rt.señales.find((s) => s.id === "social.perfiles")?.valor as string[] | null) ?? [];
  } catch (e) {
    fuentesNoDisponibles.push({
      fuente: "Navegador",
      motivo: `No se ha podido cargar la página: ${e instanceof Error ? e.message : String(e)}`,
    });
  }

  // Ad Library: oficial y gratis, pero necesita token de una app de Meta.
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

  if (!process.env.PAGESPEED_API_KEY) {
    fuentesNoDisponibles.push({
      fuente: "PageSpeed y CrUX",
      motivo: "Falta PAGESPEED_API_KEY. Sin clave, la cuota anónima compartida está siempre agotada.",
    });
  }

  return {
    dominio: limpio,
    urlFinal: http.urlFinal,
    iniciadaEn,
    duracionMs: Date.now() - t0,
    señales,
    hallazgos: aplicar(señales),
    cobertura: cobertura(señales),
    fuentesNoDisponibles,
  };
}
