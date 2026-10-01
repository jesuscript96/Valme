import { archivarAccion, cambiarEstadoAccion, ejecutarMotorAccion, importarPilotoAccion } from "@valme/os/seo/acciones";
import { ACCION_LABEL, DESCRIPCION, PIDE_MOTIVO, SIGUIENTE, SOLO_PM, TRANSICIONES, soloLectura } from "@valme/os/seo/estados";
import { admitePiloto } from "@valme/os/seo/herramientas";
import { ESTADO_LABEL, type Actor, type Auditoria, type EstadoAuditoria } from "@valme/os/seo/tipos";
import { Desplegable, Formulario } from "@valme/os/seo/ui/Formulario";
import { ActionButton } from "@valme/os/ui/ActionButton";
import { Card, Field, Input, Textarea } from "@valme/os/ui/primitives";

/** Pista de estados: dónde está el encargo dentro del recorrido completo. */
export function Pista({ estado }: { estado: EstadoAuditoria }) {
  const recorrido: EstadoAuditoria[] = [
    "borrador", "pendiente_autorizacion", "autorizado", "en_cola", "en_ejecucion",
    "control_calidad", "validado",
  ];
  const fuera = !recorrido.includes(estado);
  const actual = recorrido.indexOf(estado);
  return (
    <ol className="mb-5 grid grid-cols-7 gap-1 text-[11px]">
      {recorrido.map((e, i) => (
        <li key={e} className="space-y-1.5">
          <span
            className={
              "block h-1 rounded-full " +
              (!fuera && i <= actual ? "bg-os-accent" : "bg-os-border")
            }
          />
          <span className={i === actual ? "font-medium text-os-text" : "text-os-faint"}>
            {ESTADO_LABEL[e]}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** La siguiente decisión del encargo y el resto de salidas permitidas. */
export function Decisiones({
  a, actor, hallazgos,
}: { a: Auditoria; actor: Actor; hallazgos: number }) {
  if (soloLectura(a)) {
    return (
      <Card className="mb-6 px-4 py-4">
        <p className="text-[13px] text-os-muted">
          {a.archivadaEn
            ? `Auditoría archivada: fuera del trabajo diario y en solo lectura. Al restaurarla vuelve en su estado actual (${ESTADO_LABEL[a.estado]}).`
            : `${ESTADO_LABEL[a.estado]}: ${DESCRIPCION[a.estado]} No admite más cambios.`}
        </p>
        {a.archivadaEn && actor.pm ? (
          <div className="mt-3">
            <ActionButton action={archivarAccion.bind(null, a.id, false)} size="sm">
              Restaurar auditoría
            </ActionButton>
          </div>
        ) : null}
        {!a.archivadaEn && actor.pm ? (
          <div className="mt-3">
            <ActionButton
              action={archivarAccion.bind(null, a.id, true)}
              size="sm"
              confirm="¿Archivar la auditoría? Queda en solo lectura y se puede restaurar."
            >
              Archivar
            </ActionButton>
          </div>
        ) : null}
      </Card>
    );
  }

  // Autorizar y validar solo los ve un PM; al resto se le dice que le toca esperar.
  const permitido = (e: EstadoAuditoria) => actor.pm || !SOLO_PM.includes(e);
  const siguiente = SIGUIENTE[a.estado];
  const esperaPM = siguiente && !permitido(siguiente.a);
  const otras = TRANSICIONES[a.estado].filter((e) => e !== siguiente?.a && permitido(e));

  return (
    <Card className="mb-6">
      <div className="flex flex-wrap items-start justify-between gap-4 px-4 py-4">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-os-faint">Siguiente decisión</p>
          <p className="mt-1 text-sm font-semibold text-os-text">{siguiente?.label ?? "Sin paso siguiente"}</p>
          <p className="mt-1 text-[13px] text-os-muted">{DESCRIPCION[a.estado]}</p>
          {a.motivo && ["bloqueado", "devuelto"].includes(a.estado) ? (
            <p className="mt-2 text-[13px] text-os-warn">Motivo: {a.motivo}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-start gap-2">
          {esperaPM ? (
            <span className="rounded-md bg-os-sunken px-2.5 py-1.5 text-[13px] text-os-muted">Espera a un PM</span>
          ) : null}
          {siguiente && !esperaPM ? (
            <Transicion a={a} destino={siguiente.a} label={siguiente.label} principal />
          ) : null}
          {otras.map((e) => (
            <Transicion key={e} a={a} destino={e} label={ACCION_LABEL[e] ?? ESTADO_LABEL[e]} />
          ))}
          {actor.pm ? (
            <ActionButton
              action={archivarAccion.bind(null, a.id, true)}
              size="sm"
              variant="ghost"
              confirm="¿Archivar la auditoría? Queda en solo lectura y se puede restaurar."
            >
              Archivar
            </ActionButton>
          ) : null}
        </div>
      </div>

      {a.estado === "en_ejecucion" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-os-border px-4 py-3">
          <p className="max-w-2xl text-[13px] text-os-muted">
            <span className="font-medium text-os-text">Motor SEO de Valme.</span> Recoge DNS, HTTP, robots,
            sitemap, llms.txt, bots de IA, indexación, title, descripción, JSON-LD y un rastreo del sitemap
            {a.servicios.includes("AEO/GEO") ? "; con AEO/GEO, además pregunta a un asistente si cita a la empresa" : ""}.
            Guarda las señales como evidencias y lo que falla como hallazgos pendientes de decisión.
          </p>
          <ActionButton action={ejecutarMotorAccion.bind(null, a.id)} size="sm" pendingLabel="Auditando… (hasta 1 min)">
            Ejecutar motor SEO
          </ActionButton>
        </div>
      ) : null}

      {admitePiloto(a) && hallazgos === 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-os-border px-4 py-3">
          <p className="max-w-2xl text-[13px] text-os-muted">
            <span className="font-medium text-os-text">Revisión externa disponible · 27 sep 2026.</span> 5 hallazgos
            y las 8 páginas revisadas de valmesolutions.com. Se registran como revisión, no como ejecución
            automática; después decides sobre cada hallazgo.
          </p>
          <ActionButton
            action={importarPilotoAccion.bind(null, a.id)}
            size="sm"
            confirm="¿Cargar la revisión externa de VALME en esta auditoría?"
          >
            Cargar revisión externa
          </ActionButton>
        </div>
      ) : null}
    </Card>
  );
}

function Transicion({
  a, destino, label, principal,
}: { a: Auditoria; destino: EstadoAuditoria; label: string; principal?: boolean }) {
  const accion = cambiarEstadoAccion.bind(null, a.id, destino);
  const motivo = PIDE_MOTIVO.includes(destino);
  const referencia = destino === "autorizado";

  if (!motivo && !referencia) {
    return (
      <Formulario accion={accion} boton={label} variante={principal ? "primary" : "secondary"} pendiente="…" />
    );
  }
  return (
    <Desplegable titulo={principal ? `${label} ▾` : label}>
      <Formulario
        accion={accion}
        boton={label}
        variante={destino === "cancelado" ? "danger" : "primary"}
        className="w-80"
      >
        {referencia ? (
          <Field label="Referencia de la autorización" hint="Correo, reunión o contrato donde se aprueba el alcance.">
            <Input name="referencia" required placeholder="Correo del 28/09 de dirección" />
          </Field>
        ) : null}
        {motivo ? (
          <Field label="Motivo">
            <Textarea name="motivo" required placeholder="Por qué, en una o dos frases" />
          </Field>
        ) : null}
      </Formulario>
    </Desplegable>
  );
}
