import type { SupabaseClient } from "@supabase/supabase-js";
import type { SeoAuditDatabase } from "./repository.server";
import { assertSeoAuditRemoteEnabled, createSupabaseSeoAuditStore } from "./repository.server";
import { authorizedScopeSchema } from "./schemas";
import { pilotUrl, probeHomepage } from "./agent-probe.server";

export async function runFindingProbe(
  client: SupabaseClient<SeoAuditDatabase>,
  userId: string,
  actionId: string,
  probe = probeHomepage,
) {
  assertSeoAuditRemoteEnabled();
  const store = createSupabaseSeoAuditStore(client);
  const access = await store.findOwnAccess(userId);
  if (access?.status !== "activo" || !["super_admin", "project_manager"].includes(access.role))
    throw new Error("Solo un PM activo puede ejecutar la prueba.");
  const action = await store.findAction(actionId);
  if (!action || action.status !== "pendiente" || action.kind !== "investigacion")
    throw new Error("La prueba requiere una investigacion pendiente.");
  const audit = await store.findAudit(action.audit_id);
  if (
    !audit ||
    audit.archived_at ||
    audit.state !== "en_ejecucion" ||
    !audit.authorized_by ||
    !audit.authorization_ref
  )
    throw new Error("La auditoria debe estar autorizada y en ejecucion.");
  const url = pilotUrl(audit.primary_domain);
  const scope = authorizedScopeSchema.parse(audit.authorized_scope);
  if (
    !scope.includedDomains.some((domain) => {
      try {
        return pilotUrl(domain).hostname === url.hostname;
      } catch {
        return false;
      }
    }) ||
    !scope.includedPaths.includes("/") ||
    scope.excludedPaths.includes("/") ||
    !scope.allowedReadActions.includes("fetch_public_html")
  )
    throw new Error("La lectura de portada no esta autorizada.");
  // Conditional update is the claim: concurrent requests cannot execute the same task twice.
  const { data: claimed, error } = await client
    .from("seo_finding_actions")
    .update({
      status: "en_curso",
      conclusion: "Prueba HTTP iniciada; pendiente de resultado y revision del PM.",
    })
    .eq("id", actionId)
    .eq("status", "pendiente")
    .select("id")
    .maybeSingle();
  if (error || !claimed)
    throw new Error("No se pudo iniciar la tarea. Revisa su estado y tus permisos.");
  try {
    const observed = await probe(url.href);
    const evidence = await store.insertEvidence([
      {
        tenant_id: audit.tenant_id,
        audit_id: audit.id,
        url_or_resource: url.href,
        source: "VALME HTTP probe v1",
        collection_method: `HTTPS GET sin redirecciones; tarea ${actionId}`,
        observed_at: new Date().toISOString(),
        observed_data: observed,
        contains_external_untrusted_data: true,
        level: "url",
        created_by: userId,
      },
    ]);
    await store.linkFindingEvidence(
      evidence.map((item) => ({
        tenant_id: audit.tenant_id,
        audit_id: audit.id,
        finding_id: action.finding_id,
        evidence_id: item.id,
        linked_by: userId,
      })),
    );
    const { data: saved, error: saveError } = await client
      .from("seo_finding_actions")
      .update({
        conclusion:
          "Prueba HTTP completada. Evidencia enlazada al hallazgo. No cierra la investigacion: revisa el resultado en Evidencias.",
      })
      .eq("id", actionId)
      .eq("status", "en_curso")
      .select("id")
      .maybeSingle();
    if (saveError || !saved) throw new Error("Estado modificado durante la ejecucion.");
    return { evidenceCount: evidence.length };
  } catch {
    await client
      .from("seo_finding_actions")
      .update({
        conclusion:
          "La prueba no pudo completarse. Puede haber evidencias parciales: revisalas antes de cerrar la tarea. No se reintenta automaticamente.",
      })
      .eq("id", actionId)
      .eq("status", "en_curso");
    throw new Error("La prueba no se completo. Revisa la tarea y sus evidencias.");
  }
}
