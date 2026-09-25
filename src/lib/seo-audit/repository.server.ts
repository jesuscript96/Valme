import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database, Json } from "@/integrations/supabase/types";
import { assertAllowedTransition } from "./states";
import { SEO_AUDIT_STATES, SEO_AUDIT_VERSION } from "./types";
import { auditLimitsSchema, authorizedScopeSchema } from "./schemas";

type AuditRow = Database["public"]["Tables"]["seo_audits"]["Row"];
type AuditInsert = Database["public"]["Tables"]["seo_audits"]["Insert"];
type AuditUpdate = Database["public"]["Tables"]["seo_audits"]["Update"];
type ProjectScope = Pick<
  Database["public"]["Tables"]["projects"]["Row"],
  "id" | "tenant_id" | "client_id" | "primary_domain"
>;

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

export type CreateSeoAuditDraftInput = z.infer<typeof createSeoAuditDraftInputSchema>;
export type TransitionSeoAuditInput = z.infer<typeof transitionSeoAuditInputSchema>;

export interface SeoAuditStore {
  listAudits(): Promise<AuditRow[]>;
  findProject(projectId: string): Promise<ProjectScope | null>;
  insertAudit(audit: AuditInsert): Promise<AuditRow>;
  findAudit(auditId: string): Promise<AuditRow | null>;
  updateAudit(
    auditId: string,
    expectedState: AuditRow["state"],
    patch: AuditUpdate,
  ): Promise<AuditRow | null>;
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
    readonly code: "project-not-visible" | "audit-not-visible" | "transition-conflict",
    message: string,
  ) {
    super(message);
    this.name = "SeoAuditRepositoryError";
  }
}

export function assertSeoAuditRemoteEnabled(
  env: Readonly<Record<string, string | undefined>> = process.env,
): void {
  if (env["SEO_AUDIT_REMOTE_ENABLED"] !== "true") {
    throw new SeoAuditRemoteDisabledError();
  }
}

function throwStoreError(operation: string, error: { message: string; code?: string }): never {
  console.error(`[seo-audit-repository] No se pudo ${operation}`, error.code ?? "unknown");
  throw new Error(`No se pudo ${operation}.`);
}

export function createSupabaseSeoAuditStore(supabase: SupabaseClient<Database>): SeoAuditStore {
  return {
    async listAudits() {
      const { data, error } = await supabase
        .from("seo_audits")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throwStoreError("listar auditorias", error);
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
  };
}

export function createSeoAuditServerRepository(store: SeoAuditStore, userId: string) {
  return Object.freeze({
    list: () => store.listAudits(),

    async createDraft(input: CreateSeoAuditDraftInput): Promise<AuditRow> {
      const project = await store.findProject(input.projectId);
      if (!project) {
        throw new SeoAuditRepositoryError(
          "project-not-visible",
          "El proyecto no existe o no esta asignado a tu sesion.",
        );
      }

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
          "La auditoria no existe o no esta asignada a tu sesion.",
        );
      }

      assertAllowedTransition(current.state, input.nextState);

      const requiresReason = ["bloqueado", "devuelto", "cancelado"].includes(input.nextState);
      if (requiresReason && !input.reason) {
        throw new SeoAuditRepositoryError(
          "transition-conflict",
          `La transicion a ${input.nextState} requiere motivo.`,
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
            "La autorizacion requiere una referencia.",
          );
        }
        patch.authorized_by = userId;
        patch.authorization_ref = input.authorizationRef;
      }

      const updated = await store.updateAudit(input.auditId, current.state, patch);
      if (!updated) {
        throw new SeoAuditRepositoryError(
          "transition-conflict",
          "La auditoria cambio mientras se procesaba la transicion.",
        );
      }
      return updated;
    },
  });
}
