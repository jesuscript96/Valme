import Link from "next/link";
import { seoModulo } from "@valme/os/seo";
import { estadoCliente, ultimoPlan } from "@valme/os/seo/operacion/diagnostico";
import { progreso } from "@valme/os/seo/operacion/onboarding";
import { Estado } from "@valme/os/seo/ui/etiquetas";
import { EmptyState, Input, PageHeader, Select } from "@valme/os/ui/primitives";

export const metadata = { title: "Clientes · SEO · Valme OS" };

const POR_PAGINA = 10;

/** Cartera del servicio SEO: el estado de cada cliente, con su equipo y su siguiente paso. */
export default async function Clientes({
  searchParams,
}: { searchParams: Promise<{ q?: string; estado?: string; p?: string }> }) {
  const sp = await searchParams;
  const seo = await seoModulo();
  const q = (sp.q ?? "").trim().toLowerCase();

  const filas = seo.clientes
    .filter((c) => seo.ambito.has(c.id))
    .map((c) => {
      const alta = seo.datos.altas.find((a) => a.clientId === c.id) ?? null;
      const enc = seo.datos.encargos.find((e) => e.clientId === c.id) ?? null;
      const estado = estadoCliente(alta, enc);
      const plan = enc ? ultimoPlan(enc) : null;
      const siguiente =
        !alta ? "Abrir el onboarding"
        : alta.estado === "Borrador" ? `Completar el onboarding (${progreso(alta)}%)`
        : !enc || enc.estado === "Pendiente" ? "Iniciar el diagnóstico"
        : enc.estado !== "Completado" ? "Terminar el diagnóstico"
        : !plan ? "Generar el plan de trabajo"
        : plan.estado === "Listo para ejecución" ? `Ejecutar el plan v${plan.version}`
        : `Decidir el plan v${plan.version}`;
      return { c, alta, estado, siguiente, auditorias: seo.datos.auditorias.filter((a) => a.clientId === c.id && !a.archivadaEn).length };
    });
  const estados = [...new Set(filas.map((f) => f.estado))];
  const lista = filas
    .filter((f) => (q ? f.c.name.toLowerCase().includes(q) : true))
    .filter((f) => (sp.estado ? f.estado === sp.estado : true));
  const pagina = Math.max(0, Number(sp.p) || 0);
  const visibles = lista.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA);
  const enlace = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (sp.estado) u.set("estado", sp.estado);
    if (p) u.set("p", String(p));
    return `/app/seo/clientes${u.size ? `?${u}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Clientes"
        description="El estado de cada cliente en el servicio SEO, con su equipo responsable y su siguiente paso."
        action={
          <Link href="/app/seo/onboarding" className="inline-flex h-9 items-center rounded-md bg-os-text px-3.5 text-sm font-medium text-white hover:bg-black">
            + Nuevo cliente
          </Link>
        }
      />
      <form action="/app/seo/clientes" className="mb-4 flex flex-wrap items-end gap-3">
        <label className="space-y-1">
          <span className="block text-[12px] text-os-muted">Buscar cliente</span>
          <Input name="q" defaultValue={q} placeholder="Nombre del cliente" className="h-8 w-60" />
        </label>
        <label className="space-y-1">
          <span className="block text-[12px] text-os-muted">Estado</span>
          <Select name="estado" defaultValue={sp.estado ?? ""} className="h-8 w-56">
            <option value="">Todos</option>
            {estados.map((e) => <option key={e} value={e}>{e}</option>)}
          </Select>
        </label>
        <button className="h-8 rounded-md border border-os-border bg-os-surface px-3 text-[13px] hover:bg-os-sunken">Filtrar</button>
      </form>

      {visibles.length ? (
        <>
          <p className="mb-2 text-xs text-os-muted">
            {lista.length} clientes · {pagina * POR_PAGINA + 1}–{Math.min(lista.length, (pagina + 1) * POR_PAGINA)}
          </p>
          <ul className="divide-y divide-os-border rounded-lg border border-os-border bg-os-surface">
            {visibles.map(({ c, alta, estado, siguiente, auditorias }) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-os-text">{c.name}</span>
                    <Estado t={estado} />
                  </div>
                  <p className="text-xs text-os-muted">
                    {alta?.servicios.join(" + ") || "Servicio sin definir"} · {alta?.equipo.length ?? 0} especialidades · {auditorias} auditorías
                  </p>
                  <p className="text-xs text-os-muted">Próximo: {siguiente}</p>
                </div>
                <Link href={`/app/seo/clientes/${c.id}`} className="text-[13px] font-medium text-os-text hover:underline">Abrir →</Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2 text-[13px]">
            {pagina > 0 ? <Link href={enlace(pagina - 1)} className="text-os-muted hover:text-os-text">← Anterior</Link> : null}
            {(pagina + 1) * POR_PAGINA < lista.length ? <Link href={enlace(pagina + 1)} className="text-os-muted hover:text-os-text">Siguiente →</Link> : null}
          </div>
        </>
      ) : (
        <EmptyState title="No hay clientes con estos filtros." body="Cambia la búsqueda o el estado." />
      )}
    </>
  );
}
