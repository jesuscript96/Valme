import "server-only";
import { abierta, vencida } from "./index";
import { soloLectura } from "./estados";
import { colaSupervision } from "./operacion/panel";
import { leer } from "./store";

/**
 * Las cifras de SEO que se ven en Inicio, fuera del módulo. Recibe los clientes ya
 * autorizados (de `listVisibleClients()` o de `forClient()`): aquí no se comprueba acceso.
 * Cuenta igual que las insignias del menú del módulo, para que los números coincidan.
 */
export function resumenSeo(clientes: Set<string>) {
  const d = leer();
  const auditorias = d.auditorias.filter((a) => clientes.has(a.clientId));
  const ids = new Set(auditorias.map((a) => a.id));
  const tareas = d.tareas.filter((t) => ids.has(t.auditoriaId));

  return {
    auditoriasEnCurso: auditorias.filter((a) => !soloLectura(a)).length,
    porDecidir: d.hallazgos.filter((h) => ids.has(h.auditoriaId) && h.decision.valor === "pendiente").length,
    tareasAbiertas: tareas.filter(abierta).length,
    tareasVencidas: tareas.filter(vencida).length,
    cola: colaSupervision(d, clientes),
  };
}
