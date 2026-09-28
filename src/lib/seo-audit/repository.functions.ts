import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  assertSeoAuditRemoteEnabled,
  createSeoAuditDraftInputSchema,
  createSeoAuditServerRepository,
  createSeoClientInputSchema,
  createSupabaseSeoAuditStore,
  importSeoAuditReviewInputSchema,
  reviewSeoFindingInputSchema,
  setSeoAuditArchivedInputSchema,
  setSeoClientArchivedInputSchema,
  transitionSeoAuditInputSchema,
  type SeoAuditDatabase,
} from "./repository.server";

function createStore(client: unknown) {
  // Runtime identity is unchanged; this narrows the generated schema view to staging audit tables.
  return createSupabaseSeoAuditStore(client as SupabaseClient<SeoAuditDatabase>);
}

export const listSeoAudits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    assertSeoAuditRemoteEnabled();
    return createSeoAuditServerRepository(createStore(context.supabase), context.userId).list();
  });

export const loadSeoAuditWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    assertSeoAuditRemoteEnabled();
    return createSeoAuditServerRepository(
      createStore(context.supabase),
      context.userId,
    ).workspace();
  });

export const createSeoAuditDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createSeoAuditDraftInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    assertSeoAuditRemoteEnabled();
    return createSeoAuditServerRepository(
      createStore(context.supabase),
      context.userId,
    ).createDraft(data);
  });

export const transitionSeoAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => transitionSeoAuditInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    assertSeoAuditRemoteEnabled();
    return createSeoAuditServerRepository(createStore(context.supabase), context.userId).transition(
      data,
    );
  });

export const createSeoClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createSeoClientInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    assertSeoAuditRemoteEnabled();
    return createSeoAuditServerRepository(
      createStore(context.supabase),
      context.userId,
    ).createClient(data);
  });

export const setSeoClientArchived = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => setSeoClientArchivedInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    assertSeoAuditRemoteEnabled();
    return createSeoAuditServerRepository(
      createStore(context.supabase),
      context.userId,
    ).setClientArchived(data);
  });

export const setSeoAuditArchived = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => setSeoAuditArchivedInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    assertSeoAuditRemoteEnabled();
    return createSeoAuditServerRepository(
      createStore(context.supabase),
      context.userId,
    ).setAuditArchived(data);
  });

export const importSeoAuditReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => importSeoAuditReviewInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    assertSeoAuditRemoteEnabled();
    return createSeoAuditServerRepository(
      createStore(context.supabase),
      context.userId,
    ).importReview(data);
  });

export const reviewSeoFinding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => reviewSeoFindingInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    assertSeoAuditRemoteEnabled();
    return createSeoAuditServerRepository(
      createStore(context.supabase),
      context.userId,
    ).reviewFinding(data);
  });
