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
      | "invalid-input",
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

export function createSupabaseSeoAuditStore(supabase: SupabaseClient<Database>): SeoAuditStore {
  const clientColumns = "id, nombre, sector, tenant_id, archived_at";

  return {
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
      const [audits, clients, projects, tenants] = await Promise.all([
        store.listAudits(),
        store.listClients(),
        store.listProjects(),
        store.listTenants(),
      ]);
      return { audits, clients, projects, tenants };
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
