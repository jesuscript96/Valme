import Link from "next/link";
import { seoModulo } from "@valme/os/seo";
import { nuevaAltaAccion } from "@valme/os/seo/operacion/acciones";
import { pendientes, progreso, rutaAlta } from "@valme/os/seo/operacion/onboarding";
import type { Alta } from "@valme/os/seo/operacion/tipos";
import { Estado, fmtDia } from "@valme/os/seo/ui/etiquetas";
import { Desplegable, Formulario } from "@valme/os/seo/ui/Formulario";
import { Card, CardHeader, Field, Input, PageHeader, Select } from "@valme/os/ui/primitives";

export const metadata = { title: "Onboarding · SEO · Valme OS" };

/** Alta de clientes: sin información validada no empieza el trabajo. */
export default async function Onboarding() {
  const seo = await seoModulo();
  const borradores = seo.altas.filter((a) => a.estado === "Borrador");
  const activas = seo.altas.filter((a) => a.estado === "Activo");
  const sinAlta = seo.clientes.filter((c) => !seo.datos.altas.some((a) => a.clientId === c.id));

  const stats = [
    { label: "Borradores en curso", valor: borradores.length, nota: "Esperan información o autorización" },
    { label: "Onboardings activos", valor: activas.length, nota: "Diagnóstico autorizado por el PM" },
    { label: "Accesos pendientes", valor: seo.altas.reduce((s, a) => s + Object.values(a.accesos).filter((x) => x === "Pendiente").length, 0), nota: "Solicitados y sin validar" },
    { label: "Excepciones registradas", valor: seo.altas.reduce((s, a) => s + a.excepciones.length, 0), nota: "Solo requisitos dispensables" },
  ];

  return (
    <>
      <PageHeader
        title="Onboarding"
        description="Sin información validada no empieza el trabajo. El asistente guía los ocho pasos y el PM autoriza la activación."
        action={
          <Desplegable titulo="+ Nuevo cliente">
            <Formulario accion={nuevaAltaAccion} boton="Abrir asistente" pendiente="Abriendo…" className="w-80">
              <Field label="¿Para quién?" hint="Una empresa nueva se da de alta como cliente de Valme al activar.">
                <Select name="clientId" defaultValue="">
                  <option value="">Empresa nueva</option>
                  {sinAlta.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Nombre (si ya es cliente, se toma el suyo)">
                <Input name="nombre" placeholder="Nombre comercial" />
              </Field>
            </Formulario>
          </Desplegable>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-os-faint">{s.label}</p>
            <p className="os-num mt-1 font-display text-xl font-semibold text-os-text">{s.valor}</p>
            <p className="text-xs text-os-muted">{s.nota}</p>
          </Card>
        ))}
      </div>

      <Card className="mb-6">
        <CardHeader title="Borradores y altas en curso" action={<span className="os-num text-[11px] uppercase text-os-faint">{borradores.length} abiertos</span>} />
        {borradores.length ? <Lista altas={borradores} cliente={seo.cliente} /> : <p className="px-4 py-6 text-[13px] text-os-muted">No hay borradores abiertos.</p>}
      </Card>

      <Card className="mb-6">
        <CardHeader title="Onboardings activos" action={<span className="text-[11px] uppercase text-os-faint">Consulta</span>} />
        {activas.length ? <Lista altas={activas} cliente={seo.cliente} /> : <p className="px-4 py-6 text-[13px] text-os-muted">Aún no hay onboardings activos.</p>}
      </Card>

      <p className="text-xs text-os-muted">
        <span className="font-medium text-os-text">«Nuevo cliente» es una acción interna.</span> «Vista del cliente» muestra el
        formulario que completaría su equipo: solo empresa, negocio, contexto y accesos. Nunca se piden contraseñas ni claves.
      </p>
    </>
  );
}

function Lista({ altas, cliente }: { altas: Alta[]; cliente: (id: string) => { name: string } | null }) {
  return (
    <ul className="divide-y divide-os-border">
      {altas.map((a) => {
        const n = pendientes(a).length;
        const pct = progreso(a);
        return (
          <li key={a.id} className="flex flex-wrap items-center justify-between gap-4 px-4 py-3">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 text-[11px] text-os-faint">
                <Estado t={a.estado} />
                <span className="os-num">{a.id} · {fmtDia(a.creadaEn)}</span>
              </div>
              <p className="text-[13px] font-medium text-os-text">
                {a.datos.nombre || (a.clientId ? cliente(a.clientId)?.name : null) || "Sin nombre"}
              </p>
              <p className="text-xs text-os-muted">
                {a.servicios.join(" · ") || "Servicio sin definir"} · {n ? `${n} campos pendientes` : "información completa"}
              </p>
              <div className="h-1 w-48 overflow-hidden rounded-full bg-os-sunken" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full bg-os-accent" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`${rutaAlta(a.id)}?paso=${a.estado === "Activo" ? "H" : "A"}`} className="inline-flex h-7 items-center rounded-md bg-os-text px-2.5 text-[13px] font-medium text-white hover:bg-black">
                {a.estado === "Activo" ? "Consultar" : "Continuar"}
              </Link>
              <Link href={`${rutaAlta(a.id)}?paso=A&vista=cliente`} className="inline-flex h-7 items-center rounded-md border border-os-border bg-os-surface px-2.5 text-[13px] font-medium text-os-text hover:bg-os-sunken">
                Vista del cliente
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
