import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AccessGate } from "@/components/valme-access-gate";
import { getClientSecure } from "@/lib/access.functions";
import { DeniedBody } from "@/routes/acceso-denegado";

export const Route = createFileRoute("/_authenticated/clientes/$clientId")({
  head: () => ({
    meta: [
      { title: "Cliente · VALME Search OS" },
      { name: "description", content: "Ficha de cliente de VALME Search OS." },
      { property: "og:title", content: "Cliente · VALME Search OS" },
      { property: "og:description", content: "Ficha de cliente, solo para usuarios con acceso." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Cliente,
});

const UUID = /^[0-9a-f-]{36}$/i;

function Cliente() {
  const { clientId } = Route.useParams();
  const fn = useServerFn(getClientSecure);
  const q = useQuery({ queryKey: ["client", clientId], queryFn: () => fn({ data: { clientId } }), enabled: UUID.test(clientId), retry: false });
  return (
    <AccessGate>
      {() => (
        <main className="mx-auto max-w-2xl p-8 text-foreground">
          {!UUID.test(clientId) || q.data?.denied || q.isError ? (
            <><h1 className="mb-4 text-xl font-semibold">Acceso denegado</h1><DeniedBody /></>
          ) : !q.data ? (
            <p className="font-mono text-sm text-muted-foreground">Cargando…</p>
          ) : (
            <>
              <h1 className="text-xl font-semibold">{q.data.client.nombre}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{q.data.client.sector} · Estado: {q.data.client.estado}</p>
            </>
          )}
        </main>
      )}
    </AccessGate>
  );
}
