import { Badge, type Tone } from "@valme/os/ui/primitives";
import {
  COBERTURA_LABEL, DECISION_LABEL, ESTADO_LABEL, ESTADO_TAREA_LABEL, PRIORIDAD_LABEL,
  type Decision, type EstadoAuditoria, type EstadoCobertura, type EstadoTarea, type Prioridad,
} from "../tipos";

const TONO_ESTADO: Record<EstadoAuditoria, Tone> = {
  borrador: "neutral",
  pendiente_autorizacion: "warn",
  autorizado: "info",
  en_cola: "info",
  en_ejecucion: "info",
  bloqueado: "accent",
  control_calidad: "warn",
  devuelto: "warn",
  validado: "ok",
  cancelado: "neutral",
};
export const EstadoBadge = ({ e }: { e: EstadoAuditoria }) => (
  <Badge tone={TONO_ESTADO[e]}>{ESTADO_LABEL[e]}</Badge>
);

const TONO_PRIORIDAD: Record<Prioridad, Tone> = { critica: "accent", alta: "accent", media: "warn", baja: "neutral" };
export const PrioridadBadge = ({ p }: { p: Prioridad }) => (
  <Badge tone={TONO_PRIORIDAD[p]}>{PRIORIDAD_LABEL[p]}</Badge>
);

const TONO_DECISION: Record<Decision, Tone> = { pendiente: "neutral", priorizar: "ok", investigar: "info", descartar: "neutral" };
export const DecisionBadge = ({ d }: { d: Decision }) => (
  <Badge tone={TONO_DECISION[d]}>{DECISION_LABEL[d]}</Badge>
);

const TONO_TAREA: Record<EstadoTarea, Tone> = { pendiente: "neutral", en_curso: "warn", hecha: "ok", cancelada: "neutral" };
export const TareaBadge = ({ e, vencida }: { e: EstadoTarea; vencida?: boolean }) =>
  vencida ? <Badge tone="accent">Vencida</Badge> : <Badge tone={TONO_TAREA[e]}>{ESTADO_TAREA_LABEL[e]}</Badge>;

const TONO_COBERTURA: Record<EstadoCobertura, Tone> = {
  evidencia_suficiente: "ok",
  cobertura_parcial: "warn",
  ausencia_declarada: "info",
  pendiente_justificado: "neutral",
};
export const CoberturaBadge = ({ e }: { e: EstadoCobertura }) => (
  <Badge tone={TONO_COBERTURA[e]}>{COBERTURA_LABEL[e]}</Badge>
);

/**
 * Color de un estado por su texto, como en Search OS: bloqueos y errores en rojo, lo
 * pendiente en ámbar, lo aprobado en verde y el resto neutro.
 */
export function tonoDe(texto: string): Tone {
  if (/bloque|error|vencid|insuficiente|caducado/i.test(texto)) return "accent";
  if (/riesgo|pendiente|revisión|devuelt|cambios|onboarding/i.test(texto)) return "warn";
  if (/automático|completad|aprobad|validad|autorizad|activo|cumplido|listo|hecha/i.test(texto)) return "ok";
  return "neutral";
}
export const Estado = ({ t }: { t: string }) => <Badge tone={tonoDe(t)}>{t}</Badge>;

export const fmtDia = (iso: string | null) =>
  iso
    ? new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString("es-ES", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "Sin fecha";
