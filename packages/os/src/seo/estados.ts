import type { Auditoria, EstadoAuditoria } from "./tipos";

/** Qué significa cada estado. Se enseña en la cabecera de la auditoría. */
export const DESCRIPCION: Record<EstadoAuditoria, string> = {
  borrador: "Información incompleta o en preparación; no habilita trabajo.",
  pendiente_autorizacion: "Listo para revisión del PM, sin autorización efectiva.",
  autorizado:
    "El PM autorizó recoger evidencias dentro del alcance; no autoriza cambios, publicación ni gasto adicional.",
  en_cola: "Encargo autorizado esperando turno.",
  en_ejecucion: "Se recogen evidencias dentro del alcance y los límites autorizados.",
  bloqueado: "No queda trabajo ejecutable por accesos, alcance o evidencia insuficiente.",
  control_calidad: "Se revisan cobertura, fuentes, evidencias y limitaciones.",
  devuelto: "Calidad o el PM devuelve el encargo con un motivo.",
  validado: "Auditoría validada: permite preparar un plan, no aprobarlo ni ejecutarlo.",
  cancelado: "Encargo cerrado sin continuar.",
};

export const TRANSICIONES: Record<EstadoAuditoria, EstadoAuditoria[]> = {
  borrador: ["pendiente_autorizacion", "cancelado"],
  pendiente_autorizacion: ["autorizado", "devuelto", "cancelado"],
  autorizado: ["en_cola", "en_ejecucion", "bloqueado", "cancelado"],
  en_cola: ["en_ejecucion", "bloqueado", "cancelado"],
  en_ejecucion: ["bloqueado", "control_calidad", "cancelado"],
  bloqueado: ["en_ejecucion", "devuelto", "cancelado"],
  control_calidad: ["devuelto", "validado", "cancelado"],
  devuelto: ["borrador", "pendiente_autorizacion", "cancelado"],
  validado: [],
  cancelado: [],
};

/** El paso natural desde cada estado: el botón principal de la cabecera. */
export const SIGUIENTE: Partial<Record<EstadoAuditoria, { a: EstadoAuditoria; label: string }>> = {
  borrador: { a: "pendiente_autorizacion", label: "Solicitar autorización" },
  pendiente_autorizacion: { a: "autorizado", label: "Autorizar alcance" },
  autorizado: { a: "en_cola", label: "Añadir a la cola" },
  en_cola: { a: "en_ejecucion", label: "Iniciar auditoría" },
  en_ejecucion: { a: "control_calidad", label: "Enviar a calidad" },
  bloqueado: { a: "en_ejecucion", label: "Reanudar trabajo" },
  control_calidad: { a: "validado", label: "Validar auditoría" },
  devuelto: { a: "pendiente_autorizacion", label: "Solicitar reautorización" },
};

/** Texto del botón para las transiciones secundarias. */
export const ACCION_LABEL: Partial<Record<EstadoAuditoria, string>> = {
  devuelto: "Devolver",
  bloqueado: "Bloquear",
  cancelado: "Cancelar auditoría",
  borrador: "Volver a borrador",
  en_ejecucion: "Iniciar ahora",
};

/** Estas transiciones exigen escribir por qué. */
export const PIDE_MOTIVO: EstadoAuditoria[] = ["bloqueado", "devuelto", "cancelado"];

/** Autorizar y validar son decisiones del PM, no de cualquiera del equipo. */
export const SOLO_PM: EstadoAuditoria[] = ["autorizado", "validado"];

export const puedePasar = (de: EstadoAuditoria, a: EstadoAuditoria) =>
  TRANSICIONES[de].includes(a);

/** Validada, cancelada o archivada: se lee, no se toca. */
export const soloLectura = (a: Pick<Auditoria, "estado" | "archivadaEn">) =>
  Boolean(a.archivadaEn) || a.estado === "validado" || a.estado === "cancelado";

/**
 * El seguimiento (decidir hallazgos y mover tareas) sigue abierto tras validar: validar
 * es justo lo que da paso al plan. Solo lo cierra cancelar o archivar.
 */
export const seguimientoAbierto = (a: Pick<Auditoria, "estado" | "archivadaEn">) =>
  !a.archivadaEn && a.estado !== "cancelado";

/** Volver atrás invalida la autorización: hay que autorizar otra vez. */
export const BORRA_AUTORIZACION: EstadoAuditoria[] = ["borrador", "pendiente_autorizacion"];
