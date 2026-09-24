import {
  SEO_AUDIT_STATES,
  SeoAuditGovernanceError,
  type GovernanceIssue,
  type SeoAuditState,
} from "./types";

export const SEO_AUDIT_STATE_DESCRIPTIONS: Record<SeoAuditState, string> = {
  borrador: "Información incompleta o en preparación; no habilita trabajo.",
  pendiente_autorizacion: "Listo para revisión del Project Manager, sin autorización efectiva.",
  autorizado:
    "El PM autorizó recoger evidencias dentro del alcance; no autoriza cambios, publicación ni gasto adicional.",
  en_cola:
    "Encargo autorizado esperando turno interno; sin ejecución externa activada por esta entrega.",
  en_ejecucion: "Agentes VALME recogen evidencias dentro del alcance y límites autorizados.",
  bloqueado: "No queda trabajo ejecutable por accesos, alcance o evidencia insuficiente.",
  control_calidad: "Control de calidad revisa cobertura, fuentes, evidencias y limitaciones.",
  devuelto: "Control de calidad o PM devuelve el encargo con motivo estructurado.",
  validado: "Auditoría validada; permite preparar un plan, pero no aprobarlo ni ejecutarlo.",
  cancelado: "Encargo cerrado sin continuar; no habilita acciones posteriores.",
};

export const ALLOWED_TRANSITIONS: Record<SeoAuditState, SeoAuditState[]> = {
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

export function listSeoAuditStates() {
  return SEO_AUDIT_STATES.map((state) => ({
    state,
    description: SEO_AUDIT_STATE_DESCRIPTIONS[state],
    allowedNextStates: ALLOWED_TRANSITIONS[state],
  }));
}

export function assertAllowedTransition(from: SeoAuditState, to: SeoAuditState): void {
  if (ALLOWED_TRANSITIONS[from].includes(to)) return;
  const issue: GovernanceIssue = {
    code: "invalid_state_transition",
    field: "state",
    message: `Transicion no permitida de ${from} a ${to}.`,
    details: { from, to, allowedNextStates: ALLOWED_TRANSITIONS[from] },
  };
  throw new SeoAuditGovernanceError("invalid_state_transition", issue.message, [issue]);
}
