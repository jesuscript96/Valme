import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database, Json } from "@/integrations/supabase/seo-audit-staging.types";
import { assertAllowedTransition } from "./states";
import { SEO_AUDIT_STATES, SEO_AUDIT_VERSION } from "./types";
import { auditLimitsSchema, authorizedScopeSchema } from "./schemas";
import { SEO_AUDIT_PUBLIC_ERRORS } from "./public-errors";

type Tables = Database["public"]["Tables"];
type AuditRow = Tables["seo_audits"]["Row"];
export type SeoAuditDatabase = Database;
type AuditInsert = Tables["seo_audits"]["Insert"];
type AuditUpdate = Tables["seo_audits"]["Update"];
type ClientSummary = Pick<
  Tables["clients"]["Row"],
  "id" | "nombre" | "sector" | "tenant_id" | "archived_at"
>;
type ClientInsert = Tables["clients"]["Insert"];
type ProjectSummary = Pick<
  Tables["projects"]["Row"],
  "id" | "client_id" | "nombre" | "primary_domain"
>;
type ProjectInsert = Tables["projects"]["Insert"];
type ProjectScope = Pick<
  Tables["projects"]["Row"],
  "id" | "tenant_id" | "client_id" | "primary_domain"
>;
type TenantRole = Database["public"]["Enums"]["tenant_role"];
export type TenantSummary = { id: string; nombre: string; role: TenantRole | null };
type OwnAccess = Pick<Tables["user_access"]["Row"], "role" | "status" | "full_portfolio">;
type ArchivePatch = { archived_at: string | null; archived_by: string | null };
type FindingRow = Tables["seo_audit_findings"]["Row"];
type FindingInsert = Tables["seo_audit_findings"]["Insert"];
type EvidenceInsert = Tables["seo_audit_evidence"]["Insert"];
export type FindingSummary = Pick<
  FindingRow,
  | "id"
  | "audit_id"
  | "category"
  | "related_service_id"
  | "title"
  | "description"
  | "priority"
  | "impact"
  | "recommendation"
  | "state"
  | "confidence"
  | "sources"
  | "observed_at"
  | "responsible_name"
  | "limitations"
  | "review_decision"
  | "review_note"
  | "reviewed_by"
  | "reviewed_at"
  | "created_at"
>;
export type EvidenceSummary = Pick<
  Tables["seo_audit_evidence"]["Row"],
  | "id"
  | "audit_id"
  | "url_or_resource"
  | "source"
  | "observed_at"
  | "collection_method"
  | "observed_data"
  | "contains_external_untrusted_data"
>;
export type FindingEvidenceLink = Pick<
  Tables["seo_finding_evidence"]["Row"],
  "audit_id" | "finding_id" | "evidence_id"
>;
export type PersonSummary = Pick<
  Tables["user_access"]["Row"],
  "user_id" | "email" | "full_name" | "role" | "status"
>;
export type AgentSummary = Pick<
  Tables["agents"]["Row"],
  "id" | "nombre" | "especialidad" | "disponibilidad"
>;
export type ActionSummary = Tables["seo_finding_actions"]["Row"];
type ActionInsert = Tables["seo_finding_actions"]["Insert"];
type ActionUpdate = Tables["seo_finding_actions"]["Update"];
type ReviewPatch = { review_decision: ReviewDecision; review_note: string | null };

export const FINDING_REVIEW_DECISIONS = [
  "pendiente",
  "priorizar",
  "investigar",
  "descartar",
] as const;
export type ReviewDecision = (typeof FINDING_REVIEW_DECISIONS)[number];
// Catálogo de 0005 (seo_findings_category_valid).
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

const nonEmptyString = z.string().trim().min(1);

export const createSeoAuditDraftInputSchema = z
  .object({
    projectId: z.uuid(),
    serviceIds: z.array(nonEmptyString).min(1),
    primaryDomain: nonEmptyString.max(253),
    seedUrls: z.array(z.url()).min(1),
    markets: z.array(nonEmptyString).min(1),
    languages: z.array(nonEmptyString).min(1),
    authorizedScope: authorizedScopeSchema,
    requestedCapabilityIds: z.array(nonEmptyString).min(1),
    limits: auditLimitsSchema,
  })
  .strict();

export const transitionSeoAuditInputSchema = z
  .object({
    auditId: z.uuid(),
    nextState: z.enum(SEO_AUDIT_STATES),
    reason: nonEmptyString.max(1000).optional(),
    authorizationRef: nonEmptyString.max(500).optional(),
  })
  .strict();

export const createSeoClientInputSchema = z
  .object({
    tenantId: z.uuid().optional(),
    nombre: nonEmptyString.max(120),
    sector: nonEmptyString.max(80).optional(),
    projectName: nonEmptyString.max(120),
    primaryDomain: nonEmptyString.max(253),
  })
  .strict();

export const setSeoClientArchivedInputSchema = z
  .object({ clientId: z.uuid(), archived: z.boolean() })
  .strict();

export const setSeoAuditArchivedInputSchema = z
  .object({ auditId: z.uuid(), archived: z.boolean() })
  .strict();

const importedEvidenceSchema = z
  .object({
    key: nonEmptyString.max(200),
    url: z.url().max(2000),
    source: nonEmptyString.max(200),
    collectionMethod: nonEmptyString.max(300),
    observedAt: z.iso.datetime({ offset: true }),
    observedData: nonEmptyString.max(4000),
  })
  .strict();

const importedFindingSchema = z
  .object({
    title: nonEmptyString.max(200),
    description: nonEmptyString.max(4000),
    impact: nonEmptyString.max(1000),
    recommendation: nonEmptyString.max(4000),
    category: z.enum(FINDING_CATEGORIES),
    serviceId: nonEmptyString.max(80),
    priority: z.enum(["baja", "media", "alta", "critica"]),
    confidence: z.enum(["baja", "media", "alta"]),
    resultType: z.enum(["medicion", "observacion", "estimacion", "heuristica"]),
    sources: z.array(z.url().max(2000)).min(1).max(20),
    evidenceKeys: z.array(nonEmptyString.max(200)).max(50),
    limitations: z.array(nonEmptyString.max(500)).max(10),
  })
  .strict();

// Revisión externa (por ejemplo, el piloto de VALME) cargada en una auditoría real.
export const importSeoAuditReviewInputSchema = z
  .object({
    auditId: z.uuid(),
    reviewer: z.object({ id: nonEmptyString.max(80), name: nonEmptyString.max(120) }).strict(),
    evidence: z.array(importedEvidenceSchema).max(50),
    findings: z.array(importedFindingSchema).min(1).max(50),
  })
  .strict();

export const reviewSeoFindingInputSchema = z
  .object({
    findingId: z.uuid(),
    decision: z.enum(FINDING_REVIEW_DECISIONS),
    note: z.string().trim().max(3000).optional(),
  })
  .strict();

export type ImportSeoAuditReviewInput = z.infer<typeof importSeoAuditReviewInputSchema>;
export type ReviewSeoFindingInput = z.infer<typeof reviewSeoFindingInputSchema>;

export const FINDING_ACTION_KINDS = ["investigacion", "accion"] as const;
export const FINDING_ACTION_STATUSES = ["pendiente", "en_curso", "hecha", "cancelada"] as const;

export const createFindingActionInputSchema = z
  .object({
    findingId: z.uuid(),
    kind: z.enum(FINDING_ACTION_KINDS),
    title: nonEmptyString.max(200),
    detail: nonEmptyString.max(2000),
    doneCriteria: nonEmptyString.max(1000).optional(),
    ownerUserId: z.uuid(),
    agentId: z.uuid().optional(),
    dueDate: z.iso.date().optional(),
  })
  .strict();

export const updateFindingActionInputSchema = z
  .object({
    actionId: z.uuid(),
    status: z.enum(FINDING_ACTION_STATUSES),
    conclusion: nonEmptyString.max(3000).optional(),
    outcome: z.enum(["priorizar", "descartar"]).optional(),
  })
  .strict();

export type CreateFindingActionInput = z.infer<typeof createFindingActionInputSchema>;
export type UpdateFindingActionInput = z.infer<typeof updateFindingActionInputSchema>;
export type CreateSeoAuditDraftInput = z.infer<typeof createSeoAuditDraftInputSchema>;
export type TransitionSeoAuditInput = z.infer<typeof transitionSeoAuditInputSchema>;
export type CreateSeoClientInput = z.infer<typeof createSeoClientInputSchema>;
export type SetSeoClientArchivedInput = z.infer<typeof setSeoClientArchivedInputSchema>;
export type SetSeoAuditArchivedInput = z.infer<typeof setSeoAuditArchivedInputSchema>;

export interface SeoAuditStore {
  listAudits(): Promise<AuditRow[]>;
  listClients(): Promise<ClientSummary[]>;
  listProjects(): Promise<ProjectSummary[]>;
  listTenants(): Promise<TenantSummary[]>;
  findOwnAccess(userId: string): Promise<OwnAccess | null>;
  findClient(clientId: string): Promise<ClientSummary | null>;
  findProject(projectId: string): Promise<ProjectScope | null>;
  insertClient(client: ClientInsert): Promise<void>;
  insertProject(project: ProjectInsert): Promise<ProjectSummary>;
  insertAudit(audit: AuditInsert): Promise<AuditRow>;
  findAudit(auditId: string): Promise<AuditRow | null>;
  updateAudit(
    auditId: string,
    expectedState: AuditRow["state"],
    patch: AuditUpdate,
  ): Promise<AuditRow | null>;
  updateClientArchive(clientId: string, patch: ArchivePatch): Promise<ClientSummary | null>;
  updateAuditArchive(auditId: string, patch: ArchivePatch): Promise<AuditRow | null>;
  listFindings(): Promise<FindingSummary[]>;
  listEvidence(): Promise<EvidenceSummary[]>;
  listFindingEvidence(): Promise<FindingEvidenceLink[]>;
  listPeople(): Promise<PersonSummary[]>;
  findFinding(findingId: string): Promise<FindingSummary | null>;
  insertEvidence(rows: EvidenceInsert[]): Promise<Array<{ id: string; url_or_resource: string }>>;
  insertFindings(rows: FindingInsert[]): Promise<Array<{ id: string; title: string }>>;
  linkFindingEvidence(rows: Tables["seo_finding_evidence"]["Insert"][]): Promise<void>;
  updateFindingReview(findingId: string, patch: ReviewPatch): Promise<FindingSummary | null>;
  listActions(): Promise<ActionSummary[]>;
  listAgents(): Promise<AgentSummary[]>;
  findAction(actionId: string): Promise<ActionSummary | null>;
  insertAction(action: ActionInsert): Promise<ActionSummary>;
  updateAction(actionId: string, patch: ActionUpdate): Promise<ActionSummary | null>;
}

export class SeoAuditRemoteDisabledError extends Error {
  readonly code = "remote-not-enabled";

  constructor() {
    super("La persistencia remota de auditorias no esta habilitada.");
    this.name = "SeoAuditRemoteDisabledError";
  }
}

export class SeoAuditRepositoryError extends Error {
  constructor(
    readonly code:
      | "project-not-visible"
      | "audit-not-visible"
      | "client-not-visible"
      | "transition-conflict"
      | "archived"
      | "not-allowed"
      | "invalid-input"
      | "finding-not-visible"
      | "locked"
      | "action-not-visible",
    message: string,
  ) {
    super(message);
    this.name = "SeoAuditRepositoryError";
  }
}

export function assertSeoAuditRemoteEnabled(
  env: Readonly<Record<string, string | undefined>> = process.env,
): void {
  if (!isSeoAuditRemoteEnabled(env)) {
    throw new SeoAuditRemoteDisabledError();
  }
}

export function isSeoAuditRemoteEnabled(
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  if (
    env["SEO_AUDIT_REMOTE_ENABLED"] !== "true" ||
    env["SEO_AUDIT_REMOTE_ENVIRONMENT"] !== "staging"
  ) {
    return false;
  }

  const projectRef = env["SEO_AUDIT_REMOTE_PROJECT_REF"];
  const supabaseUrl = env["SUPABASE_URL"];
  if (!projectRef || !supabaseUrl) return false;

  try {
    return new URL(supabaseUrl).hostname === `${projectRef}.supabase.co`;
  } catch {
    return false;
  }
}

/** Acepta "dominio.com" o una URL completa y devuelve el host en minúsculas. */
export function normalizePrimaryDomain(value: string): string {
  const raw = value.trim().toLowerCase();
  let host = raw;
  try {
    host = new URL(/^[a-z][a-z0-9+.-]*:\/\//.test(raw) ? raw : `https://${raw}`).hostname;
  } catch {
    host = "";
  }
  host = host.replace(/\.$/, "");
  const label = "[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?";
  if (!new RegExp(`^(?:${label}\\.)+[a-z]{2,63}$`).test(host) || host.length > 253) {
    throw new SeoAuditRepositoryError("invalid-input", SEO_AUDIT_PUBLIC_ERRORS.invalidDomain);
  }
  return host;
}

function throwStoreError(operation: string, error: { message: string; code?: string }): never {
  console.error(`[seo-audit-repository] No se pudo ${operation}`, error.code ?? "unknown");
  throw new Error(`No se pudo ${operation}.`);
}

// Errores de los triggers de 0006: 42501 sin permiso o firma ajena; 55000 registro archivado.
function throwArchiveError(operation: string, error: { message: string; code?: string }): never {
  if (error.code === "42501") {
    throw new SeoAuditRepositoryError("not-allowed", SEO_AUDIT_PUBLIC_ERRORS.archiveNotAllowed);
  }
  if (error.code === "55000") {
    throw new SeoAuditRepositoryError("archived", SEO_AUDIT_PUBLIC_ERRORS.clientArchived);
  }
  throwStoreError(operation, error);
}

// Artefactos hijos: 42501 por RLS significa auditoría cerrada, archivada o sin permiso de
// escritura; los triggers de 0007 usan 42501 para "no eres manager".
function throwArtifactError(
  operation: string,
  error: { message: string; code?: string },
  notAllowedMessage: string,
): never {
  if (error.code === "42501") {
    throw new SeoAuditRepositoryError(
      "locked",
      /row-level security/i.test(error.message)
        ? SEO_AUDIT_PUBLIC_ERRORS.auditLocked
        : notAllowedMessage,
    );
  }
  throwStoreError(operation, error);
}

// Tareas: 23514 del trigger (responsable no PM), 55000 (cerrada), 42501 por RLS (auditoría
// cerrada, archivada o sin permiso de escritura).
function throwActionError(operation: string, error: { message: string; code?: string }): never {
  if (error.code === "55000") {
    throw new SeoAuditRepositoryError("locked", SEO_AUDIT_PUBLIC_ERRORS.actionClosed);
  }
  if (error.code === "23514" && /Project Manager/i.test(error.message)) {
    throw new SeoAuditRepositoryError("invalid-input", SEO_AUDIT_PUBLIC_ERRORS.ownerMustBePm);
  }
  throwArtifactError(operation, error, SEO_AUDIT_PUBLIC_ERRORS.auditLocked);
}

const findingColumns =
  "id, audit_id, category, related_service_id, title, description, priority, impact, recommendation, state, confidence, sources, observed_at, responsible_name, limitations, review_decision, review_note, reviewed_by, reviewed_at, created_at";

export function createSupabaseSeoAuditStore(supabase: SupabaseClient<Database>): SeoAuditStore {
  const clientColumns = "id, nombre, sector, tenant_id, archived_at";

  return {
    async listFindings() {
      const { data, error } = await supabase
        .from("seo_audit_findings")
        .select(findingColumns)
        .order("created_at");
      if (error) throwStoreError("listar hallazgos", error);
      return data;
    },

    async listEvidence() {
      const { data, error } = await supabase
        .from("seo_audit_evidence")
        .select(
          "id, audit_id, url_or_resource, source, observed_at, collection_method, observed_data, contains_external_untrusted_data",
        )
        .order("observed_at");
      if (error) throwStoreError("listar evidencias", error);
      return data;
    },

    async listFindingEvidence() {
      const { data, error } = await supabase
        .from("seo_finding_evidence")
        .select("audit_id, finding_id, evidence_id");
      if (error) throwStoreError("listar enlaces de evidencia", error);
      return data;
    },

    async listPeople() {
      // RLS: cada usuario ve su propio acceso; un super admin ve todos.
      const { data, error } = await supabase
        .from("user_access")
        .select("user_id, email, full_name, role, status");
      if (error) throwStoreError("listar personas", error);
      return data;
    },

    async findFinding(findingId) {
      const { data, error } = await supabase
        .from("seo_audit_findings")
        .select(findingColumns)
        .eq("id", findingId)
        .maybeSingle();
      if (error) throwStoreError("leer el hallazgo", error);
      return data;
    },

    async insertEvidence(rows) {
      if (!rows.length) return [];
      const { data, error } = await supabase
        .from("seo_audit_evidence")
        .insert(rows)
        .select("id, url_or_resource");
      if (error)
        throwArtifactError("registrar evidencias", error, SEO_AUDIT_PUBLIC_ERRORS.auditLocked);
      return data;
    },

    async insertFindings(rows) {
      const { data, error } = await supabase
        .from("seo_audit_findings")
        .insert(rows)
        .select("id, title");
      if (error)
        throwArtifactError("registrar hallazgos", error, SEO_AUDIT_PUBLIC_ERRORS.auditLocked);
      return data;
    },

    async linkFindingEvidence(rows) {
      if (!rows.length) return;
      const { error } = await supabase.from("seo_finding_evidence").insert(rows);
      if (error)
        throwArtifactError("enlazar evidencias", error, SEO_AUDIT_PUBLIC_ERRORS.auditLocked);
    },

    async listActions() {
      const { data, error } = await supabase
        .from("seo_finding_actions")
        .select("*")
        .order("created_at");
      if (error) throwStoreError("listar tareas", error);
      return data;
    },

    async listAgents() {
      const { data, error } = await supabase
        .from("agents")
        .select("id, nombre, especialidad, disponibilidad")
        .order("nombre");
      if (error) throwStoreError("listar agentes", error);
      return data;
    },

    async findAction(actionId) {
      const { data, error } = await supabase
        .from("seo_finding_actions")
        .select("*")
        .eq("id", actionId)
        .maybeSingle();
      if (error) throwStoreError("leer la tarea", error);
      return data;
    },

    async insertAction(action) {
      const { data, error } = await supabase
        .from("seo_finding_actions")
        .insert(action)
        .select("*")
        .single();
      if (error) throwActionError("crear la tarea", error);
      return data;
    },

    async updateAction(actionId, patch) {
      const { data, error } = await supabase
        .from("seo_finding_actions")
        .update(patch)
        .eq("id", actionId)
        .select("*")
        .maybeSingle();
      if (error) throwActionError("actualizar la tarea", error);
      return data;
    },

    async updateFindingReview(findingId, patch) {
      const { data, error } = await supabase
        .from("seo_audit_findings")
        .update(patch)
        .eq("id", findingId)
        .select(findingColumns)
        .maybeSingle();
      if (error)
        throwArtifactError("guardar la decision", error, SEO_AUDIT_PUBLIC_ERRORS.reviewNotAllowed);
      return data;
    },

    async listAudits() {
      const { data, error } = await supabase
        .from("seo_audits")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throwStoreError("listar auditorias", error);
      return data;
    },

    async listClients() {
      const { data, error } = await supabase.from("clients").select(clientColumns).order("nombre");
      if (error) throwStoreError("listar clientes", error);
      return data;
    },

    async listProjects() {
      const { data, error } = await supabase
        .from("projects")
        .select("id, client_id, nombre, primary_domain")
        .eq("estado", "activo")
        .order("nombre");
      if (error) throwStoreError("listar proyectos", error);
      return data;
    },

    async listTenants() {
      const { data, error } = await supabase.from("tenants").select("id, nombre").order("nombre");
      if (error) throwStoreError("listar organizaciones", error);
      return Promise.all(
        data.map(async (tenant) => {
          const role = await supabase.rpc("effective_tenant_role", { _tenant_id: tenant.id });
          if (role.error) throwStoreError("resolver el rol en la organizacion", role.error);
          return { id: tenant.id, nombre: tenant.nombre, role: role.data ?? null };
        }),
      );
    },

    async findOwnAccess(userId) {
      const { data, error } = await supabase
        .from("user_access")
        .select("role, status, full_portfolio")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throwStoreError("leer tu acceso", error);
      return data;
    },

    async findClient(clientId) {
      const { data, error } = await supabase
        .from("clients")
        .select(clientColumns)
        .eq("id", clientId)
        .maybeSingle();
      if (error) throwStoreError("leer el cliente", error);
      return data;
    },

    async findProject(projectId) {
      const { data, error } = await supabase
        .from("projects")
        .select("id, tenant_id, client_id, primary_domain")
        .eq("id", projectId)
        .maybeSingle();
      if (error) throwStoreError("resolver el proyecto", error);
      return data;
    },

    async insertClient(client) {
      // Sin RETURNING: la lectura posterior la decide la politica SELECT.
      const { error } = await supabase.from("clients").insert(client);
      if (error) throwStoreError("dar de alta el cliente", error);
    },

    async insertProject(project) {
      const { data, error } = await supabase
        .from("projects")
        .insert(project)
        .select("id, client_id, nombre, primary_domain")
        .single();
      if (error) throwStoreError("crear el proyecto", error);
      return data;
    },

    async insertAudit(audit) {
      const { data, error } = await supabase.from("seo_audits").insert(audit).select("*").single();
      if (error) throwStoreError("crear el borrador", error);
      return data;
    },

    async findAudit(auditId) {
      const { data, error } = await supabase
        .from("seo_audits")
        .select("*")
        .eq("id", auditId)
        .maybeSingle();
      if (error) throwStoreError("leer la auditoria", error);
      return data;
    },

    async updateAudit(auditId, expectedState, patch) {
      const { data, error } = await supabase
        .from("seo_audits")
        .update(patch)
        .eq("id", auditId)
        .eq("state", expectedState)
        .select("*")
        .maybeSingle();
      if (error) throwStoreError("actualizar la auditoria", error);
      return data;
    },

    async updateClientArchive(clientId, patch) {
      const { data, error } = await supabase
        .from("clients")
        .update(patch)
        .eq("id", clientId)
        .select(clientColumns)
        .maybeSingle();
      if (error) throwArchiveError("archivar el cliente", error);
      return data;
    },

    async updateAuditArchive(auditId, patch) {
      const { data, error } = await supabase
        .from("seo_audits")
        .update(patch)
        .eq("id", auditId)
        .select("*")
        .maybeSingle();
      if (error) throwArchiveError("archivar la auditoria", error);
      return data;
    },
  };
}

function archivePatch(archived: boolean, userId: string): ArchivePatch {
  return archived
    ? { archived_at: new Date().toISOString(), archived_by: userId }
    : { archived_at: null, archived_by: null };
}

export function createSeoAuditServerRepository(store: SeoAuditStore, userId: string) {
  async function assertClientActive(clientId: string) {
    const client = await store.findClient(clientId);
    if (client?.archived_at) {
      throw new SeoAuditRepositoryError("archived", SEO_AUDIT_PUBLIC_ERRORS.clientArchived);
    }
  }

  return Object.freeze({
    list: () => store.listAudits(),

    async workspace() {
      const [
        audits,
        clients,
        projects,
        tenants,
        findings,
        evidence,
        links,
        people,
        actions,
        agents,
      ] = await Promise.all([
        store.listAudits(),
        store.listClients(),
        store.listProjects(),
        store.listTenants(),
        store.listFindings(),
        store.listEvidence(),
        store.listFindingEvidence(),
        store.listPeople(),
        store.listActions(),
        store.listAgents(),
      ]);
      return {
        audits,
        clients,
        projects,
        tenants,
        findings,
        evidence,
        links,
        people,
        actions,
        agents,
      };
    },

    // Carga una revisión externa: evidencias, hallazgos y sus enlaces. Idempotente por título
    // (hallazgos) y por URL + fecha de observación (evidencias) para poder reintentar.
    async importReview(input: ImportSeoAuditReviewInput) {
      const audit = await store.findAudit(input.auditId);
      if (!audit) {
        throw new SeoAuditRepositoryError(
          "audit-not-visible",
          SEO_AUDIT_PUBLIC_ERRORS.auditNotVisible,
        );
      }
      if (audit.archived_at || ["validado", "cancelado"].includes(audit.state)) {
        throw new SeoAuditRepositoryError("locked", SEO_AUDIT_PUBLIC_ERRORS.auditLocked);
      }
      const keys = new Set(input.evidence.map((item) => item.key));
      if (
        keys.size !== input.evidence.length ||
        input.findings.some((finding) => finding.evidenceKeys.some((key) => !keys.has(key)))
      ) {
        throw new SeoAuditRepositoryError("invalid-input", SEO_AUDIT_PUBLIC_ERRORS.importInvalid);
      }

      const [existingFindings, existingEvidence, existingLinks] = await Promise.all([
        store.listFindings(),
        store.listEvidence(),
        store.listFindingEvidence(),
      ]);
      const evidenceIdentity = (url: string, observedAt: string) =>
        `${url}|${new Date(observedAt).toISOString()}`;
      const evidenceIds = new Map<string, string>();
      for (const row of existingEvidence.filter((item) => item.audit_id === audit.id)) {
        evidenceIds.set(evidenceIdentity(row.url_or_resource, row.observed_at), row.id);
      }
      const newEvidence = input.evidence.filter(
        (item) => !evidenceIds.has(evidenceIdentity(item.url, item.observedAt)),
      );
      const insertedEvidence = await store.insertEvidence(
        newEvidence.map((item) => ({
          tenant_id: audit.tenant_id,
          audit_id: audit.id,
          url_or_resource: item.url,
          source: item.source,
          observed_at: item.observedAt,
          collection_method: item.collectionMethod,
          observed_data: item.observedData,
          contains_external_untrusted_data: true,
          level: "url",
          created_by: userId,
        })),
      );
      for (const row of insertedEvidence) {
        const item = newEvidence.find((candidate) => candidate.url === row.url_or_resource);
        if (item) evidenceIds.set(evidenceIdentity(item.url, item.observedAt), row.id);
      }
      const evidenceIdByKey = new Map(
        input.evidence.map((item) => [
          item.key,
          evidenceIds.get(evidenceIdentity(item.url, item.observedAt)),
        ]),
      );

      const titleOf = (title: string) => title.trim().toLowerCase();
      const findingIds = new Map(
        existingFindings
          .filter((item) => item.audit_id === audit.id)
          .map((item) => [titleOf(item.title), item.id]),
      );
      const newFindings = input.findings.filter((item) => !findingIds.has(titleOf(item.title)));
      const observedAt = input.evidence[0]?.observedAt ?? new Date().toISOString();
      if (newFindings.length) {
        const inserted = await store.insertFindings(
          newFindings.map((item) => ({
            tenant_id: audit.tenant_id,
            audit_id: audit.id,
            category: item.category,
            related_service_id: item.serviceId,
            title: item.title,
            description: item.description,
            priority: item.priority,
            impact: item.impact,
            recommendation: item.recommendation,
            result_type: item.resultType,
            confidence: item.confidence,
            sources: item.sources,
            observed_at: observedAt,
            responsible_kind: "tool",
            responsible_id: input.reviewer.id,
            responsible_name: input.reviewer.name,
            limitations: item.limitations,
            created_by: userId,
          })),
        );
        for (const row of inserted) findingIds.set(titleOf(row.title), row.id);
      }

      const linked = new Set(
        existingLinks
          .filter((item) => item.audit_id === audit.id)
          .map((item) => `${item.finding_id}|${item.evidence_id}`),
      );
      const links = input.findings.flatMap((finding) => {
        const findingId = findingIds.get(titleOf(finding.title));
        return finding.evidenceKeys
          .map((key) => evidenceIdByKey.get(key))
          .filter((evidenceId): evidenceId is string => Boolean(findingId && evidenceId))
          .filter((evidenceId) => !linked.has(`${findingId}|${evidenceId}`))
          .map((evidenceId) => ({
            tenant_id: audit.tenant_id,
            audit_id: audit.id,
            finding_id: findingId as string,
            evidence_id: evidenceId,
            linked_by: userId,
          }));
      });
      await store.linkFindingEvidence(links);

      return {
        evidence: insertedEvidence.length,
        findings: newFindings.length,
        links: links.length,
        skippedFindings: input.findings.length - newFindings.length,
      };
    },

    async createAction(input: CreateFindingActionInput) {
      const finding = await store.findFinding(input.findingId);
      if (!finding) {
        throw new SeoAuditRepositoryError(
          "finding-not-visible",
          SEO_AUDIT_PUBLIC_ERRORS.findingNotVisible,
        );
      }
      const audit = await store.findAudit(finding.audit_id);
      if (!audit) {
        throw new SeoAuditRepositoryError(
          "audit-not-visible",
          SEO_AUDIT_PUBLIC_ERRORS.auditNotVisible,
        );
      }
      return store.insertAction({
        tenant_id: audit.tenant_id,
        audit_id: audit.id,
        finding_id: finding.id,
        kind: input.kind,
        title: input.title,
        detail: input.detail,
        done_criteria: input.doneCriteria ?? null,
        owner_user_id: input.ownerUserId,
        agent_id: input.agentId ?? null,
        due_date: input.dueDate ?? null,
        created_by: userId,
      });
    },

    // Cerrar una investigación con resultado decide también sobre el hallazgo; la decisión va
    // primero para que un colaborador sin rol de manager no deje la tarea cerrada a medias.
    async updateAction(input: UpdateFindingActionInput) {
      const action = await store.findAction(input.actionId);
      if (!action) {
        throw new SeoAuditRepositoryError(
          "action-not-visible",
          SEO_AUDIT_PUBLIC_ERRORS.actionNotVisible,
        );
      }
      if (action.status === "hecha" || action.status === "cancelada") {
        throw new SeoAuditRepositoryError("locked", SEO_AUDIT_PUBLIC_ERRORS.actionClosed);
      }
      const closing = input.status === "hecha";
      if (closing && action.kind === "investigacion" && !input.conclusion) {
        throw new SeoAuditRepositoryError(
          "invalid-input",
          SEO_AUDIT_PUBLIC_ERRORS.conclusionRequired,
        );
      }
      const outcome = closing && action.kind === "investigacion" ? (input.outcome ?? null) : null;
      if (outcome) {
        await this.reviewFinding({
          findingId: action.finding_id,
          decision: outcome,
          note: input.conclusion,
        });
      }
      const conclusion = closing ? (input.conclusion ?? "Hecho.") : (input.conclusion ?? null);
      const updated = await store.updateAction(input.actionId, {
        status: input.status,
        conclusion,
        outcome,
      });
      if (!updated) {
        throw new SeoAuditRepositoryError("locked", SEO_AUDIT_PUBLIC_ERRORS.auditLocked);
      }
      return updated;
    },

    async reviewFinding(input: ReviewSeoFindingInput) {
      const finding = await store.findFinding(input.findingId);
      if (!finding) {
        throw new SeoAuditRepositoryError(
          "finding-not-visible",
          SEO_AUDIT_PUBLIC_ERRORS.findingNotVisible,
        );
      }
      const note = input.note?.trim() || null;
      if (input.decision === "descartar" && !note) {
        throw new SeoAuditRepositoryError(
          "invalid-input",
          SEO_AUDIT_PUBLIC_ERRORS.discardNeedsReason,
        );
      }
      const updated = await store.updateFindingReview(input.findingId, {
        review_decision: input.decision,
        review_note: note,
      });
      // Sin fila: RLS no deja escribir (auditoría cerrada o archivada).
      if (!updated) {
        throw new SeoAuditRepositoryError("locked", SEO_AUDIT_PUBLIC_ERRORS.auditLocked);
      }
      return updated;
    },

    async createDraft(input: CreateSeoAuditDraftInput): Promise<AuditRow> {
      const project = await store.findProject(input.projectId);
      if (!project) {
        throw new SeoAuditRepositoryError(
          "project-not-visible",
          SEO_AUDIT_PUBLIC_ERRORS.projectNotVisible,
        );
      }
      await assertClientActive(project.client_id);

      return store.insertAudit({
        tenant_id: project.tenant_id,
        client_id: project.client_id,
        project_id: project.id,
        requested_by: userId,
        service_ids: input.serviceIds,
        primary_domain: input.primaryDomain || project.primary_domain,
        seed_urls: input.seedUrls,
        markets: input.markets,
        languages: input.languages,
        authorized_scope: input.authorizedScope as NonNullable<Json>,
        requested_capability_ids: input.requestedCapabilityIds,
        max_pages: input.limits.maxPages,
        max_duration_minutes: input.limits.maxDurationMinutes,
        max_cost_amount: input.limits.maxCostAmount,
        currency: input.limits.currency.toUpperCase(),
        contract_version: SEO_AUDIT_VERSION,
        state: "borrador",
      });
    },

    async transition(input: TransitionSeoAuditInput): Promise<AuditRow> {
      const current = await store.findAudit(input.auditId);
      if (!current) {
        throw new SeoAuditRepositoryError(
          "audit-not-visible",
          SEO_AUDIT_PUBLIC_ERRORS.auditNotVisible,
        );
      }
      if (current.archived_at) {
        throw new SeoAuditRepositoryError("archived", SEO_AUDIT_PUBLIC_ERRORS.auditArchived);
      }

      assertAllowedTransition(current.state, input.nextState);

      const requiresReason = ["bloqueado", "devuelto", "cancelado"].includes(input.nextState);
      if (requiresReason && !input.reason) {
        throw new SeoAuditRepositoryError(
          "transition-conflict",
          SEO_AUDIT_PUBLIC_ERRORS.transitionNeedsReason,
        );
      }

      const patch: AuditUpdate = {
        state: input.nextState,
        transition_reason: input.reason ?? null,
      };
      if (input.nextState === "autorizado") {
        if (!input.authorizationRef) {
          throw new SeoAuditRepositoryError(
            "transition-conflict",
            SEO_AUDIT_PUBLIC_ERRORS.authorizationNeedsRef,
          );
        }
        patch.authorized_by = userId;
        patch.authorization_ref = input.authorizationRef;
      }

      await assertClientActive(current.client_id);
      const updated = await store.updateAudit(input.auditId, current.state, patch);
      if (!updated) {
        throw new SeoAuditRepositoryError(
          "transition-conflict",
          SEO_AUDIT_PUBLIC_ERRORS.transitionConflict,
        );
      }
      return updated;
    },

    async createClient(input: CreateSeoClientInput) {
      // Solo quien vera el cliente tras crearlo: super_admin o PM con cartera completa.
      // Asi nunca queda un cliente huerfano sin proyecto ni acceso.
      const access = await store.findOwnAccess(userId);
      const canCreate =
        access?.status === "activo" &&
        (access.role === "super_admin" ||
          (access.role === "project_manager" && access.full_portfolio));
      if (!canCreate) {
        throw new SeoAuditRepositoryError(
          "not-allowed",
          SEO_AUDIT_PUBLIC_ERRORS.createClientNotAllowed,
        );
      }

      const primaryDomain = normalizePrimaryDomain(input.primaryDomain);
      const tenants = (await store.listTenants()).filter(
        (tenant) => tenant.role === "owner" || tenant.role === "manager",
      );
      const tenant = input.tenantId
        ? tenants.find((item) => item.id === input.tenantId)
        : tenants.length === 1
          ? tenants[0]
          : undefined;
      if (!tenant) {
        throw new SeoAuditRepositoryError("invalid-input", SEO_AUDIT_PUBLIC_ERRORS.tenantRequired);
      }

      const name = input.nombre.trim();
      const existing = await store.listClients();
      if (existing.some((client) => client.nombre.trim().toLowerCase() === name.toLowerCase())) {
        throw new SeoAuditRepositoryError("invalid-input", SEO_AUDIT_PUBLIC_ERRORS.clientExists);
      }

      const clientId = crypto.randomUUID();
      await store.insertClient({
        id: clientId,
        nombre: name,
        sector: input.sector?.trim() || "General",
        tenant_id: tenant.id,
      });
      const project = await store.insertProject({
        tenant_id: tenant.id,
        client_id: clientId,
        nombre: input.projectName.trim(),
        primary_domain: primaryDomain,
        created_by: userId,
      });
      const client = await store.findClient(clientId);
      if (!client) {
        throw new SeoAuditRepositoryError(
          "client-not-visible",
          SEO_AUDIT_PUBLIC_ERRORS.clientNotVisible,
        );
      }
      return { client, project };
    },

    async setClientArchived(input: SetSeoClientArchivedInput) {
      const client = await store.findClient(input.clientId);
      if (!client) {
        throw new SeoAuditRepositoryError(
          "client-not-visible",
          SEO_AUDIT_PUBLIC_ERRORS.clientNotVisible,
        );
      }
      if (Boolean(client.archived_at) === input.archived) return client;
      const updated = await store.updateClientArchive(
        input.clientId,
        archivePatch(input.archived, userId),
      );
      // Sin fila devuelta: RLS no deja actualizar el cliente (no es manager).
      if (!updated) {
        throw new SeoAuditRepositoryError("not-allowed", SEO_AUDIT_PUBLIC_ERRORS.archiveNotAllowed);
      }
      return updated;
    },

    async setAuditArchived(input: SetSeoAuditArchivedInput) {
      const current = await store.findAudit(input.auditId);
      if (!current) {
        throw new SeoAuditRepositoryError(
          "audit-not-visible",
          SEO_AUDIT_PUBLIC_ERRORS.auditNotVisible,
        );
      }
      if (Boolean(current.archived_at) === input.archived) return current;
      const updated = await store.updateAuditArchive(
        input.auditId,
        archivePatch(input.archived, userId),
      );
      if (!updated) {
        throw new SeoAuditRepositoryError("not-allowed", SEO_AUDIT_PUBLIC_ERRORS.archiveNotAllowed);
      }
      return updated;
    },
  });
}
