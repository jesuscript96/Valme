import type { Tone } from "./primitives";
import { Badge } from "./primitives";
import type {
  AdFormat, Angle, BrandKitStatus, ClientStatus, CreativeStatus, EmailStatus, MetaCta,
} from "@/os/repo/types";

export const ANGLE_LABEL: Record<Angle, string> = {
  pain: "Dolor",
  benefit: "Beneficio",
  social_proof: "Prueba social",
  urgency: "Urgencia",
  objection: "Objeción",
};

export const CTA_LABEL: Record<MetaCta, string> = {
  LEARN_MORE: "Más información",
  SIGN_UP: "Registrarte",
  GET_QUOTE: "Pedir presupuesto",
  CONTACT_US: "Contactarnos",
  BOOK_NOW: "Reservar",
  DOWNLOAD: "Descargar",
};

export const FORMAT_LABEL: Record<AdFormat, string> = {
  "3:4": "3:4 · máster",
  "4:5": "4:5 · feed",
  "1:1": "1:1 · feed",
  "9:16": "9:16 · stories",
};

const KIT: Record<BrandKitStatus, [string, Tone]> = {
  draft: ["Borrador", "neutral"],
  extracting: ["Extrayendo…", "info"],
  extracted: ["Por revisar", "warn"],
  approved: ["Aprobado", "ok"],
};
export const KitStatus = ({ s }: { s: BrandKitStatus }) => (
  <Badge tone={KIT[s][1]}>{KIT[s][0]}</Badge>
);

const CLIENT: Record<ClientStatus, [string, Tone]> = {
  onboarding: ["En alta", "info"],
  active: ["Activo", "ok"],
  paused: ["Pausado", "neutral"],
};
export const ClientStatusBadge = ({ s }: { s: ClientStatus }) => (
  <Badge tone={CLIENT[s][1]}>{CLIENT[s][0]}</Badge>
);

const CREATIVE: Record<CreativeStatus, [string, Tone]> = {
  generating: ["Generando…", "info"],
  generated: ["Generado", "neutral"],
  reviewed: ["Revisado", "warn"],
  approved: ["Aprobado", "ok"],
  discarded: ["Descartado", "neutral"],
};
export const CreativeStatusBadge = ({ s }: { s: CreativeStatus }) => (
  <Badge tone={CREATIVE[s][1]}>{CREATIVE[s][0]}</Badge>
);

const EMAIL: Record<EmailStatus, [string, Tone]> = {
  queued: ["En cola", "neutral"],
  sent: ["Enviado", "info"],
  delivered: ["Entregado", "ok"],
  bounced: ["Rebotado", "accent"],
  complained: ["Spam", "accent"],
  failed: ["Fallido", "accent"],
};
export const EmailStatusBadge = ({ s }: { s: EmailStatus }) => (
  <Badge tone={EMAIL[s][1]}>{EMAIL[s][0]}</Badge>
);

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("es-ES", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });

export const fmtUsd = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "USD" }).format(n);

export const fmtEurCents = (cents: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(cents / 100);
