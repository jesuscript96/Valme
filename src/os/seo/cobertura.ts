import type {
  Auditoria, Declaracion, EstadoCobertura, Evidencia, Hallazgo, Servicio,
} from "./tipos";

export type CoberturaServicio = {
  servicio: Servicio;
  estado: EstadoCobertura;
  hallazgos: number;
  evidencias: number;
  motivo: string | null;
};

/**
 * Cobertura por servicio contratado. Un servicio está cubierto si tiene hallazgos con
 * evidencia registrada, o si alguien ha declarado por escrito por qué no los tiene.
 * No haber podido mirar algo no es lo mismo que que esté bien.
 */
export function calcularCobertura(
  auditoria: Auditoria,
  hallazgos: Hallazgo[],
  evidencias: Evidencia[],
  declaraciones: Declaracion[],
): CoberturaServicio[] {
  const registradas = new Set(
    evidencias.filter((e) => e.auditoriaId === auditoria.id).map((e) => e.id),
  );
  return auditoria.servicios.map((servicio) => {
    const propios = hallazgos.filter(
      (h) => h.auditoriaId === auditoria.id && h.servicio === servicio,
    );
    const conEvidencia = propios.filter(
      (h) =>
        h.decision.valor !== "descartar" &&
        h.evidencias.length > 0 &&
        h.evidencias.every((id) => registradas.has(id)),
    );
    const evidenciasUsadas = new Set(conEvidencia.flatMap((h) => h.evidencias)).size;
    const declaracion = declaraciones.find(
      (d) => d.auditoriaId === auditoria.id && d.servicio === servicio,
    );

    if (conEvidencia.length > 0) {
      const parcial = conEvidencia.length < propios.filter((h) => h.decision.valor !== "descartar").length;
      return {
        servicio,
        estado: parcial ? "cobertura_parcial" : "evidencia_suficiente",
        hallazgos: conEvidencia.length,
        evidencias: evidenciasUsadas,
        motivo: parcial ? "Hay hallazgos del servicio sin evidencia registrada." : null,
      };
    }
    if (declaracion) {
      return {
        servicio,
        estado: declaracion.estado,
        hallazgos: 0,
        evidencias: 0,
        motivo: declaracion.motivo,
      };
    }
    return {
      servicio,
      estado: "pendiente_justificado",
      hallazgos: 0,
      evidencias: 0,
      motivo: null,
    };
  });
}

/** Servicios que impiden pasar a calidad o validar: sin evidencia y sin declaración. */
export function serviciosSinCubrir(cobertura: CoberturaServicio[]): Servicio[] {
  return cobertura.filter((c) => c.estado === "pendiente_justificado" && !c.motivo).map((c) => c.servicio);
}
