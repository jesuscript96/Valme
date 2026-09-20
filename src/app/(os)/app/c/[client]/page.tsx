import Link from "next/link";
import { forClient } from "@/os/repo";
import { Button, Card, CardHeader, EmptyState, PageHeader } from "@/os/ui/primitives";
import { CreativeStatusBadge, EmailStatusBadge, KitStatus, fmtDateTime, fmtUsd } from "@/os/ui/labels";

export async function generateMetadata({ params }: { params: Promise<{ client: string }> }) {
  const { client } = await params;
  const scope = await forClient(client);
  return { title: `${scope.client.name} · Valme OS` };
}

/** Pantalla 3 del MD: pendiente de aprobar, últimos leads, campañas, accesos rápidos. */
export default async function ClientHome({ params }: { params: Promise<{ client: string }> }) {
  const { client: slug } = await params;
  const scope = await forClient(slug);

  const [kit, offers, leads, cost] = await Promise.all([
    scope.brandKit(),
    scope.offers.list(),
    scope.leads.list(),
    scope.aiJobs.totalCostUsd(),
  ]);

  const pending = (
    await Promise.all(offers.map((o) => scope.creatives.listByOffer(o.id)))
  )
    .flat()
    .filter((c) => c.status === "generated" || c.status === "reviewed");

  const stats = [
    { label: "Leads (30 días)", value: String(await scope.leads.countSince(30)) },
    { label: "Ofertas activas", value: String(offers.length) },
    { label: "Por aprobar", value: String(pending.length) },
    { label: "Coste IA acumulado", value: fmtUsd(cost) },
  ];

  return (
    <>
      <PageHeader
        title={scope.client.name}
        description={scope.client.websiteUrl ?? undefined}
        action={<KitStatus s={kit.status} />}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-os-faint">{s.label}</p>
            <p className="os-num mt-1 font-display text-xl font-semibold text-os-text">{s.value}</p>
          </Card>
        ))}
      </div>

      {kit.status !== "approved" ? (
        <Card className="mb-6 border-os-warn/30 bg-os-warn-soft px-4 py-3">
          <p className="text-[13px] text-os-warn">
            El Brand Kit todavía no está aprobado. Hasta que lo esté no se pueden crear ofertas
            ni generar anuncios — todo lo que se genera lee de él.{" "}
            <Link href={`/app/c/${slug}/brand-kit`} className="font-medium underline">
              Revisarlo
            </Link>
          </p>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Pendiente de aprobar"
            action={
              offers[0] ? (
                <Link href={`/app/c/${slug}/offers/${offers[0].id}/studio`}>
                  <Button size="sm">Ir al estudio</Button>
                </Link>
              ) : null
            }
          />
          {pending.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-os-muted">
              Nada esperándote. Bien.
            </p>
          ) : (
            <ul className="divide-y divide-os-border">
              {pending.slice(0, 5).map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="min-w-0 flex-1 truncate text-[13px] text-os-text">{c.headline}</span>
                  <CreativeStatusBadge s={c.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Últimos leads"
            action={
              <Link href={`/app/c/${slug}/leads`}>
                <Button size="sm" variant="ghost">Ver todos</Button>
              </Link>
            }
          />
          {leads.length === 0 ? (
            <EmptyState
              title="Todavía no ha entrado ningún lead"
              body="Cuando publiques una landing y la campaña esté activa, aparecerán aquí en segundos."
            />
          ) : (
            <ul className="divide-y divide-os-border">
              {leads.slice(0, 5).map((l) => (
                <li key={l.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] text-os-text">{l.name}</span>
                    <span className="block text-[11px] text-os-faint">{fmtDateTime(l.createdAt)}</span>
                  </span>
                  <EmailStatusBadge s={l.emailStatus} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
