import Link from "next/link";
import { abierta, rutaAuditoria, seoModulo, vencida } from "@/os/seo";
import { DESCRIPCION } from "@/os/seo/estados";
import { EstadoBadge, fmtDia } from "@/os/seo/ui/etiquetas";
import { ProximasAcciones } from "@/os/seo/ui/ProximasAcciones";
import { Card, CardHeader, PageHeader } from "@/os/ui/primitives";

export const metadata = { title: "SEO · GEO · AEO · Valme OS" };

/**
 * Panel del módulo: qué espera al PM, qué hay que hacer y cómo va la visibilidad en IA.
 * Es la primera pantalla al entrar, así que responde a «¿qué me toca hoy?».
 */
export default async function PanelSeo() {
  const seo = await seoModulo();
  const { auditorias, hallazgos, tareas, mediciones } = seo;
  const vivas = auditorias.filter((a) => !a.archivadaEn);
  const esperan = vivas.filter((a) => ["pendiente_autorizacion", "control_calidad"].includes(a.estado));
  const nombre = (clientId: string) => seo.cliente(clientId)?.name;
  const pms = seo.clientes.flatMap((c) => seo.pmsDe(c.id));

  const stats = [
    { label: "Auditorías en curso", value: vivas.filter((a) => ["autorizado", "en_cola", "en_ejecucion", "bloqueado"].includes(a.estado)).length, href: "/app/seo/auditorias" },
    { label: "Esperan al PM", value: esperan.length, href: "/app/seo/auditorias" },
    { label: "Hallazgos por decidir", value: hallazgos.filter((h) => h.decision.valor === "pendiente").length, href: "/app/seo/auditorias" },
    { label: "Tareas vencidas", value: tareas.filter(vencida).length, href: "/app/seo/plan" },
  ];

  // Última medición GEO de cada proyecto medido.
  const ultimas = [...new Map(
    [...mediciones].sort((a, b) => a.en.localeCompare(b.en)).map((m) => [m.proyectoId, m]),
  ).values()];

  return (
    <>
      <PageHeader
        title="SEO · GEO · AEO"
        description={`${seo.filtro ? seo.filtro.name : "Todos los clientes"}. Auditorías como encargos autorizados, hallazgos con decisión del PM, un plan con responsables y la visibilidad en asistentes de IA medida en el tiempo.`}
        action={
          <Link
            href="/app/seo/auditorias/nueva"
            className="inline-flex h-9 items-center rounded-md bg-os-text px-3.5 text-sm font-medium text-white hover:bg-black"
          >
            Nueva auditoría
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="px-4 py-3 hover:border-os-border-strong">
              <p className="text-[11px] uppercase tracking-wide text-os-faint">{s.label}</p>
              <p className="os-num mt-1 font-display text-xl font-semibold text-os-text">{s.value}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Esperan una decisión del PM" />
          {esperan.length ? (
            <ul className="divide-y divide-os-border">
              {esperan.map((a) => (
                <li key={a.id} className="px-4 py-3">
                  <Link href={rutaAuditoria(a.id)} className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium text-os-text">
                        {nombre(a.clientId)} · <span className="os-num">{a.ref}</span>
                      </span>
                      <span className="block text-xs text-os-muted">{DESCRIPCION[a.estado]}</span>
                    </span>
                    <EstadoBadge e={a.estado} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-6 text-[13px] text-os-muted">Nada pendiente de autorizar ni de validar.</p>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Visibilidad en IA"
            action={<Link href="/app/seo/geo" className="text-[12px] text-os-muted hover:text-os-text">Medir →</Link>}
          />
          {ultimas.length ? (
            <ul className="divide-y divide-os-border">
              {ultimas.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3 text-[13px]">
                  <span className="min-w-0">
                    <span className="block font-medium text-os-text">{nombre(m.clientId)}</span>
                    <span className="block text-xs text-os-muted">{fmtDia(m.en)}</span>
                  </span>
                  <span className="os-num text-right">
                    {m.estado === "medida" ? `${m.menciones}/${m.consultas.length} respuestas` : "Sin medir"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-6 text-[13px] text-os-muted">
              Todavía no hay mediciones. Mide si los asistentes citan a cada cliente desde Visibilidad IA.
            </p>
          )}
        </Card>
      </div>

      <div className="mb-6">
        <ProximasAcciones
          tareas={tareas.filter(abierta)}
          auditorias={auditorias}
          hallazgos={hallazgos}
          pms={pms}
          clienteDe={nombre}
          limite={6}
        />
      </div>

      <Card>
        <CardHeader
          title="Últimas auditorías"
          action={<Link href="/app/seo/auditorias" className="text-[12px] text-os-muted hover:text-os-text">Todas →</Link>}
        />
        {vivas.length ? (
          <ul className="divide-y divide-os-border">
            {[...vivas].sort((a, b) => b.actualizadaEn.localeCompare(a.actualizadaEn)).slice(0, 5).map((a) => (
              <li key={a.id}>
                <Link href={rutaAuditoria(a.id)} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px] hover:bg-os-sunken/50">
                  <span>
                    <span className="os-num font-medium">{a.ref}</span>
                    <span className="ml-2 text-os-muted">{nombre(a.clientId)} · {a.dominio}</span>
                  </span>
                  <EstadoBadge e={a.estado} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-6 text-[13px] text-os-muted">Todavía no hay auditorías.</p>
        )}
      </Card>
    </>
  );
}
