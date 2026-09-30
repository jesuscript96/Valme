import Link from "next/link";
import { seoDe } from "@/os/seo";
import { crearProyectoAccion } from "@/os/seo/acciones";
import { ESTADOS, ESTADO_LABEL, type EstadoAuditoria } from "@/os/seo/tipos";
import { EstadoBadge, fmtDia } from "@/os/seo/ui/etiquetas";
import { Desplegable, Formulario } from "@/os/seo/ui/Formulario";
import { ProximasAcciones } from "@/os/seo/ui/ProximasAcciones";
import {
  Card, CardHeader, EmptyState, Field, Input, PageHeader, Table, Td, Th, cx,
} from "@/os/ui/primitives";

export async function generateMetadata({ params }: { params: Promise<{ client: string }> }) {
  const { client } = await params;
  const { scope } = await seoDe(client);
  return { title: `SEO · ${scope.client.name} · Valme OS` };
}

/**
 * SEO · GEO · AEO del cliente: auditorías como encargos con alcance y autorización,
 * lo que queda por hacer y los proyectos (dominios) que se auditan.
 */
export default async function SeoCliente({
  params, searchParams,
}: {
  params: Promise<{ client: string }>;
  searchParams: Promise<{ estado?: string; archivadas?: string; q?: string }>;
}) {
  const { client: slug } = await params;
  const filtro = await searchParams;
  const seo = await seoDe(slug);
  const { auditorias, proyectos, hallazgos, tareas } = seo;

  const verArchivadas = filtro.archivadas === "1";
  const estado = ESTADOS.includes(filtro.estado as EstadoAuditoria) ? (filtro.estado as EstadoAuditoria) : null;
  const q = (filtro.q ?? "").trim().toLowerCase();
  const lista = auditorias
    .filter((a) => (verArchivadas ? true : !a.archivadaEn))
    .filter((a) => (estado ? a.estado === estado : true))
    .filter((a) => (q ? `${a.ref} ${a.dominio}`.toLowerCase().includes(q) : true))
    .sort((a, b) => b.actualizadaEn.localeCompare(a.actualizadaEn));
  const archivadas = auditorias.filter((a) => a.archivadaEn).length;

  const vivas = auditorias.filter((a) => !a.archivadaEn);
  const stats = [
    { label: "Auditorías activas", value: vivas.filter((a) => ["en_cola", "en_ejecucion", "bloqueado"].includes(a.estado)).length },
    { label: "Esperan al PM", value: vivas.filter((a) => ["pendiente_autorizacion", "control_calidad"].includes(a.estado)).length },
    { label: "Hallazgos por decidir", value: hallazgos.filter((h) => h.decision.valor === "pendiente").length },
    { label: "Validadas", value: vivas.filter((a) => a.estado === "validado").length },
  ];

  const base = `/app/c/${slug}/seo`;
  const enlace = (cambios: Record<string, string | null>) => {
    const p = new URLSearchParams();
    const todo = { estado, archivadas: verArchivadas ? "1" : null, q: q || null, ...cambios };
    for (const [k, v] of Object.entries(todo)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `${base}?${s}` : base;
  };

  return (
    <>
      <PageHeader
        title="SEO · GEO · AEO"
        description="Auditorías como encargos: alcance y límites, autorización del PM, evidencias, hallazgos con decisión y tareas de seguimiento con responsable y fecha."
        action={
          <Link
            href={`${base}/nueva`}
            className="inline-flex h-9 items-center rounded-md bg-os-text px-3.5 text-sm font-medium text-white hover:bg-black"
          >
            Nueva auditoría
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-os-faint">{s.label}</p>
            <p className="os-num mt-1 font-display text-xl font-semibold text-os-text">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="mb-6">
        <ProximasAcciones
          slug={slug}
          tareas={tareas}
          auditorias={auditorias}
          hallazgos={hallazgos}
          pms={seo.pms}
        />
      </div>

      <section className="mb-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[13px] font-semibold text-os-text">Auditorías</h2>
          <form action={base} className="flex items-center gap-2">
            {estado ? <input type="hidden" name="estado" value={estado} /> : null}
            {verArchivadas ? <input type="hidden" name="archivadas" value="1" /> : null}
            <Input name="q" defaultValue={q} placeholder="Buscar por referencia o dominio" className="h-8 w-64" />
          </form>
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5 text-[12px]">
          <Link href={enlace({ estado: null })} className={chip(!estado)}>Todos</Link>
          {ESTADOS.map((e) => (
            <Link key={e} href={enlace({ estado: e })} className={chip(estado === e)}>
              {ESTADO_LABEL[e]}
            </Link>
          ))}
          {archivadas ? (
            <Link href={enlace({ archivadas: verArchivadas ? null : "1" })} className={chip(verArchivadas)}>
              {verArchivadas ? "Ocultar archivadas" : `Mostrar archivadas (${archivadas})`}
            </Link>
          ) : null}
        </div>

        {lista.length ? (
          <Table>
            <thead>
              <tr>
                <Th>Referencia</Th>
                <Th>Proyecto</Th>
                <Th>Estado</Th>
                <Th>Servicios</Th>
                <Th className="text-right">Hallazgos</Th>
                <Th>Actualizada</Th>
              </tr>
            </thead>
            <tbody>
              {lista.map((a) => {
                const p = proyectos.find((x) => x.id === a.proyectoId);
                const n = hallazgos.filter((h) => h.auditoriaId === a.id);
                return (
                  <tr key={a.id} className="hover:bg-os-sunken/50">
                    <Td>
                      <Link href={`${base}/${a.id}`} className="os-num font-medium hover:underline">
                        {a.ref}
                      </Link>
                    </Td>
                    <Td>
                      <p className="font-medium">{p?.nombre ?? "Proyecto"}</p>
                      <p className="text-xs text-os-muted">{a.dominio}</p>
                    </Td>
                    <Td>
                      <span className="inline-flex flex-wrap gap-1">
                        <EstadoBadge e={a.estado} />
                        {a.archivadaEn ? <span className="text-[11px] text-os-faint">Archivada</span> : null}
                      </span>
                    </Td>
                    <Td className="text-os-muted">{a.servicios.join(" · ")}</Td>
                    <Td className="os-num text-right">
                      {n.length}
                      {n.some((h) => h.decision.valor === "pendiente") ? (
                        <span className="ml-1 text-[11px] text-os-warn">
                          ({n.filter((h) => h.decision.valor === "pendiente").length} sin decidir)
                        </span>
                      ) : null}
                    </Td>
                    <Td className="text-os-muted">{fmtDia(a.actualizadaEn)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        ) : (
          <EmptyState
            title={auditorias.length ? "No hay auditorías con estos filtros" : "Todavía no hay auditorías"}
            body="Una auditoría nace en borrador. Hasta que un PM la autoriza con una referencia no se recoge ninguna evidencia."
          />
        )}
      </section>

      <Card>
        <CardHeader title="Proyectos" />
        <ul className="divide-y divide-os-border">
          {proyectos.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-4 px-4 py-2.5 text-[13px]">
              <span>
                <span className="font-medium">{p.nombre}</span>
                <span className="ml-2 text-os-muted">{p.dominio}</span>
              </span>
              <Link href={`${base}/nueva?proyecto=${p.id}`} className="text-os-muted hover:text-os-text">
                Nueva auditoría →
              </Link>
            </li>
          ))}
        </ul>
        {seo.actor.pm ? (
          <div className="border-t border-os-border px-4 py-3">
            <Desplegable titulo="+ Nuevo proyecto">
              <Formulario accion={crearProyectoAccion.bind(null, slug)} boton="Crear proyecto">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Nombre" htmlFor="pr-nombre">
                    <Input id="pr-nombre" name="nombre" placeholder="Web principal" required />
                  </Field>
                  <Field label="Dominio" htmlFor="pr-dominio">
                    <Input id="pr-dominio" name="dominio" placeholder="www.ejemplo.com" required />
                  </Field>
                </div>
              </Formulario>
            </Desplegable>
          </div>
        ) : null}
      </Card>
    </>
  );
}

const chip = (activo: boolean) =>
  cx(
    "rounded-md border px-2 py-1 transition-colors",
    activo
      ? "border-os-text bg-os-text text-white"
      : "border-os-border bg-os-surface text-os-muted hover:text-os-text",
  );
