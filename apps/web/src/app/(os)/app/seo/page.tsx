import Link from "next/link";
import { abierta, seoModulo } from "@valme/os/seo";
import { estadoCliente, ultimoPlan } from "@valme/os/seo/operacion/diagnostico";
import { cargaAgentes, colaSupervision, indicadores, registro } from "@valme/os/seo/operacion/panel";
import { Estado } from "@valme/os/seo/ui/etiquetas";
import { ProximasAcciones } from "@valme/os/seo/ui/ProximasAcciones";
import { fmtDateTime } from "@valme/os/ui/labels";
import { Card, CardHeader, PageHeader } from "@valme/os/ui/primitives";

export const metadata = { title: "Centro de mando · SEO · Valme OS" };

const TECHO = 100;
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 1000) / 10}%` : "—");

/**
 * CENTRO DE MANDO. «Tu atención, donde importa.» Lo que espera una decisión, la
 * capacidad, la cartera por estado, los indicadores de la semana y la visibilidad en IA.
 * Todo calculado: en Search OS eran cifras de demostración.
 */
export default async function CentroDeMando() {
  const seo = await seoModulo();
  const d = seo.datos;
  const cola = colaSupervision(d, seo.ambito);
  const ind = indicadores(d, seo.ambito);
  const carga = cargaAgentes(d, seo.ambito);
  const actividad = registro(d, seo.ambito).slice(0, 4);
  const nombre = (id: string) => seo.cliente(id)?.name;

  const clientes = seo.clientes.filter((c) => seo.ambito.has(c.id));
  const estados = clientes.map((c) => estadoCliente(d.altas.find((a) => a.clientId === c.id) ?? null, d.encargos.find((e) => e.clientId === c.id) ?? null));
  const enServicio = seo.altas.filter((a) => a.estado === "Activo").length;
  const cartera = [
    ["Plan aprobado", estados.filter((e) => e === "Plan aprobado").length],
    ["En diagnóstico o plan", estados.filter((e) => /Diagnóstico|Plan pendiente/.test(e)).length],
    ["Bloqueados", estados.filter((e) => /bloqueado/i.test(e)).length],
    ["Onboarding", estados.filter((e) => e === "Onboarding").length],
  ] as const;
  const encargos = seo.encargos;
  const planes = encargos.map((e) => ultimoPlan(e)).filter(Boolean);
  const trabajando = carga.filter((c) => c.abiertos > 0).length;

  return (
    <>
      <PageHeader title="Tu atención, donde importa." description={`${seo.filtro ? seo.filtro.name : "Todos los clientes"}. Los agentes ejecutan. Tú diriges.`} />

      <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader
            title={`${cola.length} intervenciones pendientes`}
            action={<Link href="/app/seo/supervision" className="text-[12px] text-os-muted hover:text-os-text">Abrir supervisión →</Link>}
          />
          {cola.length ? (
            <ul className="divide-y divide-os-border">
              {cola.slice(0, 3).map((x) => (
                <li key={x.id}>
                  <Link href={x.enlace} className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-os-sunken/50">
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium">{x.titulo}</span>
                      <span className="block text-xs text-os-muted">{nombre(x.clientId) ?? "Empresa nueva"} · {x.especialidad}</span>
                    </span>
                    <Estado t={x.estado} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="px-4 py-6 text-[13px] text-os-muted">✓ No hay intervenciones pendientes.</p>}
          <p className="border-t border-os-border px-4 py-2.5 text-xs text-os-muted">
            {cola.filter((x) => x.tipo === "Aprobación").length} aprobaciones · {cola.filter((x) => x.tipo === "Bloqueo").length} bloqueos · {cola.filter((x) => x.tipo === "Riesgo").length} riesgos.
          </p>
        </Card>

        <Card className="px-4 py-4">
          <p className="text-[11px] uppercase tracking-wide text-os-faint">Capacidad operativa</p>
          <p className="os-num mt-1 font-display text-3xl font-semibold">{enServicio} <span className="text-sm font-normal text-os-muted">/ {TECHO} clientes</span></p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-os-sunken" role="meter" aria-valuenow={enServicio} aria-valuemin={0} aria-valuemax={TECHO}>
            <div className="h-full bg-os-accent" style={{ width: `${Math.min(100, (enServicio / TECHO) * 100)}%` }} />
          </div>
          <p className="mt-2 text-xs text-os-muted">{TECHO - enServicio} plazas hasta el límite propuesto. {carga.filter((c) => c.carga > 80).length} especialidades por encima del 80% de carga.</p>
          <Link href="/app/seo/agentes" className="mt-2 inline-block text-[13px] font-medium hover:underline">Examinar capacidad →</Link>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader title="Cartera operativa" action={<Link href="/app/seo/clientes" className="text-[12px] text-os-muted hover:text-os-text">Ver cartera</Link>} />
        <div className="grid grid-cols-2 gap-4 px-4 py-4 lg:grid-cols-4">
          {cartera.map(([k, v]) => (
            <div key={k}><p className="os-num font-display text-2xl font-semibold">{v}</p><p className="text-xs text-os-muted">{k}</p></div>
          ))}
        </div>
        <p className="border-t border-os-border px-4 py-2.5 text-xs text-os-muted">{clientes.length} clientes · recuento calculado sobre la cartera, no fijado a mano.</p>
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Especialidades trabajando", `${trabajando} / 8`, "Con trabajo abierto ahora"],
          ["Acciones completadas · 7 días", String(ind.accionesCompletadas7d), "Con registro y enlace a su evidencia"],
          ["Entregas a tiempo", pct(ind.entregasATiempo.hechas, ind.entregasATiempo.total), `${ind.entregasATiempo.hechas} de ${ind.entregasATiempo.total} tareas con fecha`],
          ["Calidad a la primera", pct(ind.calidadALaPrimera.validadas, ind.calidadALaPrimera.total), `${ind.calidadALaPrimera.validadas} de ${ind.calidadALaPrimera.total} diagnósticos revisados`],
        ].map(([k, v, t]) => (
          <Card key={k} className="px-4 py-3">
            <p className="text-[11px] uppercase text-os-faint">{k}</p>
            <p className="os-num mt-1 font-display text-xl font-semibold">{v}</p>
            <p className="text-xs text-os-muted">{t}</p>
          </Card>
        ))}
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Resultados de cartera" action={<Link href="/app/seo/informes" className="text-[12px] text-os-muted hover:text-os-text">Informes →</Link>} />
          <div className="space-y-3 px-4 py-4 text-[13px]">
            <p>
              <span className="os-num font-display text-xl font-semibold">{pct(ind.citas.menciones, ind.citas.consultas)}</span>{" "}
              de respuestas con cita · {ind.citas.menciones}/{ind.citas.consultas} respuestas · {ind.citas.proyectos} proyectos medidos
            </p>
            <p className="text-xs text-os-muted">
              Clics y conversiones orgánicas: sin datos hasta tener Search Console y Analytics validados. No se muestran estimaciones.
            </p>
          </div>
        </Card>
        <Card>
          <CardHeader title="Actividad reciente" action={<Link href="/app/seo/operaciones" className="text-[12px] text-os-muted hover:text-os-text">Abrir registro →</Link>} />
          {actividad.length ? (
            <ul className="divide-y divide-os-border">
              {actividad.map((x) => (
                <li key={x.id} className="px-4 py-2.5">
                  <p className="text-[11px] text-os-faint">{fmtDateTime(x.en)} · {x.especialidad ?? "Equipo"}</p>
                  <p className="text-[13px]">{x.texto}</p>
                </li>
              ))}
            </ul>
          ) : <p className="px-4 py-5 text-[13px] text-os-muted">Sin actividad todavía.</p>}
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader title="Diagnóstico y planificación" action={<Link href="/app/seo/plan" className="text-[12px] text-os-muted hover:text-os-text">Plan y tareas →</Link>} />
        <div className="grid grid-cols-2 gap-4 px-4 py-4 lg:grid-cols-4">
          {[
            ["Encargos de diagnóstico", encargos.length, "Uno por cliente activado"],
            ["En curso o bloqueados", encargos.filter((e) => e.estado === "En curso" || e.estado === "Bloqueado").length, "Con limitaciones declaradas cuando falta un acceso"],
            ["Planes por decidir", planes.filter((p) => p?.estado === "Pendiente de aprobación").length, "Esperan al Project Manager"],
            ["Planes listos para ejecución", planes.filter((p) => p?.estado === "Listo para ejecución").length, "Aprobados; sin ejecutar"],
          ].map(([k, v, t]) => (
            <div key={k as string}><p className="os-num font-display text-2xl font-semibold">{v}</p><p className="text-xs font-medium">{k}</p><p className="text-xs text-os-muted">{t}</p></div>
          ))}
        </div>
      </Card>

      <ProximasAcciones
        tareas={seo.tareas.filter(abierta)}
        auditorias={seo.auditorias}
        hallazgos={seo.hallazgos}
        pms={seo.clientes.flatMap((c) => seo.pmsDe(c.id))}
        clienteDe={nombre}
        limite={5}
      />
    </>
  );
}
