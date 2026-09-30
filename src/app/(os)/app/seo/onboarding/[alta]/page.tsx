import Link from "next/link";
import { notFound } from "next/navigation";
import { seoModulo } from "@/os/seo";
import { activarAltaAccion, excepcionAccion, guardarPasoAccion } from "@/os/seo/operacion/acciones";
import { pendientes, progreso, puedeActivar, requisitos, rutaAlta } from "@/os/seo/operacion/onboarding";
import {
  ACCIONES_AUTONOMIA, CAMPOS, ESPECIALIDADES, ESTADOS_ACCESO, HERRAMIENTAS_ACCESO, NIVELES_AUTONOMIA,
  PASOS_ALTA, SERVICIOS_ALTA, SITUACION_INICIAL, type Alta, type CampoId,
} from "@/os/seo/operacion/tipos";
import { Estado } from "@/os/seo/ui/etiquetas";
import { Formulario } from "@/os/seo/ui/Formulario";
import { ActionButton } from "@/os/ui/ActionButton";
import { Badge, Card, CardHeader, Input, Select, Textarea, cx } from "@/os/ui/primitives";

export async function generateMetadata({ params }: { params: Promise<{ alta: string }> }) {
  const { alta } = await params;
  return { title: `${alta} · Onboarding · Valme OS` };
}

const AREAS: CampoId[] = ["entregables", "exclusiones", "limites", "prioritarios", "publico", "objetivos", "marca", "materiales", "restricciones", "previos", "fuentes", "incidencias"];
const FECHAS: CampoId[] = ["inicio", "revision"];
const AYUDA: Partial<Record<CampoId, string>> = {
  aprobador: "Quién autoriza publicaciones y envíos.",
  exclusiones: "Lo que no se hará aunque lo pida un agente.",
  base: "No se prometen posiciones ni resultados garantizados.",
};

/** Asistente de alta en ocho pasos. `?vista=cliente` muestra solo lo que aporta su equipo. */
export default async function Asistente({
  params, searchParams,
}: { params: Promise<{ alta: string }>; searchParams: Promise<{ paso?: string; vista?: string }> }) {
  const { alta: id } = await params;
  const sp = await searchParams;
  const seo = await seoModulo();
  const a = seo.datos.altas.find((x) => x.id === id && (!x.clientId || seo.clientes.some((c) => c.id === x.clientId)));
  if (!a) notFound();

  const vistaCliente = sp.vista === "cliente";
  const pasos = PASOS_ALTA.filter((p) => !vistaCliente || p.cliente);
  const paso = pasos.find((p) => p.letra === sp.paso) ?? pasos[0]!;
  const i = pasos.indexOf(paso);
  const activo = a.estado === "Activo";
  const pend = pendientes(a);
  const pendientesDe = new Set(pend.map((p) => p.id));
  const q = vistaCliente ? "&vista=cliente" : "";

  const campo = (cid: CampoId, etiqueta?: string) => {
    const def = CAMPOS.find((c) => c.id === cid)!;
    const valor = a.datos[cid] ?? "";
    const falta = def.req && pendientesDe.has(cid);
    return (
      <label key={cid} className={cx("block space-y-1.5", AREAS.includes(cid) && "sm:col-span-2")}>
        <span className="flex items-center gap-2 text-[13px] font-medium text-os-text">
          {etiqueta ?? def.label}
          {def.req ? <span className={cx("text-[11px] font-normal", falta ? "text-os-warn" : "text-os-faint")}>obligatorio</span> : null}
        </span>
        {cid === "base" ? (
          <Select name={cid} defaultValue={valor}>
            <option value="">Sin indicar</option>
            {SITUACION_INICIAL.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        ) : AREAS.includes(cid) ? (
          <Textarea name={cid} defaultValue={valor} className={falta ? "border-os-warn/50" : undefined} />
        ) : (
          <Input name={cid} defaultValue={valor} type={FECHAS.includes(cid) ? "date" : "text"} placeholder={cid === "dominio" ? "ejemplo.com" : undefined} className={falta ? "border-os-warn/50" : undefined} />
        )}
        {AYUDA[cid] ? <span className="block text-xs text-os-muted">{AYUDA[cid]}</span> : null}
      </label>
    );
  };

  return (
    <>
      <nav className="mb-3 text-[13px] text-os-muted">
        <Link href="/app/seo/onboarding" className="hover:text-os-text">← Onboarding</Link>
      </nav>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="os-num text-[11px] uppercase tracking-wide text-os-faint">
            {vistaCliente ? "Completar información" : "Asistente"} / {a.id}
          </p>
          <h1 className="font-display text-xl font-semibold tracking-tight text-os-text">{a.datos.nombre || "Nuevo cliente"}</h1>
          <p className="mt-1 text-[13px] text-os-muted">
            {vistaCliente ? "Vista del cliente: solo los datos que aporta su equipo." : `Paso ${paso.letra} de H · ${pend.length} campos obligatorios pendientes · ${progreso(a)}%`}
          </p>
        </div>
        <Estado t={a.estado} />
      </header>

      <nav className="mb-5 flex flex-wrap gap-1.5">
        {pasos.map((p) => (
          <Link
            key={p.letra}
            href={`${rutaAlta(a.id)}?paso=${p.letra}${q}`}
            aria-current={p.letra === paso.letra ? "step" : undefined}
            className={cx(
              "rounded-md border px-2.5 py-1 text-[12px]",
              p.letra === paso.letra ? "border-os-text bg-os-text text-white" : "border-os-border bg-os-surface text-os-muted hover:text-os-text",
            )}
          >
            <span className="font-semibold">{p.letra}</span> {p.titulo}
          </Link>
        ))}
      </nav>

      <Card>
        <CardHeader
          title={`${paso.letra}. ${paso.titulo}`}
          action={<Badge tone={paso.cliente ? "info" : "neutral"}>{paso.cliente ? "Vista del cliente" : "Acción interna"}</Badge>}
        />
        <div className="px-4 py-4">
          {paso.letra === "H" ? (
            <Revision a={a} />
          ) : (
            <Formulario
              accion={guardarPasoAccion.bind(null, a.id, paso.letra)}
              boton="Guardar"
              reiniciar={false}
              deshabilitado={activo}
              botones={[
                { valor: "anterior", label: "← Paso anterior", disabled: i === 0 },
                { valor: "siguiente", label: "Paso siguiente →", variante: "primary", disabled: i === pasos.length - 1 },
                { valor: "salir", label: "Guardar borrador y salir", variante: "ghost" },
              ]}
            >
              <input type="hidden" name="vista" value={vistaCliente ? "cliente" : ""} />
              <fieldset disabled={activo} className="grid gap-4 sm:grid-cols-2">
                {paso.letra === "A" ? (["nombre", "dominio", "sector", "mercados", "contacto", "aprobador", "pm"] as CampoId[]).map((c) => campo(c)) : null}
                {paso.letra === "B" ? (
                  <>
                    <fieldset className="space-y-1.5 sm:col-span-2">
                      <legend className="text-[13px] font-medium text-os-text">Servicios contratados <span className="text-[11px] font-normal text-os-faint">obligatorio</span></legend>
                      <div className="flex flex-wrap gap-4 text-[13px]">
                        {SERVICIOS_ALTA.map((s) => (
                          <label key={s} className="inline-flex items-center gap-2">
                            <input type="checkbox" name="servicios" value={s} defaultChecked={a.servicios.includes(s)} /> {s}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    {(["entregables", "exclusiones", "inicio", "revision", "limites"] as CampoId[]).map((c) => campo(c))}
                  </>
                ) : null}
                {paso.letra === "C" ? (["prioritarios", "publico", "competidores", "objetivos", "indicadores", "base"] as CampoId[]).map((c) => campo(c)) : null}
                {paso.letra === "D" ? (["marca", "materiales", "restricciones", "previos", "fuentes"] as CampoId[]).map((c) => campo(c)) : null}
                {paso.letra === "E" ? (
                  <div className="space-y-3 sm:col-span-2">
                    <p className="text-[13px] text-os-muted">
                      Indica qué herramientas entran en el servicio y en qué estado está cada permiso. No pedimos contraseñas ni
                      claves: nunca las escribas aquí.
                    </p>
                    {HERRAMIENTAS_ACCESO.map((h) => (
                      <div key={h.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-os-border px-3 py-2.5">
                        <div>
                          <p className="text-[13px] font-medium text-os-text">{h.nombre}</p>
                          <p className="text-xs text-os-muted">{h.finalidad} · permiso mínimo: {h.permiso} · responsable: cliente</p>
                        </div>
                        <Select name={`acceso_${h.id}`} defaultValue={a.accesos[h.id]} className="w-44">
                          {ESTADOS_ACCESO.map((s) => <option key={s} value={s}>{s}</option>)}
                        </Select>
                      </div>
                    ))}
                  </div>
                ) : null}
                {paso.letra === "F" ? (
                  <div className="space-y-3 sm:col-span-2">
                    <p className="text-[13px] text-os-muted">
                      Define qué puede hacer un agente por sí mismo y qué necesita una decisión humana. El nivel de confianza del
                      agente nunca amplía estos permisos.
                    </p>
                    {ACCIONES_AUTONOMIA.map((x) => (
                      <div key={x.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-os-border px-3 py-2.5">
                        <div>
                          <p className="text-[13px] font-medium text-os-text">{x.label}</p>
                          <p className="text-xs text-os-muted">{x.sensible ? "Acción sensible: requiere autorización humana" : "Trabajo preparatorio dentro del alcance"}</p>
                        </div>
                        <Select name={`autonomia_${x.id}`} defaultValue={a.autonomia[x.id]} className="w-60">
                          {NIVELES_AUTONOMIA.filter((n) => !x.sensible || n !== "El agente prepara y ejecuta").map((n) => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </Select>
                      </div>
                    ))}
                    {campo("incidencias")}
                  </div>
                ) : null}
                {paso.letra === "G" ? (
                  <>
                    <p className="text-[13px] text-os-muted sm:col-span-2">
                      Asigna solo las especialidades que el alcance contratado necesita. Alcance actual:{" "}
                      {a.servicios.join(", ") || "sin definir"}
                      {a.servicios.length ? ` · sugerencia: ${Math.min(8, a.servicios.length + 3)} especialidades.` : "."}
                    </p>
                    <fieldset className="grid gap-2 sm:col-span-2 sm:grid-cols-2">
                      {ESPECIALIDADES.map((e) => (
                        <label key={e} className="inline-flex items-center gap-2 text-[13px]">
                          <input type="checkbox" name="equipo" value={e} defaultChecked={a.equipo.includes(e)} /> {e}
                        </label>
                      ))}
                    </fieldset>
                    {campo("pm", "Project Manager responsable")}
                    <label className="block space-y-1.5">
                      <span className="text-[13px] font-medium text-os-text">Responsable de calidad <span className="text-[11px] font-normal text-os-faint">obligatorio</span></span>
                      <Input name="responsableCalidad" defaultValue={a.responsableCalidad} />
                    </label>
                    <p className="rounded-md bg-os-sunken px-3 py-2 text-xs text-os-muted sm:col-span-2">
                      Capacidad estimada: {a.equipo.length} especialidades ocupan 1 plaza de cartera y unas{" "}
                      {Math.max(1, Math.round(a.equipo.length * 0.5))} h de revisión humana al ciclo. Dependencias: auditoría antes de
                      estrategia; estrategia antes de ejecución; control de calidad antes de cualquier entrega.
                    </p>
                  </>
                ) : null}
              </fieldset>
            </Formulario>
          )}
        </div>
      </Card>

      <p className="mt-3 text-xs text-os-muted">
        {vistaCliente
          ? "Vista del cliente: así vería el formulario su equipo. No hay acceso del cliente a la aplicación."
          : "Puedes salir y continuar más tarde: el borrador conserva todo lo guardado."}
        {activo ? " Este onboarding ya está activo: los campos se muestran solo para consulta." : ""}
      </p>
    </>
  );
}

function Revision({ a }: { a: Alta }) {
  const reqs = requisitos(a);
  const pend = pendientes(a);
  const puede = puedeActivar(a);
  const validados = HERRAMIENTAS_ACCESO.filter((h) => a.accesos[h.id] === "Validado").length;
  const resumen = [
    ["Cliente", `${a.datos.nombre || "Sin nombre"} · ${a.datos.dominio || "sin dominio"}`],
    ["Servicio", a.servicios.join(", ") || "Sin definir"],
    ["Equipo", `${a.equipo.length} especialidades · calidad: ${a.responsableCalidad || "sin asignar"}`],
    ["Accesos validados", `${validados} de ${HERRAMIENTAS_ACCESO.length}`],
    ["Situación inicial", a.datos.base || "Sin declarar"],
    ["Estado", a.estado],
  ];
  return (
    <div className="space-y-5">
      <p className="text-[13px] text-os-muted">Resumen y comprobación de requisitos antes de que el PM autorice el diagnóstico.</p>
      <dl className="grid gap-x-6 gap-y-3 text-[13px] sm:grid-cols-2">
        {resumen.map(([k, v]) => (
          <div key={k}>
            <dt className="text-[11px] uppercase tracking-wide text-os-faint">{k}</dt>
            <dd className="text-os-text">{v}</dd>
          </div>
        ))}
      </dl>

      <div>
        <h3 className="mb-2 text-[13px] font-semibold">Checklist de requisitos</h3>
        <ul className="divide-y divide-os-border rounded-md border border-os-border">
          {reqs.map((r) => {
            const ex = a.excepciones.find((e) => e.req === r.id);
            return (
              <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge tone={r.ok ? "ok" : ex ? "warn" : "accent"}>{r.ok ? "Cumplido" : ex ? "Excepción registrada" : "Pendiente"}</Badge>
                    <span className="text-[13px] font-medium">{r.label}</span>
                  </div>
                  <p className="text-xs text-os-muted">{r.detalle} · requisito {r.dispensable ? "dispensable" : "indispensable"}</p>
                  {ex ? <p className="text-xs text-os-warn">Excepción del PM: {ex.motivo} · {ex.por}</p> : null}
                </div>
                {!r.ok && r.dispensable && !ex && a.estado === "Borrador" ? (
                  <Formulario accion={excepcionAccion.bind(null, a.id, r.id)} boton="Registrar excepción" variante="secondary" className="w-72">
                    <Textarea name="motivo" placeholder="Por qué el PM asume este requisito pendiente" className="min-h-14" />
                  </Formulario>
                ) : (
                  <span className="text-xs text-os-faint">{r.ok ? "✓" : r.dispensable ? "—" : "Sin excepción posible"}</span>
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-xs text-os-muted">
          Las excepciones solo se admiten en requisitos dispensables y quedan registradas con su motivo. Nunca sustituyen una autorización.
        </p>
      </div>

      {pend.length ? (
        <div>
          <h3 className="mb-2 text-[13px] font-semibold">Campos pendientes ({pend.length})</h3>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {pend.slice(0, 12).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 rounded-md bg-os-sunken px-3 py-1.5 text-[13px]">
                <span>{p.label}</span>
                <Link href={`${rutaAlta(a.id)}?paso=${p.paso}`} className="text-xs text-os-muted hover:text-os-text">Paso {p.paso} →</Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {a.estado === "Borrador" ? (
        <div className="space-y-2">
          <ActionButton action={activarAltaAccion.bind(null, a.id)} variant="primary" disabled={!puede} confirm="¿Aprobar el onboarding y crear el encargo de diagnóstico?">
            Aprobar y activar el diagnóstico
          </ActionButton>
          <p className="text-xs text-os-muted">
            {puede
              ? "Activar registra la aprobación del PM y crea el encargo de diagnóstico; no ejecuta trabajo ni envía nada al cliente."
              : "No se puede activar el servicio mientras falte un requisito indispensable."}
          </p>
        </div>
      ) : (
        <p className="text-[13px] text-os-ok">Activado. El encargo de diagnóstico está en la ficha del cliente.</p>
      )}

      <details className="text-xs text-os-muted">
        <summary className="cursor-pointer">Historial del alta</summary>
        <ul className="mt-2 space-y-1">{a.historial.map((h, i) => <li key={i}>{h}</li>)}</ul>
      </details>
    </div>
  );
}
