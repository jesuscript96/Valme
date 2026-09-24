import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AccessGate } from "@/components/valme-access-gate";
import { getV2Shell } from "@/lib/v2-shell.functions";

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
  const q = useQuery({ queryKey: ["v2-shell"], queryFn: () => fn(), staleTime: Infinity, retry: false });
  if (q.isError || (q.data && !q.data.allowed)) {
    return <p className="p-6 font-mono text-sm text-muted-foreground">Acceso denegado: tu rol no permite abrir el centro de mando.</p>;
  }
  if (!q.data) return <p className="p-6 font-mono text-sm text-muted-foreground">Cargando centro de mando…</p>;
  // La V2 es la interfaz de demostración (datos ficticios); nunca contiene datos reales.
  return <iframe title="VALME Search OS · centro de mando" srcDoc={q.data.html} className="h-full w-full border-0" />;
}
