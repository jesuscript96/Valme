import { createFileRoute } from "@tanstack/react-router";
import { AccessGate } from "@/components/valme-access-gate";

export const Route = createFileRoute("/_authenticated/panel")({
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
  return (
    <AccessGate>
      {() => (
        // La V2 es la interfaz de demostración (datos ficticios); nunca contiene datos reales.
        <iframe title="VALME Search OS · centro de mando" src="/v2/index.html" className="h-full w-full border-0" />
      )}
    </AccessGate>
  );
}
