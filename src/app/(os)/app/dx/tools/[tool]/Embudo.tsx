"use client";

import { AlertTriangle, Check, CircleDashed, KeyRound } from "lucide-react";
import { Badge, Card, CardHeader, cx, type Tone } from "@/os/ui/primitives";
import { FUNCIONES, PASOS, type Auditoria, type Gravedad, type Hallazgo, type Paso } from "@/os/audit/types";
import type { Comprobacion, EstadoComprobacion } from "@/os/audit/web-checks";

const TONO: Record<Gravedad, Tone> = { p0: "accent", p1: "accent", p2: "warn", p3: "neutral" };
const PESO: Record<Gravedad, number> = { p0: 25, p1: 12, p2: 5, p3: 2 };

export type ComprobacionEvaluada = Comprobacion & { estado: EstadoComprobacion };

/**
 * Informe de la auditoría Web, ordenado como el embudo.
 *
 * La decisión de diseño: no se enseña una lista de problemas por categoría técnica, sino
 * el recorrido de una persona desde que hace clic hasta que deja sus datos, con los
 * problemas colgando del paso donde se va. Así el informe se lee de arriba abajo y la
 * conversación sale sola.
 */
export function Embudo({
  a, comprobaciones,
}: {
  a: Auditoria;
  comprobaciones: ComprobacionEvaluada[];
}) {
  const problemas = a.hallazgos.filter((h) => !h.positivo);
  const positivos = a.hallazgos.filter((h) => h.positivo);

  const pasos = (Object.keys(PASOS) as Paso[]).map((clave) => {
    const del = problemas.filter((h) => h.paso === clave);
    const comps = comprobaciones.filter((c) => c.paso === clave);
    const hechas = comps.filter((c) => c.estado === "respondida").length;
    // Nota por paso: se parte de 100 y se descuenta por gravedad. Explicable en voz alta.
    const nota = Math.max(0, 100 - del.reduce((t, h) => t + PESO[h.gravedad], 0));
    // Si no se ha podido comprobar nada de este paso, NO está bien: no se sabe. Decir
    // «sin problemas» con cero comprobaciones hechas es la peor mentira que puede contar
    // un informe, porque suena a aprobado.
    const sinDatos = hechas === 0;
    return { clave, ...PASOS[clave], hallazgos: del, comps, hechas, nota, sinDatos };
  });

  const sinPaso = problemas.filter((h) => !h.paso);

  return (
    <div className="space-y-4">
      <ResumenEmbudo pasos={pasos} />

      {positivos.length > 0 ? (
        <Card>
          <CardHeader title="Lo que funciona" />
          <ul className="divide-y divide-os-border">
            {positivos.map((h) => (
              <li key={h.id} className="flex items-start gap-2.5 px-4 py-3">
                <Check className="mt-0.5 size-4 shrink-0 text-os-ok" aria-hidden />
                <span>
                  <span className="block text-[13px] font-medium text-os-ok">{h.titulo}</span>
                  <span className="mt-0.5 block text-[13px] leading-relaxed text-os-muted">
                    {h.consecuencia}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {pasos.map((p) => (
        <Card key={p.clave}>
          <div className="flex flex-wrap items-center gap-3 border-b border-os-border px-4 py-3">
            <span className="os-num flex size-7 shrink-0 items-center justify-center rounded-full bg-os-sunken text-[12px] font-semibold text-os-muted">
              {p.n}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-[15px] font-semibold text-os-text">{p.titulo}</span>
              <span className="block text-[12px] text-os-muted">{p.desc}</span>
            </span>
            <span className="os-num text-[12px] text-os-faint">{p.hechas}/{p.comps.length} comprobado</span>
            {p.sinDatos
              ? <Badge tone="neutral">sin datos</Badge>
              : p.hallazgos.length === 0
                ? <Badge tone="ok">sin problemas</Badge>
                : <Badge tone={TONO[p.hallazgos[0].gravedad]}>{p.hallazgos.length}</Badge>}
          </div>

          {p.sinDatos ? (
            <p className="px-4 py-5 text-[13px] text-os-warn">
              No se ha podido comprobar nada de este paso. Mira abajo qué fuente ha
              fallado: esto no significa que esté bien, significa que no se sabe.
            </p>
          ) : p.hallazgos.length === 0 ? (
            <p className="px-4 py-5 text-[13px] text-os-muted">
              Nada que señalar con lo que se ha podido comprobar en este paso.
            </p>
          ) : (
            <ul className="divide-y divide-os-border">
              {p.hallazgos.map((h) => <Fila key={h.id} h={h} />)}
            </ul>
          )}

          <Comprobadas comps={p.comps} />
        </Card>
      ))}

      {sinPaso.length > 0 ? (
        <Card>
          <CardHeader title="Otros hallazgos" />
          <ul className="divide-y divide-os-border">
            {sinPaso.map((h) => <Fila key={h.id} h={h} />)}
          </ul>
        </Card>
      ) : null}

      {a.fuentesNoDisponibles.length > 0 ? (
        <Card className="border-os-warn/30 bg-os-warn-soft p-4">
          <p className="mb-2 flex items-center gap-2 text-[13px] font-medium text-os-warn">
            <AlertTriangle className="size-4" aria-hidden />
            Lo que no se ha podido comprobar
          </p>
          <ul className="space-y-1.5">
            {a.fuentesNoDisponibles.map((f) => (
              <li key={f.fuente} className="text-[13px] leading-relaxed text-os-warn">
                <strong>{f.fuente}:</strong> {f.motivo}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[12px] leading-relaxed text-os-warn">
            Esto va en la portada del informe del cliente. No haber podido mirar algo no es
            lo mismo que que esté bien.
          </p>
        </Card>
      ) : null}
    </div>
  );
}

/** Barra del embudo: cinco pasos y dónde se pierde la gente, de un vistazo. */
function ResumenEmbudo({
  pasos,
}: {
  pasos: { clave: Paso; n: number; titulo: string; nota: number; hallazgos: Hallazgo[]; sinDatos: boolean }[];
}) {
  return (
    <Card className="p-4">
      <p className="mb-3 text-[13px] font-semibold text-os-text">
        Del clic al lead, dónde se pierde
      </p>
      <div className="flex gap-1.5">
        {pasos.map((p) => {
          const graves = p.hallazgos.filter((h) => h.gravedad === "p0" || h.gravedad === "p1").length;
          const color = p.sinDatos ? "bg-os-border-strong"
            : graves > 0 ? "bg-os-accent"
            : p.hallazgos.length > 0 ? "bg-os-warn" : "bg-os-ok";
          return (
            <a
              key={p.clave}
              href={`#paso-${p.clave}`}
              className="min-w-0 flex-1 rounded-md border border-os-border p-2.5 transition-colors hover:border-os-border-strong"
            >
              <span className="block truncate text-[12px] font-medium text-os-text">{p.titulo}</span>
              <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-os-sunken">
                <span className={cx("block h-full", color)} style={{ width: `${p.sinDatos ? 100 : p.nota}%` }} />
              </span>
              <span className="os-num mt-1.5 block text-[11px] text-os-muted">
                {p.sinDatos
                  ? "sin datos"
                  : p.hallazgos.length === 0
                    ? "sin problemas"
                    : `${p.hallazgos.length} hallazgo${p.hallazgos.length > 1 ? "s" : ""}`}
              </span>
            </a>
          );
        })}
      </div>
    </Card>
  );
}

function Fila({ h }: { h: Hallazgo }) {
  return (
    <li className="px-4 py-3.5" id={h.paso ? `paso-${h.paso}` : undefined}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge tone={TONO[h.gravedad]}>{h.gravedad.toUpperCase()}</Badge>
        <span className="text-[13px] font-semibold text-os-text">{h.titulo}</span>
        <span className="text-[11px] text-os-faint">{FUNCIONES[h.funcion].nombre}</span>
      </div>
      <dl className="space-y-1 text-[13px] leading-relaxed">
        {([["Situación", h.situacion], ["Consecuencia", h.consecuencia], ["Solución", h.solucion]] as const)
          .map(([k, v]) => (
            <div key={k} className="grid grid-cols-[96px_minmax(0,1fr)] gap-2">
              <dt className="text-[12px] text-os-faint">{k}</dt>
              <dd className="min-w-0 text-os-text">{v}</dd>
            </div>
          ))}
      </dl>
      <p className="mt-2 font-mono text-[11px] text-os-faint">
        evidencia: {h.evidencia.join(", ")} · confianza {h.confianza}
      </p>
    </li>
  );
}

/** Qué se ha mirado en este paso. Plegado, para que no tape los hallazgos. */
function Comprobadas({ comps }: { comps: ComprobacionEvaluada[] }) {
  if (!comps.length) return null;
  const hechas = comps.filter((c) => c.estado === "respondida").length;

  return (
    <details className="border-t border-os-border">
      <summary className="cursor-pointer px-4 py-2.5 text-[12px] text-os-muted hover:text-os-text">
        Qué se ha mirado en este paso ({hechas} de {comps.length})
      </summary>
      <ul className="divide-y divide-os-border border-t border-os-border">
        {comps.map((c) => (
          <li key={c.señal} className="flex items-start gap-2.5 px-4 py-2">
            {c.estado === "respondida"
              ? <Check className="mt-0.5 size-3.5 shrink-0 text-os-ok" aria-hidden />
              : c.estado === "bloqueada"
                ? <KeyRound className="mt-0.5 size-3.5 shrink-0 text-os-warn" aria-hidden />
                : <CircleDashed className="mt-0.5 size-3.5 shrink-0 text-os-faint" aria-hidden />}
            <span className="min-w-0">
              <span className={cx("block text-[12px]", c.estado === "respondida" ? "text-os-text" : "text-os-muted")}>
                {c.que}
              </span>
              <span className="block text-[11px] leading-relaxed text-os-faint">
                {c.estado === "bloqueada" ? `Falta ${c.necesita}` : c.como}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
