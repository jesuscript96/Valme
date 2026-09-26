import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  assertSeoAuditRemoteEnabled,
  createSeoAuditDraftInputSchema,
  createSeoAuditServerRepository,
  createSupabaseSeoAuditStore,
  transitionSeoAuditInputSchema,
} from "./repository.server";

export const listSeoAudits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    assertSeoAuditRemoteEnabled();
    return createSeoAuditServerRepository(
      createSupabaseSeoAuditStore(context.supabase),
      context.userId,
    ).list();
  });

export const loadSeoAuditWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    assertSeoAuditRemoteEnabled();
    return createSeoAuditServerRepository(
      createSupabaseSeoAuditStore(context.supabase),
      context.userId,
    ).workspace();
  });

export const createSeoAuditDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createSeoAuditDraftInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    assertSeoAuditRemoteEnabled();
    return createSeoAuditServerRepository(
      createSupabaseSeoAuditStore(context.supabase),
      context.userId,
    ).createDraft(data);
  });

export const transitionSeoAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => transitionSeoAuditInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    assertSeoAuditRemoteEnabled();
    return createSeoAuditServerRepository(
      createSupabaseSeoAuditStore(context.supabase),
      context.userId,
    ).transition(data);
  });
