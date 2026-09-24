export const SEO_AUDIT_VERSION = "2026-09-24.1";

export const AGENT_PODS = [
  "Onboarding y accesos",
  "Auditoría SEO",
  "Estrategia y planificación",
  "SEO técnico",
  "Contenidos",
  "AEO/GEO y citabilidad",
  "Analítica e informes",
  "Control de calidad",
] as const;

export type AgentPod = (typeof AGENT_PODS)[number];

export const SEO_AUDIT_STATES = [
  "borrador",
  "pendiente_autorizacion",
  "autorizado",
  "en_cola",
  "en_ejecucion",
  "bloqueado",
  "control_calidad",
  "devuelto",
  "validado",
  "cancelado",
] as const;

export type SeoAuditState = (typeof SEO_AUDIT_STATES)[number];

export const FINDING_CATEGORIES = [
  "auditoria_completa",
  "crawling",
  "seo_tecnico",
  "indexacion",
  "sitemap",
  "robots_txt",
  "canonical",
  "redirects",
  "core_web_vitals",
  "pagespeed",
  "crux",
  "search_console",
  "ga4",
  "schema_org",
  "contenido",
  "eeat",
  "keyword_research",
  "semantic_clustering",
  "aeo_geo_citabilidad",
] as const;

export type FindingCategory = (typeof FINDING_CATEGORIES)[number];

export const RESULT_TYPES = ["medicion", "observacion", "estimacion", "heuristica"] as const;
export type ResultType = (typeof RESULT_TYPES)[number];

export const CONFIDENCE_LEVELS = ["baja", "media", "alta"] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

export const PRIORITIES = ["baja", "media", "alta", "critica"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const FINDING_STATES = [
  "propuesto",
  "bloqueado",
  "devuelto",
  "validado",
  "descartado",
] as const;
export type FindingState = (typeof FINDING_STATES)[number];

export const COVERAGE_STATES = [
  "evidencia_suficiente",
  "cobertura_parcial",
  "bloqueo_por_acceso",
  "ausencia_declarada",
  "pendiente_justificado",
] as const;
export type CoverageState = (typeof COVERAGE_STATES)[number];

export const CAPABILITY_TYPES = [
  "conocimiento",
  "script",
  "api",
  "extension",
  "reporting",
] as const;
export type CapabilityType = (typeof CAPABILITY_TYPES)[number];

export const CAPABILITY_MODES = ["lectura", "generacion_propuesta", "escritura_externa"] as const;
export type CapabilityMode = (typeof CAPABILITY_MODES)[number];

export const INTEGRATION_STATES = [
  "referencia",
  "disenada",
  "disponible",
  "bloqueada",
  "descartada",
] as const;
export type IntegrationState = (typeof INTEGRATION_STATES)[number];

export const ACCESS_STATES = [
  "no_solicitado",
  "pendiente",
  "validado",
  "insuficiente",
  "caducado",
] as const;
export type AccessState = (typeof ACCESS_STATES)[number];

export interface AuditLimits {
  maxPages: number;
  maxDurationMinutes: number;
  maxCostAmount: number;
  currency: string;
}

export interface AuthorizedScope {
  includedDomains: string[];
  includedPaths: string[];
  excludedPaths: string[];
  allowedReadActions: string[];
  explicitlyExcludedActions: string[];
}

export interface AuditAccessRef {
  accessId: string;
  kind: string;
  requiredForCapabilityIds: string[];
  state: AccessState;
}

export interface SeoAuditContract {
  auditId: string;
  tenantId: string;
  clientId: string;
  projectId: string;
  serviceIds: string[];
  requestedBy: string;
  authorizedBy?: string | undefined;
  authorizationRef?: string | undefined;
  primaryDomain: string;
  seedUrls: string[];
  markets: string[];
  languages: string[];
  authorizedScope: AuthorizedScope;
  requestedCapabilityIds: string[];
  accessRefs: AuditAccessRef[];
  limits: AuditLimits;
  createdAt: string;
  version: string;
  state: SeoAuditState;
}

export interface Evidence {
  evidenceId: string;
  auditId: string;
  urlOrResource: string;
  source: string;
  observedAt: string;
  collectionMethod: string;
  observedSnippetOrData: string;
  artifactRef?: string | undefined;
  integrityHash?: string | undefined;
  containsExternalUntrustedData: boolean;
  measurementPeriod?:
    | {
        from: string;
        to: string;
      }
    | undefined;
  device?: "mobile" | "desktop" | "both" | "unknown" | undefined;
  market?: string | undefined;
  language?: string | undefined;
  level?: "url" | "origin" | undefined;
}

export interface Finding {
  findingId: string;
  auditId: string;
  category: FindingCategory;
  relatedServiceId: string;
  title: string;
  description: string;
  priority: Priority;
  impact: string;
  recommendation: string;
  state: FindingState;
  resultType: ResultType;
  confidence: ConfidenceLevel;
  sources: string[];
  evidenceIds: string[];
  observedAt: string;
  responsible: {
    kind: "agent" | "tool";
    id: string;
    name: string;
  };
  dependsOnAccessId?: string | undefined;
  limitations: string[];
  requiresHumanApproval: boolean;
}

export interface CoverageDeclaration {
  serviceId: string;
  state: Extract<CoverageState, "ausencia_declarada" | "pendiente_justificado">;
  reason: string;
  declaredBy: string;
  declaredAt: string;
}

export interface ServiceCoverage {
  serviceId: string;
  state: CoverageState;
  findingIds: string[];
  evidenceIds: string[];
  reason?: string | undefined;
}

export interface SeoCapability {
  id: string;
  name: string;
  description: string;
  responsiblePod: AgentPod;
  claudeSeoComponent: string;
  type: CapabilityType;
  requiredData: string[];
  requiredAccess: string[];
  mode: CapabilityMode;
  possibleAutomation: string;
  requiresHumanApproval: boolean;
  dependencies: string[];
  expectedOutput: string;
  integrationState: IntegrationState;
  risksAndLimitations: string[];
  relatedServiceIds: string[];
}

export interface GovernanceIssue {
  code: string;
  message: string;
  field?: string | undefined;
  details?: unknown;
}

export class SeoAuditGovernanceError extends Error {
  readonly code: string;
  readonly issues: GovernanceIssue[];

  constructor(code: string, message: string, issues: GovernanceIssue[] = []) {
    super(message);
    this.name = "SeoAuditGovernanceError";
    this.code = code;
    this.issues = issues.length ? issues : [{ code, message }];
  }
}
