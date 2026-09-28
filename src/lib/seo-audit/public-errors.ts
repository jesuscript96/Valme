// Mensajes que el panel puede mostrar tal cual: explican que hacer sin revelar si un
// registro ajeno existe ni detalles internos de la base de datos. Cualquier otro error
// llega al navegador como un mensaje generico.
export const SEO_AUDIT_PUBLIC_ERRORS = {
  projectNotVisible: "El proyecto no existe o no está asignado a tu sesión.",
  auditNotVisible: "La auditoría no existe o no está asignada a tu sesión.",
  clientNotVisible: "El cliente no existe o no está asignado a tu sesión.",
  transitionConflict: "La auditoría cambió mientras se procesaba la operación. Recarga y revísala.",
  transitionNeedsReason: "Esta transición requiere motivo.",
  authorizationNeedsRef: "La autorización requiere una referencia.",
  auditArchived: "La auditoría está archivada: restáurala antes de modificarla.",
  clientArchived: "El cliente está archivado: restáuralo antes de registrar o modificar trabajo.",
  archiveNotAllowed: "Solo un manager del cliente puede archivar o restaurar.",
  createClientNotAllowed:
    "Solo un super admin o un Project Manager con cartera completa puede dar de alta clientes.",
  tenantRequired: "Elige la organización en la que se da de alta el cliente.",
  clientExists: "Ya existe un cliente con ese nombre.",
  invalidDomain:
    "El dominio no es válido. Escribe solo el dominio, por ejemplo valmesolutions.com.",
  findingNotVisible: "El hallazgo no existe o no está asignado a tu sesión.",
  reviewNotAllowed: "Solo un manager del cliente decide sobre los hallazgos.",
  auditLocked:
    "La auditoría está cerrada, archivada o su cliente está archivado: no admite cambios en hallazgos ni evidencias.",
  importInvalid: "La revisión externa no es coherente: revisa sus evidencias y hallazgos.",
  actionNotVisible: "La tarea no existe o no está asignada a tu sesión.",
  actionClosed: "La tarea está cerrada y ya no admite cambios.",
  ownerMustBePm: "El responsable de una tarea debe ser un Project Manager activo.",
  conclusionRequired: "Para cerrar una investigación escribe su conclusión.",
  discardNeedsReason: "Para descartar un hallazgo escribe el motivo en la nota.",
} as const;

const PUBLIC_MESSAGES = new Set<string>(Object.values(SEO_AUDIT_PUBLIC_ERRORS));

export const SEO_AUDIT_GENERIC_ERROR = "La operación remota no se pudo completar.";

export function publicSeoAuditErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  return PUBLIC_MESSAGES.has(message) ? message : SEO_AUDIT_GENERIC_ERROR;
}
