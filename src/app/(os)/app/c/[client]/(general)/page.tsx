import Link from "next/link";
import { forClient } from "@/os/repo";
import { resumenSeo } from "@/os/seo/resumen";
import { Estado } from "@/os/seo/ui/etiquetas";
import { Atajos, Cifra, Cifras, type Atajo } from "@/os/ui/Inicio";
import { Button, Card, CardHeader, EmptyState, PageHeader } from "@/os/ui/primitives";
import { CreativeStatusBadge, EmailStatusBadge, KitStatus, fmtDateTime, fmtUsd } from "@/os/ui/labels";

export async function generateMetadata({ params }: { params: Promise<{ client: string }> }) {
  const { client } = await params;
  const scope = await forClient(client);
  return { title: `${scope.client.name} · Valme OS` };
}

/**
 * INICIO DE UN CLIENTE. Pantalla 3 del MD: pendiente de aprobar, últimos leads, lo que
 * espera en SEO y accesos directos a cada área.
 */
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

  const leads30 = await scope.leads.countSince(30);
  const seo = resumenSeo(new Set([scope.client.id]));
  const kitOk = kit.status === "approved";
  const base = `/app/c/${slug}`;

  const atajos: Atajo[] = [
    kitOk
      ? { area: "Paid", href: `${base}/offers`, titulo: "Nueva oferta", detalle: "Ángulo, CTA y anuncios" }
      : { area: "Marca", href: `${base}/brand-kit`, titulo: "Aprobar el Brand Kit", detalle: "Lo necesita todo lo demás" },
    offers[0]
      ? { area: "Paid", href: `${base}/offers/${offers[0].id}/studio`, titulo: "Estudio de anuncios", detalle: offers[0].name }
      : { area: "Paid", href: `${base}/landings`, titulo: "Landings", detalle: "Las páginas de captación" },
    { area: "SEO", href: "/app/seo/auditorias/nueva", titulo: "Nueva auditoría SEO", detalle: "Para este cliente" },
    { area: "CRM", href: `${base}/leads`, titulo: "Leads", detalle: `${leads30} en los últimos 30 días` },
  ];

  return (
    <>
      <PageHeader
        title={scope.client.name}
        description={scope.client.websiteUrl ?? undefined}
        action={<KitStatus s={kit.status} />}
      />

      <Atajos atajos={atajos} />

      <Cifras>
        <Cifra etiqueta="Leads (30 días)" valor={String(leads30)} href={`${base}/leads`} />
        <Cifra etiqueta="Ofertas activas" valor={String(offers.length)} nota={`${pending.length} anuncios por aprobar`} href={`${base}/offers`} />
        <Cifra
          etiqueta="SEO · por decidir"
          valor={String(seo.porDecidir)}
          nota={`${seo.tareasAbiertas} tareas abiertas${seo.tareasVencidas ? `, ${seo.tareasVencidas} vencidas` : ""}`}
          href="/app/seo"
        />
        <Cifra etiqueta="Coste IA acumulado" valor={fmtUsd(cost)} />
      </Cifras>

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

        <Card className="lg:col-span-2">
          <CardHeader
            title="SEO · pide una decisión"
            action={
              <Link href="/app/seo">
                <Button size="sm" variant="ghost">Abrir SEO</Button>
              </Link>
            }
          />
          {seo.cola.length === 0 ? (
            <p className="px-4 py-6 text-[13px] text-os-muted">
              Nada esperando una decisión{seo.auditoriasEnCurso ? "" : ", y ninguna auditoría en curso"}.
            </p>
          ) : (
            <ul className="divide-y divide-os-border">
              {seo.cola.slice(0, 5).map((x) => (
                <li key={x.id}>
                  <Link href={x.enlace} className="flex items-start justify-between gap-3 px-4 py-2.5 hover:bg-os-sunken/50">
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium text-os-text">{x.titulo}</span>
                      <span className="block text-xs text-os-muted">{x.detalle}</span>
                    </span>
                    <Estado t={x.estado} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
