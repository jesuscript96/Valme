import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireMember } from "@/os/auth/dal";
import { diagnostico } from "@/os/dx/repo";
import { clientSummaries } from "@/os/repo";
import { resumenSeo } from "@/os/seo/resumen";
import { Estado } from "@/os/seo/ui/etiquetas";
import { readLastClient } from "@/os/tenancy/lastClient";
import { Atajos, Cifra, Cifras, type Atajo } from "@/os/ui/Inicio";
import { KitStatus } from "@/os/ui/labels";
import { Card, CardHeader, EmptyState, PageHeader, Table, Td, Th } from "@/os/ui/primitives";

export const metadata: Metadata = { title: "Inicio · Valme OS" };

/**
 * INICIO DEL ESPACIO CLIENTES.
 *
 * Con un cliente activo, Inicio es el suyo (`/app/c/<slug>`). Con «Todos los clientes»
 * es esta: la cartera entera, lo que pide una decisión y los accesos directos.
 */
export default async function Inicio() {
  const { member } = await requireMember();
  const [filas, ultimo] = await Promise.all([clientSummaries(), readLastClient()]);
  if (ultimo && filas.some((f) => f.client.slug === ultimo)) redirect(`/app/c/${ultimo}`);

  const dx = await diagnostico();
  const leadsVentas = (await dx.leads.list()).filter((l) => l.estado === "nuevo").length;
  const seo = resumenSeo(new Set(filas.map((f) => f.client.id)));
  const nombre = (id: string) => filas.find((f) => f.client.id === id)?.client.name;
  const leads30 = filas.reduce((s, f) => s + f.leads30d, 0);
  const activos = filas.filter((f) => f.client.status === "active").length;

  const atajos: Atajo[] = [
    { area: "SEO", href: "/app/seo/auditorias/nueva", titulo: "Nueva auditoría SEO", detalle: "Alcance, servicios y límites" },
    { area: "SEO", href: "/app/seo/supervision", titulo: "Supervisión", detalle: `${seo.cola.length} decisiones esperando` },
    { area: "Ventas", href: "/app/dx/tools", titulo: "Auditar un dominio", detalle: "Paid, SEO y Web, sin accesos" },
    member.role === "admin"
      ? { area: "Clientes", href: "/app/clients/new", titulo: "Nuevo cliente", detalle: "Alta con su Brand Kit" }
      : { area: "Clientes", href: "/app/clients", titulo: "Ver la cartera", detalle: `${filas.length} clientes` },
  ];

  return (
    <>
      <PageHeader
        title="Inicio"
        description="Todos los clientes. Elige uno en el menú para ver solo lo suyo."
      />

      <Atajos atajos={atajos} />

      <Cifras>
        <Cifra etiqueta="Clientes activos" valor={String(activos)} nota={`${filas.length} en cartera`} href="/app/clients" />
        <Cifra etiqueta="Leads (30 días)" valor={String(leads30)} nota="De las landings de clientes" />
        <Cifra
          etiqueta="Hallazgos por decidir"
          valor={String(seo.porDecidir)}
          nota={`${seo.auditoriasEnCurso} auditorías SEO en curso`}
          href="/app/seo/auditorias"
        />
        <Cifra
          etiqueta="Tareas SEO abiertas"
          valor={String(seo.tareasAbiertas)}
          nota={seo.tareasVencidas ? `${seo.tareasVencidas} vencidas` : "Ninguna vencida"}
          href="/app/seo/plan"
        />
      </Cifras>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-medium text-os-text">Cartera</h2>
            <Link href="/app/clients" className="text-[12px] text-os-muted hover:text-os-text">Ver todo →</Link>
          </div>
          {filas.length === 0 ? (
            <EmptyState title="Todavía no tienes clientes asignados" body="Pide a un administrador que te dé acceso a alguno." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Cliente</Th>
                  <Th>Brand Kit</Th>
                  <Th className="text-right">Ofertas</Th>
                  <Th className="text-right">Leads (30 d)</Th>
                  <Th className="text-right">Ir a</Th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.client.id} className="hover:bg-os-sunken">
                    <Td>
                      <Link href={`/app/c/${f.client.slug}`} className="font-medium hover:underline">{f.client.name}</Link>
                    </Td>
                    <Td><KitStatus s={f.brandKitStatus} /></Td>
                    <Td className="os-num text-right">{f.offers}</Td>
                    <Td className="os-num text-right">{f.leads30d}</Td>
                    <Td className="whitespace-nowrap text-right text-[12px]">
                      <Link href={`/app/c/${f.client.slug}/offers`} className="text-os-muted hover:text-os-text">Paid</Link>
                      <span className="mx-1.5 text-os-faint">·</span>
                      <Link href={`/app/c/${f.client.slug}/leads`} className="text-os-muted hover:text-os-text">Leads</Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </section>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="SEO · pide una decisión"
              action={<Link href="/app/seo/supervision" className="text-[12px] text-os-muted hover:text-os-text">Supervisión →</Link>}
            />
            {seo.cola.length ? (
              <ul className="divide-y divide-os-border">
                {seo.cola.slice(0, 4).map((x) => (
                  <li key={x.id}>
                    <Link href={x.enlace} className="flex items-start justify-between gap-3 px-4 py-2.5 hover:bg-os-sunken/50">
                      <span className="min-w-0">
                        <span className="block text-[13px] font-medium">{x.titulo}</span>
                        <span className="block text-xs text-os-muted">{nombre(x.clientId) ?? "Empresa nueva"}</span>
                      </span>
                      <Estado t={x.estado} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-6 text-[13px] text-os-muted">Nada esperando una decisión.</p>
            )}
          </Card>

          <Card className="px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-os-faint">Ventas</p>
            <p className="mt-1 text-[13px] text-os-text">
              <span className="os-num font-semibold">{leadsVentas}</span> leads nuevos sin auditar.
            </p>
            <Link href="/app/dx/leads" className="mt-1 inline-block text-[13px] font-medium hover:underline">
              Ir a Ventas →
            </Link>
          </Card>
        </div>
      </div>
    </>
  );
}
