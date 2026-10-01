import Link from "next/link";
import { notFound } from "next/navigation";
import { abierta, rutaAuditoria, seoModulo } from "@valme/os/seo";
import { rutaPlan, ultimoPlan } from "@valme/os/seo/operacion/diagnostico";
import { cargaAgentes, especialidadDeAgente } from "@valme/os/seo/operacion/panel";
import { Estado, TareaBadge, fmtDia } from "@valme/os/seo/ui/etiquetas";
import { Card, CardHeader } from "@valme/os/ui/primitives";

export default async function Agente({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const seo = await seoModulo();
  const c = cargaAgentes(seo.datos, seo.ambito).find((x) => String(x.n) === n);
  if (!c) notFound();
  const tareas = seo.tareas.filter((t) => especialidadDeAgente(t.agenteId) === c.especialidad);
  const acciones = seo.encargos.flatMap((e) => {
    const p = ultimoPlan(e);
    return p?.estado === "Listo para ejecución" ? p.acciones.filter((x) => x.agente === c.especialidad).map((x) => ({ e, x })) : [];
  });
  const actividad = seo.actividad.filter((x) => x.especialidad === c.especialidad).slice(-8).reverse();

  return (
    <>
      <nav className="mb-3 text-[13px] text-os-muted"><Link href="/app/seo/agentes" className="hover:text-os-text">← Agentes</Link></nav>
      <p className="text-[11px] uppercase tracking-wide text-os-faint">Especialidad 0{c.n}</p>
      <h1 className="font-display text-xl font-semibold tracking-tight">{c.especialidad}</h1>
      <p className="mb-6 mt-1 text-[13px] text-os-muted">Instancias independientes por cliente; permisos limitados a cada cuenta.</p>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="px-4 py-4">
          <p className="text-[11px] uppercase text-os-faint">Carga y disponibilidad</p>
          <p className="os-num mt-1 font-display text-3xl font-semibold">{c.carga}%</p>
          <p className="text-xs text-os-muted">{c.abiertos} elementos abiertos · {c.clientes.length} clientes · {c.hechas7d} hechos en 7 días · {c.incidencias7d} incidencias</p>
        </Card>
        <Card className="space-y-1 px-4 py-4 text-[13px]">
          <p className="text-[11px] uppercase text-os-faint">Alcance de actuación</p>
          <p>✓ Analizar datos y preparar propuestas</p>
          <p>✓ Crear borradores y evidencias</p>
          <p>◇ Publicar, enviar o cambiar permisos: aprobación humana</p>
          <p className="text-xs text-os-muted">El nivel de confianza nunca amplía los permisos.</p>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader title="Trabajo asignado" />
        <ul className="divide-y divide-os-border">
          {tareas.filter(abierta).map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px]">
              <span><TareaBadge e={t.estado} /> <span className="ml-1">{t.titulo}</span> <span className="text-xs text-os-muted">· {fmtDia(t.fecha)}</span></span>
              <Link href={`${rutaAuditoria(t.auditoriaId)}?tab=hallazgos#h-${t.hallazgoId}`} className="text-xs underline">Abrir</Link>
            </li>
          ))}
          {acciones.map(({ e, x }) => (
            <li key={`${e.id}-${x.n}`} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px]">
              <span><Estado t="Listo para ejecución" /> <span className="ml-1">{x.accion}</span> <span className="text-xs text-os-muted">· {seo.cliente(e.clientId)?.name} · {x.plazo}</span></span>
              <Link href={rutaPlan(e.id)} className="text-xs underline">Plan</Link>
            </li>
          ))}
          {!tareas.filter(abierta).length && !acciones.length ? <li className="px-4 py-5 text-[13px] text-os-muted">Sin trabajo abierto.</li> : null}
        </ul>
      </Card>

      <Card className="mb-6">
        <CardHeader title="Clientes asignados" />
        <ul className="divide-y divide-os-border">
          {c.clientes.map((id) => (
            <li key={id}><Link href={`/app/seo/clientes/${id}?tab=equipo`} className="block px-4 py-2.5 text-[13px] hover:bg-os-sunken/50">{seo.cliente(id)?.name}</Link></li>
          ))}
          {!c.clientes.length ? <li className="px-4 py-5 text-[13px] text-os-muted">Ningún onboarding activo la incluye en su equipo.</li> : null}
        </ul>
      </Card>

      <Card>
        <CardHeader title="Actividad reciente" />
        <ul className="divide-y divide-os-border">
          {actividad.map((x) => <li key={x.id} className="px-4 py-2.5 text-[13px]"><Estado t={x.estado} /> <span className="ml-1">{x.texto}</span> <span className="text-xs text-os-muted">· {fmtDia(x.en)}</span></li>)}
          {!actividad.length ? <li className="px-4 py-5 text-[13px] text-os-muted">Sin actividad registrada.</li> : null}
        </ul>
      </Card>
    </>
  );
}
