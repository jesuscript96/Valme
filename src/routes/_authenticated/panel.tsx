import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef } from "react";
import { AccessGate } from "@/components/valme-access-gate";
import { getV2Shell } from "@/lib/v2-shell.functions";
import {
  createSeoAuditDraft,
  createSeoClient,
  loadSeoAuditWorkspace,
  setSeoAuditArchived,
  setSeoClientArchived,
  transitionSeoAudit,
} from "@/lib/seo-audit/repository.functions";
import { publicSeoAuditErrorMessage } from "@/lib/seo-audit/public-errors";

const SEO_AUDIT_CHANNEL = "valme:seo-audit:v1";
const SEO_AUDIT_ACTIONS = [
  "load",
  "createDraft",
  "transition",
  "addClient",
  "setClientArchived",
  "setAuditArchived",
] as const;

type SeoAuditBridgeRequest = {
  channel: typeof SEO_AUDIT_CHANNEL;
  kind: "request";
  id: string;
  action: (typeof SEO_AUDIT_ACTIONS)[number];
  payload?: unknown;
};

function isBridgeRequest(value: unknown): value is SeoAuditBridgeRequest {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<SeoAuditBridgeRequest>;
  return (
    message.channel === SEO_AUDIT_CHANNEL &&
    message.kind === "request" &&
    typeof message.id === "string" &&
    (SEO_AUDIT_ACTIONS as readonly string[]).includes(message.action ?? "")
  );
}

export const Route = createFileRoute("/_authenticated/panel")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Centro de mando · VALME Search OS" },
      { name: "description", content: "Centro de mando interno de VALME Search OS." },
      { property: "og:title", content: "Centro de mando · VALME Search OS" },
      { property: "og:description", content: "Los agentes ejecutan. El Project Manager dirige." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Panel,
});

function Panel() {
  return <AccessGate>{() => <V2Frame />}</AccessGate>;
}

function V2Frame() {
  const fn = useServerFn(getV2Shell);
  const loadWorkspace = useServerFn(loadSeoAuditWorkspace);
  const createDraft = useServerFn(createSeoAuditDraft);
  const transition = useServerFn(transitionSeoAudit);
  const addClient = useServerFn(createSeoClient);
  const setClientArchived = useServerFn(setSeoClientArchived);
  const setAuditArchived = useServerFn(setSeoAuditArchived);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const q = useQuery({
    queryKey: ["v2-shell"],
    queryFn: () => fn(),
    staleTime: Infinity,
    retry: false,
  });

  const sendConfig = useCallback(() => {
    const target = frameRef.current?.contentWindow;
    if (!target || !q.data || !q.data.allowed) return;
    target.postMessage(
      {
        channel: SEO_AUDIT_CHANNEL,
        kind: "config",
        mode: q.data.seoAuditMode,
      },
      window.location.origin,
    );
  }, [q.data]);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent<unknown>) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== frameRef.current?.contentWindow ||
        !isBridgeRequest(event.data)
      )
        return;
      const request = event.data;
      const target = frameRef.current?.contentWindow;
      if (!target) return;

      try {
        let data: unknown;
        if (request.action === "load") data = await loadWorkspace();
        if (request.action === "createDraft") {
          data = await createDraft({ data: request.payload });
        }
        if (request.action === "transition") {
          data = await transition({ data: request.payload });
        }
        if (request.action === "addClient") {
          data = await addClient({ data: request.payload });
        }
        if (request.action === "setClientArchived") {
          data = await setClientArchived({ data: request.payload });
        }
        if (request.action === "setAuditArchived") {
          data = await setAuditArchived({ data: request.payload });
        }
        target.postMessage(
          { channel: SEO_AUDIT_CHANNEL, kind: "response", id: request.id, ok: true, data },
          window.location.origin,
        );
      } catch (error) {
        target.postMessage(
          {
            channel: SEO_AUDIT_CHANNEL,
            kind: "response",
            id: request.id,
            ok: false,
            error: publicSeoAuditErrorMessage(error),
          },
          window.location.origin,
        );
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [addClient, createDraft, loadWorkspace, setAuditArchived, setClientArchived, transition]);

  if (q.isError || (q.data && !q.data.allowed)) {
    return (
      <p className="p-6 font-mono text-sm text-muted-foreground">
        Acceso denegado: tu rol no permite abrir el centro de mando.
      </p>
    );
  }
  if (!q.data)
    return <p className="p-6 font-mono text-sm text-muted-foreground">Cargando centro de mando…</p>;
  return (
    <iframe
      ref={frameRef}
      title="VALME Search OS · centro de mando"
      srcDoc={q.data.html}
      className="h-full w-full border-0"
      onLoad={sendConfig}
    />
  );
}
