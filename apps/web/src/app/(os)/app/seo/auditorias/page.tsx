import Link from "next/link";
import { rutaAuditoria, seoModulo } from "@valme/os/seo";
import { ESTADOS, ESTADO_LABEL, type EstadoAuditoria } from "@valme/os/seo/tipos";
import { EstadoBadge, fmtDia } from "@valme/os/seo/ui/etiquetas";
import { EmptyState, Input, PageHeader, Table, Td, Th, cx } from "@valme/os/ui/primitives";

export const metadata = { title: "Auditorías · SEO · Valme OS" };

export default async function Auditorias({
  searchParams,
}: { searchParams: Promise<{ estado?: string; archivadas?: string; q?: string }> }) {
  const filtro = await searchParams;
  const seo = await seoModulo();
  const { auditorias, proyectos, hallazgos } = seo;

  const verArchivadas = filtro.archivadas === "1";
  const estado = ESTADOS.includes(filtro.estado as EstadoAuditoria) ? (filtro.estado as EstadoAuditoria) : null;
  const q = (filtro.q ?? "").trim().toLowerCase();
  const nombre = (clientId: string) => seo.cliente(clientId)?.name ?? "Cliente";
  const lista = auditorias
    .filter((a) => (verArchivadas ? true : !a.archivadaEn))
    .filter((a) => (estado ? a.estado === estado : true))
    .filter((a) => (q ? `${a.ref} ${a.dominio} ${nombre(a.clientId)}`.toLowerCase().includes(q) : true))
    .sort((a, b) => b.actualizadaEn.localeCompare(a.actualizadaEn));
  const archivadas = auditorias.filter((a) => a.archivadaEn).length;

  const base = "/app/seo/auditorias";
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
        title="Auditorías"
        description="Encargos con alcance, límites y autorización. Nada se ejecuta hasta que un PM autoriza con una referencia."
        action={
          <Link
            href={`${base}/nueva`}
            className="inline-flex h-9 items-center rounded-md bg-os-text px-3.5 text-sm font-medium text-white hover:bg-black"
          >
            Nueva auditoría
          </Link>
        }
      />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5 text-[12px]">
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
        <form action={base} className="flex items-center gap-2">
          {estado ? <input type="hidden" name="estado" value={estado} /> : null}
          {verArchivadas ? <input type="hidden" name="archivadas" value="1" /> : null}
          <Input name="q" defaultValue={q} placeholder="Buscar referencia, cliente o dominio" className="h-8 w-64" />
        </form>
      </div>

      {lista.length ? (
        <Table>
          <thead>
            <tr>
              <Th>Referencia</Th>
              <Th>Cliente · proyecto</Th>
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
              const sinDecidir = n.filter((h) => h.decision.valor === "pendiente").length;
              return (
                <tr key={a.id} className="hover:bg-os-sunken/50">
                  <Td>
                    <Link href={rutaAuditoria(a.id)} className="os-num font-medium hover:underline">{a.ref}</Link>
                  </Td>
                  <Td>
                    <p className="font-medium">{nombre(a.clientId)}</p>
                    <p className="text-xs text-os-muted">{p?.nombre ?? "Proyecto"} · {a.dominio}</p>
                  </Td>
                  <Td>
                    <span className="inline-flex flex-wrap items-center gap-1">
                      <EstadoBadge e={a.estado} />
                      {a.archivadaEn ? <span className="text-[11px] text-os-faint">Archivada</span> : null}
                    </span>
                  </Td>
                  <Td className="text-os-muted">{a.servicios.join(" · ")}</Td>
                  <Td className="os-num text-right">
                    {n.length}
                    {sinDecidir ? <span className="ml-1 text-[11px] text-os-warn">({sinDecidir} sin decidir)</span> : null}
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
